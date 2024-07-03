/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "logger.h"

#include <aws/common/linked_list.h>
#include <aws/common/log_channel.h>
#include <aws/common/log_formatter.h>
#include <aws/common/log_writer.h>
#include <aws/common/mutex.h>
#include <aws/common/ring_buffer.h>

#include <ctype.h>

#define LOG_RING_BUFFER_CAPACITY (128 * 1024)

#ifdef _MSC_VER
#    pragma warning(disable : 4204)
#endif /* _MSC_VER */

/*
 * One of these is allocated per napi_env/thread and stored in TLS. Worker threads will call into
 * their env's instance, and all other event loop threads will call into the main thread's
 * instance.
 */
struct aws_napi_logger_ctx {
    napi_env env;
    struct aws_allocator *allocator;
    /* ring buffer for copying log messages for queueing */
    struct aws_ring_buffer buffer;
    /* allocator that uses the ring buffer */
    struct aws_allocator buffer_allocator;
    /* messages to be logged, filled from any thread, drained from node thread */
    struct {
        struct aws_mutex mutex;
        struct aws_linked_list messages;
    } msg_queue;
    /* log function in node */
    napi_threadsafe_function log_drain;
};

static AWS_THREAD_LOCAL struct aws_napi_logger_ctx *tl_logger_ctx;

/* aws_log_pipeline components */
static struct {
    struct aws_logger logger;
    struct aws_log_formatter formatter;
    struct aws_log_writer writer;
    struct aws_log_channel channel;
    struct aws_napi_logger_ctx *default_ctx;
} s_napi_logger;

struct log_message {
    struct aws_linked_list_node node;
    struct aws_string *message;
};

/* custom aws_log_writer that writes via process._rawDebug() within the node env via threadsafe function */
static int s_napi_log_writer_write(struct aws_log_writer *writer, const struct aws_string *output) {
    (void)writer;
    struct aws_napi_logger_ctx *ctx = tl_logger_ctx ? tl_logger_ctx : s_napi_logger.default_ctx;
    /* this can only happen if someone tries to log after the main thread has cleaned up */
    AWS_FATAL_ASSERT(ctx && "No TLS log context, and no default fallback");

    /* node will append a newline, so strip the ones from the logger */
    size_t newlines = 0;
    while (isspace((const char)(aws_string_bytes(output)[output->len - newlines - 1])) && newlines < output->len) {
        ++newlines;
    }

    /*
     * If log_drain is null, it's been released and we can't use it anymore, but we don't want
     * to lose logs at shutdown. Node should not close and re-open stderr at this point, so we'll
     * just write to it immediately. These messages will escape any application log overrides.
     */
    if (!ctx->log_drain) {
#ifdef AWS_NAPI_LOG_AFTER_SHUTDOWN
        fprintf(stderr, "%*s", (int)(output->len - newlines), aws_string_c_str(output));
#endif
        return AWS_OP_SUCCESS;
    }

    /*
     * Pin the log drain function until we try to call it. If napi_closing is returned, the function
     * has been released, which means we are shutting down, so we just bail
     */
    AWS_NAPI_CALL(env, napi_acquire_threadsafe_function(ctx->log_drain), {
        return (status == napi_closing) ? AWS_OP_SUCCESS : AWS_OP_ERR;
    });

    /* must allocate in the order things will be freed because we use a ring buffer */
    struct aws_string *message =
        aws_string_new_from_array(&ctx->buffer_allocator, aws_string_bytes(output), output->len - newlines);
    struct log_message *msg = aws_mem_calloc(&ctx->buffer_allocator, 1, sizeof(struct log_message));
    msg->message = message;

    /* queue up the message to be logged next time the function runs */
    aws_mutex_lock(&ctx->msg_queue.mutex);
    aws_linked_list_push_back(&ctx->msg_queue.messages, &msg->node);
    aws_mutex_unlock(&ctx->msg_queue.mutex);

    /* queue the call */
    AWS_NAPI_ENSURE(ctx->env, napi_call_threadsafe_function(ctx->log_drain, NULL, napi_tsfn_nonblocking));
    return AWS_OP_SUCCESS;
}

static void s_napi_log_writer_clean_up(struct aws_log_writer *writer) {
    (void)writer;
}

static struct aws_log_writer_vtable s_napi_log_writer_vtable = {
    .write = s_napi_log_writer_write,
    .clean_up = s_napi_log_writer_clean_up,
};

void aws_napi_logger_set_level(enum aws_log_level level) {
    AWS_FATAL_ASSERT(s_napi_logger.logger.p_impl);
    aws_atomic_store_int(&((struct aws_logger_pipeline *)s_napi_logger.logger.p_impl)->level, level);
}

/* Allocator used to allocate buffered log messages from a ring buffer */
static void *s_ring_buffer_mem_acquire(struct aws_allocator *allocator, size_t size) {
    struct aws_ring_buffer *buffer = allocator->impl;
    struct aws_byte_buf buf;
    AWS_ZERO_STRUCT(buf);
    /* if the ring buffer is full, fall back to the normal allocator */
    if (aws_ring_buffer_acquire(buffer, size + sizeof(size_t), &buf)) {
        AWS_FATAL_ASSERT(AWS_OP_SUCCESS == aws_byte_buf_init(&buf, buffer->allocator, size + sizeof(size_t)));
    }
    *((size_t *)buf.buffer) = buf.capacity;
    return buf.buffer + sizeof(size_t);
}

static void s_ring_buffer_mem_release(struct aws_allocator *allocator, void *ptr) {
    void *addr = ((uint8_t *)ptr - sizeof(size_t));
    size_t size = *((size_t *)addr);
    struct aws_byte_buf buf = {
        .allocator = allocator,
        .buffer = addr,
        .capacity = size,
        .len = 0,
    };
    struct aws_ring_buffer *buffer = allocator->impl;

    /* see if the memory comes from the ring buffer */
    if (aws_ring_buffer_buf_belongs_to_pool(buffer, &buf)) {
        aws_ring_buffer_release(buffer, &buf);
    } else {
        /* release to the fallback allocator */
        aws_mem_release(buffer->allocator, addr);
    }
}

static void *s_ring_buffer_mem_calloc(struct aws_allocator *allocator, size_t num, size_t size) {
    void *mem = s_ring_buffer_mem_acquire(allocator, num * size);
    memset(mem, 0, size);
    return mem;
}

/* called from every thread as its node environment shuts down */
void s_threadsafe_log_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;

    struct aws_napi_logger_ctx *ctx = finalize_data;

    /* empty message queue, do not need to delete messages as they all come from the ring buffer */
    struct aws_linked_list msgs;
    aws_linked_list_init(&msgs);
    aws_mutex_lock(&ctx->msg_queue.mutex);
    aws_linked_list_swap_contents(&ctx->msg_queue.messages, &msgs);
    aws_mutex_unlock(&ctx->msg_queue.mutex);

    /* Drop the ref to the function. All attempts to acquire will return napi_closing after this */
    AWS_NAPI_ENSURE(env, napi_release_threadsafe_function(ctx->log_drain, napi_tsfn_abort));
    ctx->log_drain = NULL;

    /* The rest is cleaned up by the env context clean up via aws_napi_logger_destroy() */
}

/* batch drain the entire queue, subsequent queued calls will do no work */
static void s_threadsafe_log_call(napi_env env, napi_value node_log_fn, void *context, void *user_data) {
    (void)user_data;
    struct aws_napi_logger_ctx *ctx = context;

    /* transfer the messages under lock */
    struct aws_linked_list msgs;
    aws_linked_list_init(&msgs);
    aws_mutex_lock(&ctx->msg_queue.mutex);
    aws_linked_list_swap_contents(&ctx->msg_queue.messages, &msgs);
    aws_mutex_unlock(&ctx->msg_queue.mutex);

    /*
     * If env is null, that means that the function is simply requesting that any resources be
     * freed for shutdown
     */
    if (!env) {
        goto done;
    }

    /* nothing to do, maybe next time... */
    if (aws_linked_list_empty(&msgs)) {
        goto done;
    }

    /*
     * Look up `process` to use as this for the _rawDebug call, if these fail it's because the function
     * call was queued during shutdown, so we will just skip out of here.
     * Avoid printing scary looking error messages (ex: avoid use of AWS_NAPI_CALL macro).
     */
    napi_value node_global = NULL;
    if (napi_ok != napi_get_global(env, &node_global)) {
        goto done;
    }

    napi_value node_process = NULL;
    if (napi_ok != napi_get_named_property(env, node_global, "process", &node_process)) {
        goto done;
    }

    for (struct aws_linked_list_node *list_node = aws_linked_list_begin(&msgs); list_node != aws_linked_list_end(&msgs);
         list_node = aws_linked_list_next(list_node)) {

        struct log_message *msg = AWS_CONTAINER_OF(list_node, struct log_message, node);

        napi_value node_message = NULL;
        if (napi_ok != napi_create_string_utf8(env, aws_string_c_str(msg->message), msg->message->len, &node_message)) {
            goto done;
        }

        if (napi_ok != napi_call_function(env, node_process, node_log_fn, 1, &node_message, NULL)) {
            goto done;
        }
    }

    /* clean up memory and un-pin the log drain function */
done:
    while (!aws_linked_list_empty(&msgs)) {
        struct aws_linked_list_node *list_node = aws_linked_list_pop_front(&msgs);
        struct log_message *msg = AWS_CONTAINER_OF(list_node, struct log_message, node);
        aws_string_destroy(msg->message);
        aws_mem_release(&ctx->buffer_allocator, msg);
    }

    if (env) {
        AWS_NAPI_ENSURE(env, napi_release_threadsafe_function(ctx->log_drain, napi_tsfn_release));
    }
}

void s_threadsafe_log_create(struct aws_napi_logger_ctx *ctx, napi_env env) {
    /* look up process._rawDebug */
    napi_value node_global = NULL;
    AWS_NAPI_ENSURE(env, napi_get_global(env, &node_global));
    napi_value node_process = NULL;
    AWS_NAPI_ENSURE(env, napi_get_named_property(env, node_global, "process", &node_process));
    napi_value node_rawdebug = NULL;
    AWS_NAPI_ENSURE(env, napi_get_named_property(env, node_process, "_rawDebug", &node_rawdebug));

    napi_value resource_name = NULL;
    AWS_NAPI_ENSURE(env, napi_create_string_utf8(env, "aws_logger", 10, &resource_name));

    AWS_NAPI_ENSURE(
        env,
        napi_create_threadsafe_function(
            env,
            node_rawdebug,
            NULL,
            resource_name,
            0,
            1,
            ctx,
            s_threadsafe_log_finalize,
            ctx,
            s_threadsafe_log_call,
            &ctx->log_drain));

    /* convert the threadsafe function to a weak ref (don't keep node open if it's still out there) */
    AWS_NAPI_ENSURE(env, napi_unref_threadsafe_function(env, ctx->log_drain));
}

struct aws_napi_logger_ctx *aws_napi_logger_new(struct aws_allocator *allocator, napi_env env) {
    /* The main thread can be re-initialized multiple times, so just return the one we already have */
    if (tl_logger_ctx) {
        return tl_logger_ctx;
    }

    struct aws_napi_logger_ctx *ctx = aws_mem_calloc(allocator, 1, sizeof(struct aws_napi_logger_ctx));
    AWS_FATAL_ASSERT(ctx && "Failed to allocate new logging context");
    ctx->env = env;
    ctx->allocator = allocator;
    aws_mutex_init(&ctx->msg_queue.mutex);
    aws_linked_list_init(&ctx->msg_queue.messages);

    /* store this thread's context */
    AWS_FATAL_ASSERT(tl_logger_ctx == NULL && "Cannot initialize multiple logging contexts in a single thread");
    tl_logger_ctx = ctx;

    /* stand up the ring buffer allocator for copying/queueing log messages */
    AWS_FATAL_ASSERT(AWS_OP_SUCCESS == aws_ring_buffer_init(&ctx->buffer, ctx->allocator, LOG_RING_BUFFER_CAPACITY));
    ctx->buffer_allocator.mem_acquire = s_ring_buffer_mem_acquire;
    ctx->buffer_allocator.mem_release = s_ring_buffer_mem_release;
    ctx->buffer_allocator.mem_calloc = s_ring_buffer_mem_calloc;
    ctx->buffer_allocator.impl = &ctx->buffer;

    /* create the log drain */
    s_threadsafe_log_create(ctx, ctx->env);

    /* The first context created will always be the main thread, so make it the default */
    if (s_napi_logger.default_ctx == NULL) {
        s_napi_logger.default_ctx = ctx;
        /* there's only one logger, so if the aws logger isn't ours, set it */
        struct aws_logger *logger = aws_napi_logger_get();
        if (logger != aws_logger_get()) {
            aws_logger_set(logger);
        }
    }

    return ctx;
}

void aws_napi_logger_destroy(struct aws_napi_logger_ctx *ctx) {
    AWS_ASSERT(tl_logger_ctx == ctx);
    tl_logger_ctx = NULL;
    if (s_napi_logger.default_ctx == ctx) {
        aws_logger_set(NULL);
        s_napi_logger.default_ctx = NULL;
    }

    aws_mutex_clean_up(&ctx->msg_queue.mutex);
    /* don't need to worry about cleaning up the message queue, all of the memory comes from the ring buffer */
    aws_ring_buffer_clean_up(&ctx->buffer);
    aws_mem_release(ctx->allocator, ctx);
}

struct aws_logger *aws_napi_logger_get(void) {
    if (s_napi_logger.logger.allocator) {
        return &s_napi_logger.logger;
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();

    s_napi_logger.writer.allocator = allocator;
    s_napi_logger.writer.vtable = &s_napi_log_writer_vtable;
    s_napi_logger.writer.impl = NULL;

    struct aws_log_formatter_standard_options formatter_options = {.date_format = AWS_DATE_FORMAT_ISO_8601};
    int op_status = aws_log_formatter_init_default(&s_napi_logger.formatter, allocator, &formatter_options);
    AWS_FATAL_ASSERT(op_status == AWS_OP_SUCCESS && "Failed to initialize formatter");

    op_status = aws_log_channel_init_foreground(&s_napi_logger.channel, allocator, &s_napi_logger.writer);
    AWS_FATAL_ASSERT(op_status == AWS_OP_SUCCESS && "Failed to initialize log channel");

    op_status = aws_logger_init_from_external(
        &s_napi_logger.logger,
        aws_napi_get_allocator(),
        &s_napi_logger.formatter,
        &s_napi_logger.channel,
        &s_napi_logger.writer,
        AWS_LL_NONE);
    AWS_FATAL_ASSERT(op_status == AWS_OP_SUCCESS && "Failed to initialize logger");
    return &s_napi_logger.logger;
}
