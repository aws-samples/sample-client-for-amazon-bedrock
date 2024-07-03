/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "http_stream.h"

#include "http_connection.h"
#include "http_message.h"

#include <aws/common/atomics.h>
#include <aws/http/request_response.h>
#include <aws/io/stream.h>

#ifdef _MSC_VER
#    pragma warning(disable : 4204)
#endif /* _MSC_VER */

struct http_stream_binding {
    struct aws_http_stream *stream;
    struct aws_allocator *allocator;
    napi_ref node_external;
    napi_threadsafe_function on_complete;
    napi_threadsafe_function on_response;
    napi_threadsafe_function on_body;
    struct aws_http_message *response; /* used to buffer response headers/status code */
    struct aws_http_message *request;

    struct aws_atomic_var pending_length; /* used to ensure that all of the body callbacks to node have been invoked */
};

static void s_on_response_call(napi_env env, napi_value on_response, void *context, void *user_data) {
    struct http_stream_binding *binding = context;
    struct aws_http_message *response = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        int32_t status_code = 0;
        aws_http_message_get_response_status(response, &status_code);
        AWS_NAPI_ENSURE(env, napi_create_int32(env, status_code, &params[0]));

        napi_value node_headers = NULL;
        AWS_NAPI_ENSURE(env, napi_create_array(env, &node_headers));
        params[1] = node_headers;

        size_t num_headers = aws_http_message_get_header_count(response);
        /* This should never happen, but hey, you never know */
        if (num_headers > UINT32_MAX) {
            num_headers = UINT32_MAX;
        }

        for (uint32_t idx = 0; idx < num_headers; ++idx) {
            struct aws_http_header header;
            aws_http_message_get_header(response, &header, idx);

            napi_value node_header = NULL;
            AWS_NAPI_ENSURE(env, napi_create_array(env, &node_header));

            napi_value node_name = NULL;
            napi_value node_value = NULL;
            AWS_NAPI_ENSURE(
                env, napi_create_string_utf8(env, (const char *)header.name.ptr, header.name.len, &node_name));
            AWS_NAPI_ENSURE(
                env, napi_create_string_utf8(env, (const char *)header.value.ptr, header.value.len, &node_value));
            AWS_NAPI_ENSURE(env, napi_set_element(env, node_header, 0, node_name));
            AWS_NAPI_ENSURE(env, napi_set_element(env, node_header, 1, node_value));
            AWS_NAPI_ENSURE(env, napi_set_element(env, node_headers, idx, node_header));
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(env, binding->on_response, NULL, on_response, num_params, params));
    }

    /* clean up the response buffer */
    aws_http_message_destroy(binding->response);
    binding->response = NULL;
}

static int s_on_response_headers(
    struct aws_http_stream *stream,
    enum aws_http_header_block block_type,
    const struct aws_http_header *header_array,
    size_t num_headers,
    void *user_data) {
    (void)stream;
    (void)block_type;
    struct http_stream_binding *binding = user_data;
    if (!binding->on_response) {
        return AWS_OP_SUCCESS;
    }

    if (!binding->response) {
        binding->response = aws_http_message_new_response(aws_napi_get_allocator());
    }
    return aws_http_message_add_header_array(binding->response, header_array, num_headers);
}

static int s_on_response_header_block_done(
    struct aws_http_stream *stream,
    enum aws_http_header_block block_type,
    void *user_data) {
    (void)block_type;
    struct http_stream_binding *binding = user_data;
    if (binding->on_response) {
        int status_code = 0;
        aws_http_stream_get_incoming_response_status(stream, &status_code);
        aws_http_message_set_response_status(binding->response, status_code);
        AWS_NAPI_CALL(
            NULL, aws_napi_queue_threadsafe_function(binding->on_response, binding->response), { return AWS_OP_ERR; });
    }
    return AWS_OP_SUCCESS;
}

struct on_body_args {
    struct http_stream_binding *binding;
    struct aws_byte_buf chunk;
    struct aws_allocator *allocator;
};

static void s_external_arraybuffer_finalizer(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_data;
    struct on_body_args *args = finalize_hint;
    aws_byte_buf_clean_up(&args->chunk);
    aws_mem_release(args->allocator, args);
}

static void s_on_body_call(napi_env env, napi_value on_body, void *context, void *user_data) {
    struct http_stream_binding *binding = context;
    struct on_body_args *args = user_data;

    /* Callback is invoked for nodejs, update pending length */
    aws_atomic_fetch_sub(&binding->pending_length, args->chunk.len);

    if (env) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(
            env,
            aws_napi_create_external_arraybuffer(
                env, args->chunk.buffer, args->chunk.len, s_external_arraybuffer_finalizer, args, &params[0]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, binding->on_body, NULL, on_body, num_params, params));
    }
}

static int s_on_response_body(struct aws_http_stream *stream, const struct aws_byte_cursor *data, void *user_data) {
    (void)stream;
    struct http_stream_binding *binding = user_data;
    if (AWS_UNLIKELY(!binding->on_body)) {
        return AWS_OP_SUCCESS;
    }

    struct on_body_args *args = aws_mem_calloc(binding->allocator, 1, sizeof(struct on_body_args));
    AWS_FATAL_ASSERT(args);
    args->allocator = binding->allocator;

    /* recording the length of data that has been pending to be invoked for nodejs */
    aws_atomic_fetch_add(&binding->pending_length, data->len);
    args->binding = binding;
    if (aws_byte_buf_init_copy_from_cursor(&args->chunk, binding->allocator, *data)) {
        AWS_FATAL_ASSERT(args->chunk.buffer);
    }

    AWS_NAPI_CALL(NULL, aws_napi_queue_threadsafe_function(binding->on_body, args), { return AWS_OP_ERR; });

    return AWS_OP_SUCCESS;
}

struct on_complete_args {
    struct http_stream_binding *binding;
    int error_code;
};

static void s_on_complete_call(napi_env env, napi_value on_complete, void *context, void *user_data) {
    struct http_stream_binding *binding = context;
    struct on_complete_args *args = user_data;
    if (aws_atomic_load_int(&binding->pending_length)) {
        /* which means nodejs still has some body callbacks that are pending, cannot complete the stream for nodejs.
         * Requeue the threadsafe function */
        AWS_NAPI_ENSURE(env, aws_napi_queue_threadsafe_function(binding->on_complete, args));
        /* Clear the reference which required by previous queue */
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_complete, napi_tsfn_release));
        return;
    }

    napi_value params[1];
    const size_t num_params = AWS_ARRAY_SIZE(params);

    AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[0]));
    AWS_NAPI_ENSURE(
        env, aws_napi_dispatch_threadsafe_function(env, binding->on_complete, NULL, on_complete, num_params, params));

    /* No callbacks should happen now, cleanup all the threadsafe functions */
    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_response, napi_tsfn_abort));
    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_body, napi_tsfn_abort));
    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_complete, napi_tsfn_abort));
    AWS_NAPI_ENSURE(env, napi_delete_reference(env, binding->node_external));

    aws_mem_release(binding->allocator, args);
}

static void s_on_complete(struct aws_http_stream *stream, int error_code, void *user_data) {
    (void)stream;
    struct http_stream_binding *binding = user_data;
    struct on_complete_args *args = aws_mem_calloc(binding->allocator, 1, sizeof(struct on_complete_args));
    AWS_FATAL_ASSERT(args);
    args->binding = binding;
    args->error_code = error_code;
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_complete, args));
}

static void s_http_stream_binding_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;
    struct http_stream_binding *binding = finalize_data;

    aws_http_message_release(binding->request);
    aws_http_message_release(binding->response);
    aws_mem_release(binding->allocator, binding);
}

napi_value aws_napi_http_stream_new(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();
    napi_value result = NULL;

    napi_value node_args[5];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_stream_new needs exactly 5 arguments");
        return NULL;
    }

    struct http_connection_binding *connection_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&connection_binding), {
        napi_throw_error(env, NULL, "Unable to extract connection from external");
        return NULL;
    });

    napi_value node_request = *arg++;
    struct aws_http_message *request = aws_napi_http_message_unwrap(env, node_request);
    /* adding a refcount for the request, which will be released as the stream object from JS land get destroyed */
    aws_http_message_acquire(request);

    napi_value node_on_complete = *arg++;
    napi_value node_on_response = *arg++;
    napi_value node_on_body = *arg++;

    struct http_stream_binding *binding = aws_mem_calloc(allocator, 1, sizeof(struct http_stream_binding));
    if (!binding) {
        aws_napi_throw_last_error(env);
        goto failed_binding_alloc;
    }

    binding->allocator = allocator;
    binding->request = request;
    aws_atomic_init_int(&binding->pending_length, 0);

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env, node_on_complete, "aws_http_stream_on_complete", s_on_complete_call, binding, &binding->on_complete),
        {
            napi_throw_error(env, NULL, "on_complete must be a callback");
            goto failed_callbacks;
        });

    if (!aws_napi_is_null_or_undefined(env, node_on_response)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_response,
                "aws_http_stream_on_response",
                s_on_response_call,
                binding,
                &binding->on_response),
            {
                napi_throw_error(env, NULL, "Unable to bind on_response callback");
                goto failed_callbacks;
            });
    }

    if (!aws_napi_is_null_or_undefined(env, node_on_body)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env, node_on_body, "aws_http_stream_on_body", s_on_body_call, binding, &binding->on_body),
            {
                napi_throw_error(env, NULL, "Unable to bind on_body callback");
                goto failed_callbacks;
            });
    }

    struct aws_http_make_request_options request_options = {
        .self_size = sizeof(struct aws_http_make_request_options),
        .request = request,
        .user_data = binding,
        .on_response_headers = s_on_response_headers,
        .on_response_header_block_done = s_on_response_header_block_done,
        .on_response_body = s_on_response_body,
        .on_complete = s_on_complete,
    };

    /* becomes the native_handle for the JS object */
    AWS_NAPI_CALL(env, napi_create_external(env, binding, s_http_stream_binding_finalize, NULL, &result), {
        napi_throw_error(env, NULL, "Unable to create stream external");
        goto failed_external;
    });

    struct aws_http_connection *connection = aws_napi_get_http_connection(connection_binding);
    binding->stream = aws_http_connection_make_request(connection, &request_options);

    if (!binding->stream) {
        napi_throw_error(env, NULL, "Unable to create native aws_http_stream");
        result = NULL;
        goto failed_request;
    }

    goto done;

failed_request:
failed_external:
failed_callbacks:
    if (binding) {
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_complete, napi_tsfn_abort));
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_response, napi_tsfn_abort));
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_body, napi_tsfn_abort));
    }
    aws_mem_release(allocator, binding);
failed_binding_alloc:
done:

    return result;
}

napi_value aws_napi_http_stream_activate(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_stream_activate needs exactly 1 arguments");
        return NULL;
    }

    struct http_stream_binding *binding = NULL;
    AWS_NAPI_ENSURE(env, napi_get_value_external(env, node_args[0], (void **)&binding));

    AWS_NAPI_CALL(env, napi_create_reference(env, node_args[0], 1, &binding->node_external), {
        napi_throw_error(env, NULL, "Unable to reference stream external");
    });

    if (aws_http_stream_activate(binding->stream)) {
        AWS_NAPI_ENSURE(env, napi_delete_reference(env, binding->node_external));
        aws_napi_throw_last_error(env);
    }

    return NULL;
}

napi_value aws_napi_http_stream_close(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_stream_close needs exactly 1 arguments");
        return NULL;
    }

    struct http_stream_binding *binding = NULL;
    AWS_NAPI_ENSURE(env, napi_get_value_external(env, node_args[0], (void **)&binding));

    aws_http_stream_release(binding->stream);

    return NULL;
}
