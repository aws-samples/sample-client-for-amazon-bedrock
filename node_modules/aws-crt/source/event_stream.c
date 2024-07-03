/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "event_stream.h"

#include <aws/event-stream/event_stream_rpc_client.h>
#include <aws/io/socket.h>
#include <aws/io/tls_channel_handler.h>

static const uint32_t AWS_EVENT_STREAM_CONNECT_TIMEOUT_DEFAULT_MS = 10000;

static const char *AWS_EVENT_STREAM_PROPERTY_NAME_HOST = "hostName";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_PORT = "port";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_NAME = "name";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_TYPE = "type";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_VALUE = "value";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_HEADERS = "headers";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_PAYLOAD = "payload";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_FLAGS = "flags";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_MESSAGE = "message";
static const char *AWS_EVENT_STREAM_PROPERTY_NAME_OPERATION = "operation";

/*
 * The fact that a zeroed array list crashes in aws_array_list_length drives me crazy.  Since CBMC proofs are
 * entangled with the implementation, I don't want to change it.
 */
static size_t s_aws_array_list_length(struct aws_array_list *array_list) {
    if (array_list == NULL) {
        return 0;
    }

    if (!aws_array_list_is_valid(array_list)) {
        return 0;
    }

    return aws_array_list_length(array_list);
}

/*
 * Binding object that outlives the associated napi wrapper object.  When that object finalizes, then it's a signal
 * to this object to destroy the connection (and itself, afterwards).
 *
 * WARNING
 * Data Access Rules:
 *  (1) If in the libuv thread (called from JS or in the invocation of a thread-safe function), you may access anything
 *      in the binding
 *  (2) Otherwise, you may only access thread-safe functions or the binding's ref count APIs.  In particular,
 *      'connection' and 'is_closed' are off-limits unless you're in the libuv thread.
 */
struct aws_event_stream_client_connection_binding {
    struct aws_allocator *allocator;

    /*
     * We ref count the binding itself because there are two primary time intervals that together create a union
     * that we must honor.
     *
     * Interval #1: The binding must live from new() to close()
     * Interval #2: The binding must live from connect() to {connection failure || connection shutdown} as processed
     *    by the libuv thread.  It is incorrect to react to those events in the event loop callback; we must bundle
     *    and ship them across to the libuv thread.  When the libuv thread is processing a connection failure or
     *    a connection shutdown, we know that no other events can possibly be pending (they would have already been
     *    processed in the libuv thread).
     *
     * The union of those two intervals is "probably" enough, but its correctness would rest on an internal property
     * of the node implementation itself: "are calls to napi_call_threadsafe_function() well-ordered with respect to
     * a single producer (we only call it from the libuv thread itself)?"  This is almost certainly true, but I don't
     * see it guaranteed within the n-api documentation.  For that reason, we also add the intervals of all
     * completable connection events: incoming protocol messages and outbound message flushes
     */
    struct aws_ref_count ref_count;

    /*
     * May only be accessed from within the libuv thread.  This includes connection APIs like acquire and release.
     */
    struct aws_event_stream_rpc_client_connection *connection;
    bool is_closed;

    /*
     * Cached config since connect is separate
     *
     * Const post-creation.
     */
    struct aws_string *host;
    uint32_t port;
    struct aws_socket_options socket_options;
    struct aws_tls_connection_options tls_connection_options;
    bool using_tls;

    /*
     * Single count ref to the JS connection object.
     */
    napi_ref node_event_stream_client_connection_ref;

    /*
     * Single count ref to the node external managed by the binding.
     */
    napi_ref node_event_stream_client_connection_external_ref;

    napi_threadsafe_function on_connection_setup;
    napi_threadsafe_function on_connection_shutdown;
    napi_threadsafe_function on_protocol_message;
};

static void s_aws_event_stream_client_connection_binding_on_zero(void *context) {
    if (context == NULL) {
        return;
    }

    struct aws_event_stream_client_connection_binding *binding = context;

    aws_string_destroy(binding->host);
    aws_tls_connection_options_clean_up(&binding->tls_connection_options);

    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_connection_setup);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_connection_shutdown);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_protocol_message);

    aws_mem_release(binding->allocator, binding);
}

static struct aws_event_stream_client_connection_binding *s_aws_event_stream_client_connection_binding_acquire(
    struct aws_event_stream_client_connection_binding *binding) {
    if (binding == NULL) {
        return NULL;
    }

    aws_ref_count_acquire(&binding->ref_count);
    return binding;
}

static struct aws_event_stream_client_connection_binding *s_aws_event_stream_client_connection_binding_release(
    struct aws_event_stream_client_connection_binding *binding) {
    if (binding != NULL) {
        aws_ref_count_release(&binding->ref_count);
    }

    return NULL;
}

static void s_close_connection_binding(napi_env env, struct aws_event_stream_client_connection_binding *binding) {
    AWS_FATAL_ASSERT(env != NULL);

    binding->is_closed = true;

    napi_ref node_event_stream_client_connection_external_ref =
        binding->node_event_stream_client_connection_external_ref;
    binding->node_event_stream_client_connection_external_ref = NULL;

    napi_ref node_event_stream_client_connection_ref = binding->node_event_stream_client_connection_ref;
    binding->node_event_stream_client_connection_ref = NULL;

    if (node_event_stream_client_connection_external_ref != NULL) {
        napi_delete_reference(env, node_event_stream_client_connection_external_ref);
    }

    if (node_event_stream_client_connection_ref != NULL) {
        napi_delete_reference(env, node_event_stream_client_connection_ref);
    }
}

/*
 * Holds relevant information about a connection setup or shutdown callback from the event loop.  This is shipped
 * over to a threadsafe function that runs on the libuv thread.
 */
struct aws_event_stream_connection_event_data {
    struct aws_allocator *allocator;

    struct aws_event_stream_client_connection_binding *binding;
    int error_code;
    struct aws_event_stream_rpc_client_connection *connection;
};

static void s_napi_event_stream_connection_on_connection_shutdown(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {

    (void)context;

    struct aws_event_stream_connection_event_data *shutdown_data = user_data;
    struct aws_event_stream_client_connection_binding *binding = shutdown_data->binding;

    AWS_FATAL_ASSERT(binding->connection != NULL);

    AWS_LOGF_INFO(
        AWS_LS_NODEJS_CRT_GENERAL,
        "s_napi_event_stream_connection_on_connection_shutdown - event stream connection has completed shutdown");

    if (env && !binding->is_closed) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream connection, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_connection_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_connection_on_connection_shutdown - event_stream_client_connection node wrapper "
                "no longer resolvable");
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, shutdown_data->error_code, &params[1]), { goto done; });

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_connection_shutdown, NULL, function, num_params, params));
    }

done:

    /*
     * Release our reference, which in this case, allows the connection to finally delete itself.
     */
    aws_event_stream_rpc_client_connection_release(binding->connection);
    binding->connection = NULL;

    /*
     * Our invariant is that for the time interval between attempting to connect and either
     *
     *  (1) connection establishment failed, or
     *  (2) connection establishment succeeded and some arbitrary time later, gets shutdown
     *
     * we maintain a ref on the binding itself, ie native event stream can safely invoke callbacks that are
     * guaranteed to reach a valid binding.
     *
     * It's trickier than normal because, while we acquire in a single spot (the connect() call), we release in
     * two very different spots:
     *
     *  (1) connection establishment failed: in s_napi_on_event_stream_client_connection_setup
     *  (2) connection establishment succeeded: here
     *
     * Additionally, we can only release when we're in the libuv thread.
     */
    s_aws_event_stream_client_connection_binding_release(binding);

    aws_mem_release(shutdown_data->allocator, shutdown_data);
}

struct aws_event_stream_message_storage {
    struct aws_allocator *allocator;
    struct aws_array_list headers;
    struct aws_byte_buf *payload;
    enum aws_event_stream_rpc_message_type message_type;
    uint32_t message_flags;
};

static void s_aws_event_stream_message_storage_clean_up(struct aws_event_stream_message_storage *storage) {
    aws_event_stream_headers_list_cleanup(&storage->headers);

    if (storage->payload != NULL) {
        aws_byte_buf_clean_up(storage->payload);
        aws_mem_release(storage->allocator, storage->payload);
    }
}

static int s_aws_event_stream_message_storage_init_from_native(
    struct aws_event_stream_message_storage *storage,
    struct aws_allocator *allocator,
    const struct aws_event_stream_rpc_message_args *message) {

    storage->allocator = allocator;

    /* we don't use the event stream headers init api so that we can allocate the proper amount */
    if (aws_array_list_init_dynamic(
            &storage->headers, allocator, message->headers_count, sizeof(struct aws_event_stream_header_value_pair))) {
        return AWS_OP_ERR;
    }

    for (size_t i = 0; i < message->headers_count; ++i) {
        struct aws_event_stream_header_value_pair *source_header = &message->headers[i];

        if (aws_event_stream_add_header(&storage->headers, source_header)) {
            goto error;
        }
    }

    if (message->payload != NULL) {
        storage->payload = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));
        if (aws_byte_buf_init_copy_from_cursor(
                storage->payload, allocator, aws_byte_cursor_from_buf(message->payload))) {
            goto error;
        }
    }

    storage->message_type = message->message_type;
    storage->message_flags = message->message_flags;

    return AWS_OP_SUCCESS;

error:

    /* assumes AWS_ZERO_STRUCT was called first */
    s_aws_event_stream_message_storage_clean_up(storage);

    return AWS_OP_ERR;
}

#define ADD_INTEGRAL_HEADER(type_name, napi_extraction_fn_name, add_header_fn_name)                                    \
    type_name value = 0;                                                                                               \
    if (napi_extraction_fn_name(env, napi_header, AWS_EVENT_STREAM_PROPERTY_NAME_VALUE, &value) !=                     \
        AWS_NGNPR_VALID_VALUE) {                                                                                       \
        AWS_LOGF_ERROR(                                                                                                \
            AWS_LS_NODEJS_CRT_GENERAL,                                                                                 \
            "id=%p s_add_event_stream_header_from_js - invalid integer property value",                                \
            log_context);                                                                                              \
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                                   \
        goto done;                                                                                                     \
    }                                                                                                                  \
                                                                                                                       \
    if (add_header_fn_name(headers, aws_byte_cursor_from_buf(&name_buffer), value)) {                                  \
        AWS_LOGF_ERROR(                                                                                                \
            AWS_LS_NODEJS_CRT_GENERAL,                                                                                 \
            "id=%p s_add_event_stream_header_from_js - failed to add integer-valued header to header list",            \
            log_context);                                                                                              \
        goto done;                                                                                                     \
    }

#define ADD_BUFFERED_HEADER(napi_query_type, add_header_fn_name)                                                       \
    if (aws_napi_get_named_property_as_bytebuf(                                                                        \
            env, napi_header, AWS_EVENT_STREAM_PROPERTY_NAME_VALUE, napi_query_type, &value_buffer) !=                 \
        AWS_NGNPR_VALID_VALUE) {                                                                                       \
        AWS_LOGF_ERROR(                                                                                                \
            AWS_LS_NODEJS_CRT_GENERAL,                                                                                 \
            "id=%p s_add_event_stream_header_from_js - failed to parse 'value' property as a byte sequence",           \
            log_context);                                                                                              \
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                                   \
        goto done;                                                                                                     \
    }                                                                                                                  \
    if (add_header_fn_name(                                                                                            \
            headers, aws_byte_cursor_from_buf(&name_buffer), aws_byte_cursor_from_buf(&value_buffer))) {               \
        AWS_LOGF_ERROR(                                                                                                \
            AWS_LS_NODEJS_CRT_GENERAL,                                                                                 \
            "id=%p s_add_event_stream_header_from_js - failed to byte sequence valued header to header list",          \
            log_context);                                                                                              \
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                                   \
        goto done;                                                                                                     \
    }

static int s_aws_event_stream_add_int64_header_by_cursor(
    struct aws_array_list *headers,
    struct aws_byte_cursor name,
    struct aws_byte_cursor value) {
    AWS_FATAL_ASSERT(value.len == 8);

    /*
     * We pass int64s encoded as a two's-complement byte sequence.  This lets us just build the 64-bit value
     * directly and then cast it to an int64.
     */
    uint64_t uint64_value = 0;
    for (size_t i = 0; i < value.len; ++i) {
        uint64_t byte_value = value.ptr[i];
        uint64_value |= (byte_value << (i * 8));
    }

    int64_t int64_value = uint64_value;

    return aws_event_stream_add_int64_header_by_cursor(headers, name, int64_value);
}

static int s_add_event_stream_header_from_js(
    struct aws_array_list *headers,
    napi_env env,
    napi_value napi_header,
    void *log_context) {

    int result = AWS_OP_ERR;

    struct aws_byte_buf name_buffer;
    AWS_ZERO_STRUCT(name_buffer);

    struct aws_byte_buf value_buffer;
    AWS_ZERO_STRUCT(value_buffer);

    if (aws_napi_get_named_property_as_bytebuf(
            env, napi_header, AWS_EVENT_STREAM_PROPERTY_NAME_NAME, napi_string, &name_buffer) !=
        AWS_NGNPR_VALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_add_event_stream_header_from_js - failed to parse required 'name' property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto done;
    }

    uint32_t value_type_u32 = 0;
    enum aws_event_stream_header_value_type value_type = 0;
    if (aws_napi_get_named_property_as_uint32(env, napi_header, AWS_EVENT_STREAM_PROPERTY_NAME_TYPE, &value_type_u32) !=
        AWS_NGNPR_VALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_add_event_stream_header_from_js - failed to parse required 'type' property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto done;
    }

    value_type = (enum aws_event_stream_header_value_type)value_type_u32;
    if (value_type < 0 || value_type > AWS_EVENT_STREAM_HEADER_UUID) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_add_event_stream_header_from_js - 'type' property has invalid value",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto done;
    }

    switch (value_type) {
        case AWS_EVENT_STREAM_HEADER_BOOL_TRUE:
        case AWS_EVENT_STREAM_HEADER_BOOL_FALSE:
            if (aws_event_stream_add_bool_header_by_cursor(
                    headers, aws_byte_cursor_from_buf(&name_buffer), value_type == AWS_EVENT_STREAM_HEADER_BOOL_TRUE)) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "id=%p s_add_event_stream_header_from_js - failed to add boolean-valued header",
                    log_context);
                goto done;
            }
            break;

        case AWS_EVENT_STREAM_HEADER_BYTE: {
            ADD_INTEGRAL_HEADER(int8_t, aws_napi_get_named_property_as_int8, aws_event_stream_add_byte_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_INT16: {
            ADD_INTEGRAL_HEADER(
                int16_t, aws_napi_get_named_property_as_int16, aws_event_stream_add_int16_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_INT32: {
            ADD_INTEGRAL_HEADER(
                int32_t, aws_napi_get_named_property_as_int32, aws_event_stream_add_int32_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_INT64: {
            ADD_BUFFERED_HEADER(napi_undefined, s_aws_event_stream_add_int64_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_BYTE_BUF: {
            ADD_BUFFERED_HEADER(napi_undefined, aws_event_stream_add_byte_buf_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_STRING: {
            ADD_BUFFERED_HEADER(napi_string, aws_event_stream_add_string_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_TIMESTAMP: {
            ADD_INTEGRAL_HEADER(
                int64_t, aws_napi_get_named_property_as_int64, aws_event_stream_add_timestamp_header_by_cursor)
            break;
        }

        case AWS_EVENT_STREAM_HEADER_UUID: {
            ADD_BUFFERED_HEADER(napi_undefined, aws_event_stream_add_uuid_header_by_cursor)
            break;
        }

        default:
            goto done;
    }

    result = AWS_OP_SUCCESS;

done:

    aws_byte_buf_clean_up(&name_buffer);
    aws_byte_buf_clean_up(&value_buffer);

    return result;
}

static int s_aws_event_stream_message_storage_init_from_js(
    struct aws_event_stream_message_storage *storage,
    struct aws_allocator *allocator,
    napi_env env,
    napi_value message,
    void *log_context) {

    int result = AWS_OP_ERR;

    storage->allocator = allocator;

    napi_value napi_headers = NULL;
    enum aws_napi_get_named_property_result get_headers_result =
        aws_napi_get_named_property(env, message, AWS_EVENT_STREAM_PROPERTY_NAME_HEADERS, napi_object, &napi_headers);
    if (get_headers_result == AWS_NGNPR_INVALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_event_stream_message_storage_init_from_js - invalid headers property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto error;
    }

    if (get_headers_result == AWS_NGNPR_VALID_VALUE) {
        size_t header_array_length = 0;
        if (aws_napi_get_property_array_size(
                env, message, AWS_EVENT_STREAM_PROPERTY_NAME_HEADERS, &header_array_length)) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_aws_event_stream_message_storage_init_from_js - headers property is not an array",
                log_context);
            aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
            goto error;
        }

        aws_array_list_init_dynamic(
            &storage->headers, allocator, header_array_length, sizeof(struct aws_event_stream_header_value_pair));

        for (size_t i = 0; i < header_array_length; ++i) {

            napi_value napi_header = NULL;
            AWS_NAPI_CALL(env, napi_get_element(env, napi_headers, (uint32_t)i, &napi_header), { goto error; });

            if (s_add_event_stream_header_from_js(&storage->headers, env, napi_header, log_context)) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "id=%p s_aws_event_stream_message_storage_init_from_js - could not extract eventstream header",
                    log_context);
                goto error;
            }
        }
    }

    struct aws_byte_buf payload_buffer;
    AWS_ZERO_STRUCT(payload_buffer);

    enum aws_napi_get_named_property_result get_payload_result = aws_napi_get_named_property_as_bytebuf(
        env, message, AWS_EVENT_STREAM_PROPERTY_NAME_PAYLOAD, napi_undefined, &payload_buffer);
    if (get_payload_result == AWS_NGNPR_INVALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_event_stream_message_storage_init_from_js - invalid headers property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto error;
    } else if (get_payload_result == AWS_NGNPR_VALID_VALUE) {
        storage->payload = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));
        *storage->payload = payload_buffer;
    }

    uint32_t message_type_uint32 = 0;
    if (aws_napi_get_named_property_as_uint32(
            env, message, AWS_EVENT_STREAM_PROPERTY_NAME_TYPE, &message_type_uint32) != AWS_NGNPR_VALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_event_stream_message_storage_init_from_js - invalid message type property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto error;
    }

    storage->message_type = (enum aws_event_stream_rpc_message_type)message_type_uint32;

    if (aws_napi_get_named_property_as_uint32(
            env, message, AWS_EVENT_STREAM_PROPERTY_NAME_FLAGS, &storage->message_flags) == AWS_NGNPR_INVALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_event_stream_message_storage_init_from_js - invalid message flags property",
            log_context);
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto error;
    }

    result = AWS_OP_SUCCESS;
    goto done;

error:

    s_aws_event_stream_message_storage_clean_up(storage);

done:

    return result;
}

#define AWS_ATTACH_BUFFER_VALUE_TO_HEADER(get_buffer_fn)                                                               \
    struct aws_byte_buf non_heap_buffer = get_buffer_fn(header);                                                       \
    struct aws_byte_buf *heap_buffer = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));                      \
    aws_byte_buf_init_copy_from_cursor(heap_buffer, allocator, aws_byte_cursor_from_buf(&non_heap_buffer));            \
    if (aws_napi_attach_object_property_binary_as_finalizable_external(                                                \
            napi_header, env, AWS_EVENT_STREAM_PROPERTY_NAME_VALUE, heap_buffer)) {                                    \
        aws_byte_buf_clean_up(heap_buffer);                                                                            \
        aws_mem_release(allocator, heap_buffer);                                                                       \
        return AWS_OP_ERR;                                                                                             \
    }

static int s_aws_create_napi_header_value(
    napi_env env,
    struct aws_event_stream_header_value_pair *header,
    napi_value *napi_header_out) {

    napi_value napi_header = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_header), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    struct aws_byte_cursor name_cursor = aws_byte_cursor_from_array(header->header_name, header->header_name_len);
    if (aws_napi_attach_object_property_string(napi_header, env, AWS_EVENT_STREAM_PROPERTY_NAME_NAME, name_cursor)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_header, env, AWS_EVENT_STREAM_PROPERTY_NAME_TYPE, (uint32_t)header->header_value_type)) {
        return AWS_OP_ERR;
    }

    switch (header->header_value_type) {
        case AWS_EVENT_STREAM_HEADER_BOOL_TRUE:
        case AWS_EVENT_STREAM_HEADER_BOOL_FALSE:
            if (aws_napi_attach_object_property_boolean(
                    napi_header,
                    env,
                    AWS_EVENT_STREAM_PROPERTY_NAME_VALUE,
                    header->header_value_type == AWS_EVENT_STREAM_HEADER_BOOL_TRUE)) {
                return AWS_OP_ERR;
            }
            break;

        case AWS_EVENT_STREAM_HEADER_BYTE:
            if (aws_napi_attach_object_property_i32(
                    napi_header,
                    env,
                    AWS_EVENT_STREAM_PROPERTY_NAME_VALUE,
                    aws_event_stream_header_value_as_byte(header))) {
                return AWS_OP_ERR;
            }
            break;

        case AWS_EVENT_STREAM_HEADER_INT16:
            if (aws_napi_attach_object_property_i32(
                    napi_header,
                    env,
                    AWS_EVENT_STREAM_PROPERTY_NAME_VALUE,
                    aws_event_stream_header_value_as_int16(header))) {
                return AWS_OP_ERR;
            }
            break;

        case AWS_EVENT_STREAM_HEADER_INT32:
            if (aws_napi_attach_object_property_i32(
                    napi_header,
                    env,
                    AWS_EVENT_STREAM_PROPERTY_NAME_VALUE,
                    aws_event_stream_header_value_as_int32(header))) {
                return AWS_OP_ERR;
            }
            break;

        case AWS_EVENT_STREAM_HEADER_INT64: {
            int64_t value = aws_event_stream_header_value_as_int64(header);
            uint8_t buffer[8];

            /* We can copy the bytes from low to high directly since we use a two's complement representation */
            for (size_t i = 0; i < 8; ++i) {
                buffer[i] = (uint8_t)(value & 0xFF);
                value >>= 8;
            }

            struct aws_byte_buf *heap_buffer = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));
            aws_byte_buf_init_copy_from_cursor(
                heap_buffer, allocator, aws_byte_cursor_from_array(buffer, AWS_ARRAY_SIZE(buffer)));
            if (aws_napi_attach_object_property_binary_as_finalizable_external(
                    napi_header, env, AWS_EVENT_STREAM_PROPERTY_NAME_VALUE, heap_buffer)) {
                aws_byte_buf_clean_up(heap_buffer);
                aws_mem_release(allocator, heap_buffer);
                return AWS_OP_ERR;
            }
            break;
        }

        case AWS_EVENT_STREAM_HEADER_BYTE_BUF: {
            AWS_ATTACH_BUFFER_VALUE_TO_HEADER(aws_event_stream_header_value_as_bytebuf);
            break;
        }

        case AWS_EVENT_STREAM_HEADER_UUID: {
            AWS_ATTACH_BUFFER_VALUE_TO_HEADER(aws_event_stream_header_value_as_uuid);
            break;
        }

        case AWS_EVENT_STREAM_HEADER_STRING: {
            struct aws_byte_buf value_buffer = aws_event_stream_header_value_as_string(header);
            if (aws_napi_attach_object_property_string(
                    napi_header, env, AWS_EVENT_STREAM_PROPERTY_NAME_VALUE, aws_byte_cursor_from_buf(&value_buffer))) {
                return AWS_OP_ERR;
            }
            break;
        }

        case AWS_EVENT_STREAM_HEADER_TIMESTAMP:
            if (aws_napi_attach_object_property_u64(
                    napi_header,
                    env,
                    AWS_EVENT_STREAM_PROPERTY_NAME_VALUE,
                    (uint64_t)aws_event_stream_header_value_as_timestamp(header))) {
                return AWS_OP_ERR;
            }
            break;

        default:
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    *napi_header_out = napi_header;

    return AWS_OP_SUCCESS;
}

static int s_aws_create_napi_value_from_event_stream_message_storage(
    napi_env env,
    struct aws_event_stream_message_storage *message,
    napi_value *napi_message_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_message = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_message), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(
            napi_message, env, AWS_EVENT_STREAM_PROPERTY_NAME_FLAGS, (uint32_t)message->message_flags)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_message, env, AWS_EVENT_STREAM_PROPERTY_NAME_TYPE, (uint32_t)message->message_type)) {
        return AWS_OP_ERR;
    }

    if (message->payload->len > 0) {
        if (aws_napi_attach_object_property_binary_as_finalizable_external(
                napi_message, env, AWS_EVENT_STREAM_PROPERTY_NAME_PAYLOAD, message->payload)) {
            return AWS_OP_ERR;
        }

        /* the extern's finalizer is now responsible for cleaning up the buffer */
        message->payload = NULL;
    }

    size_t header_count = s_aws_array_list_length(&message->headers);
    if (header_count > 0) {
        napi_value headers_array = NULL;
        AWS_NAPI_CALL(env, napi_create_array_with_length(env, header_count, &headers_array), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        for (size_t i = 0; i < header_count; ++i) {
            napi_value napi_header = NULL;

            struct aws_event_stream_header_value_pair *header = NULL;
            aws_array_list_get_at_ptr(&message->headers, (void **)&header, i);

            if (s_aws_create_napi_header_value(env, header, &napi_header)) {
                return AWS_OP_ERR;
            }

            AWS_NAPI_CALL(env, napi_set_element(env, headers_array, (uint32_t)i, napi_header), {
                return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
            });
        }

        AWS_NAPI_CALL(
            env, napi_set_named_property(env, napi_message, AWS_EVENT_STREAM_PROPERTY_NAME_HEADERS, headers_array), {
                return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
            });
    }

    *napi_message_out = napi_message;

    return AWS_OP_SUCCESS;
}

struct aws_event_stream_protocol_message_event {
    struct aws_allocator *allocator;
    struct aws_event_stream_message_storage storage;
    struct aws_event_stream_client_connection_binding *binding;
};

static void s_aws_event_stream_protocol_message_event_destroy(struct aws_event_stream_protocol_message_event *event) {
    if (event == NULL) {
        return;
    }

    s_aws_event_stream_message_storage_clean_up(&event->storage);
    s_aws_event_stream_client_connection_binding_release(event->binding);

    aws_mem_release(event->allocator, event);
}

static void s_napi_event_stream_connection_on_protocol_message(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {

    (void)context;

    struct aws_event_stream_protocol_message_event *message_event = user_data;
    struct aws_event_stream_client_connection_binding *binding = message_event->binding;

    if (env && !binding->is_closed) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream connection, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_connection_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_connection_on_protocol_message - event_stream_client_connection node wrapper no "
                "longer resolvable");
            goto done;
        }

        if (s_aws_create_napi_value_from_event_stream_message_storage(env, &message_event->storage, &params[1])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_connection_on_protocol_message - failed to create JS representation of incoming "
                "message");
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_protocol_message, NULL, function, num_params, params));
    }

done:

    s_aws_event_stream_protocol_message_event_destroy(message_event);
}

static void s_aws_event_stream_rpc_client_connection_protocol_message_fn(
    struct aws_event_stream_rpc_client_connection *connection,
    const struct aws_event_stream_rpc_message_args *message_args,
    void *user_data) {
    (void)connection;

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_event_stream_protocol_message_event *event =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_protocol_message_event));

    event->allocator = allocator;
    event->binding = s_aws_event_stream_client_connection_binding_acquire(
        (struct aws_event_stream_client_connection_binding *)user_data);

    if (s_aws_event_stream_message_storage_init_from_native(&event->storage, allocator, message_args)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_event_stream_rpc_client_connection_protocol_message_fn - unable to initialize message storage",
            (void *)event->binding);
        s_aws_event_stream_protocol_message_event_destroy(event);
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(event->binding->on_protocol_message, event));
}

static int s_init_event_stream_connection_configuration_from_js_connection_configuration(
    napi_env env,
    napi_value node_connection_options,
    struct aws_event_stream_client_connection_binding *binding) {

    napi_value host_name_property;
    if (aws_napi_get_named_property(
            env, node_connection_options, AWS_EVENT_STREAM_PROPERTY_NAME_HOST, napi_string, &host_name_property) !=
        AWS_NGNPR_VALID_VALUE) {
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    binding->host = aws_string_new_from_napi(env, host_name_property);
    if (binding->host == NULL) {
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    if (aws_napi_get_named_property_as_uint32(
            env, node_connection_options, AWS_EVENT_STREAM_PROPERTY_NAME_PORT, &binding->port) !=
        AWS_NGNPR_VALID_VALUE) {
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_event_stream_client_connection_new(napi_env env, napi_callback_info info) {
    napi_value node_args[6];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "event_stream_client_connection_new - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "event_stream_client_connection_new - needs exactly 6 arguments");
        return NULL;
    }

    napi_value node_connection_ref = NULL;
    napi_value node_external = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_event_stream_client_connection_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_client_connection_binding));
    binding->allocator = allocator;
    aws_ref_count_init(&binding->ref_count, binding, s_aws_event_stream_client_connection_binding_on_zero);

    AWS_NAPI_CALL(env, napi_create_external(env, binding, NULL, NULL, &node_external), {
        aws_mem_release(allocator, binding);
        napi_throw_error(env, NULL, "event_stream_client_connection_new - Failed to create n-api external");
        s_aws_event_stream_client_connection_binding_release(binding);
        goto done;
    });

    /* Arg #1: the js event stream connection */
    napi_value node_connection = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_connection)) {
        napi_throw_error(env, NULL, "event_stream_client_connection_new - Required connection parameter is null");
        goto error;
    }

    AWS_NAPI_CALL(
        env, napi_create_reference(env, node_connection, 1, &binding->node_event_stream_client_connection_ref), {
            napi_throw_error(
                env,
                NULL,
                "event_stream_client_connection_new - Failed to create reference to node event stream connection");
            goto error;
        });

    /* Arg #2: the event stream connection options object */
    napi_value node_connection_options = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_connection_options)) {
        napi_throw_error(env, NULL, "event_stream_client_connection_new - Required options parameter is null");
        goto error;
    }

    if (s_init_event_stream_connection_configuration_from_js_connection_configuration(
            env, node_connection_options, binding)) {
        napi_throw_error(
            env,
            NULL,
            "event_stream_client_connection_new - failed to initialize native connection configuration from js "
            "connection configuration");
        goto error;
    }

    /* Arg #3: on disconnect event handler */
    napi_value on_connection_shutdown_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_connection_shutdown_event_handler)) {
        napi_throw_error(
            env, NULL, "event_stream_client_connection_new - required on_connection_shutdown event handler is null");
        goto error;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            on_connection_shutdown_event_handler,
            "aws_event_stream_client_connection_on_connection_shutdown",
            s_napi_event_stream_connection_on_connection_shutdown,
            NULL,
            &binding->on_connection_shutdown),
        {
            napi_throw_error(
                env,
                NULL,
                "event_stream_client_connection_new - failed to initialize on_connection_shutdown event handler");
            goto error;
        });

    /* Arg #4: on protocol message event handler */
    napi_value on_protocol_message_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_protocol_message_event_handler)) {
        napi_throw_error(
            env, NULL, "event_stream_client_connection_new - required on_protocol_message event handler is null");
        goto error;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            on_protocol_message_event_handler,
            "aws_event_stream_client_connection_on_protocol_message",
            s_napi_event_stream_connection_on_protocol_message,
            NULL,
            &binding->on_protocol_message),
        {
            napi_throw_error(
                env,
                NULL,
                "event_stream_client_connection_new - failed to initialize on_protocol_message event handler");
            goto error;
        });

    /* Arg #5: socket options */
    napi_value node_socket_options = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_socket_options)) {
        struct aws_socket_options *socket_options_ptr = NULL;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_socket_options, (void **)&socket_options_ptr), {
            napi_throw_error(
                env, NULL, "event_stream_client_connection_new - Unable to extract socket_options from external");
            goto error;
        });

        if (socket_options_ptr == NULL) {
            napi_throw_error(env, NULL, "event_stream_client_connection_new - Null socket options");
            goto error;
        }

        binding->socket_options = *socket_options_ptr;
    } else {
        /* Default is stream, ipv4, and a basic timeout */
        binding->socket_options.connect_timeout_ms = AWS_EVENT_STREAM_CONNECT_TIMEOUT_DEFAULT_MS;
    }

    /* Arg #6: tls options */
    napi_value node_tls = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_tls)) {
        struct aws_tls_ctx *tls_ctx;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls, (void **)&tls_ctx), {
            napi_throw_error(env, NULL, "event_stream_client_connection_new - Failed to extract tls_ctx from external");
            goto error;
        });

        aws_tls_connection_options_init_from_ctx(&binding->tls_connection_options, tls_ctx);
        binding->using_tls = true;
    }

    AWS_NAPI_CALL(
        env, napi_create_reference(env, node_external, 1, &binding->node_event_stream_client_connection_external_ref), {
            napi_throw_error(
                env,
                NULL,
                "event_stream_client_connection_new - Failed to create one count reference to napi external");
            goto error;
        });

    node_connection_ref = node_external;
    goto done;

error:

    s_close_connection_binding(env, binding);

done:

    return node_connection_ref;
}

napi_value aws_napi_event_stream_client_connection_close(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_close - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_close - needs exactly 1 argument");
        return NULL;
    }

    struct aws_event_stream_client_connection_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_close - Failed to extract connection binding from first argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_close - binding was null");
        return NULL;
    }

    /* This severs the ability to call back into JS and makes the binding's extern available for garbage collection */
    s_close_connection_binding(env, binding);

    if (binding->connection != NULL) {
        aws_event_stream_rpc_client_connection_close(binding->connection, AWS_CRT_NODEJS_ERROR_EVENT_STREAM_USER_CLOSE);
    }

    /*
     * Release the allocation-ref on the binding.  If there is a connection in progress (or being shutdown) there
     * is a second ref outstanding which is removed on connection shutdown or failed setup.
     *
     * This is safe to do here because the internal state of the JS connection object blocks all future native
     * invocations.
     */
    s_aws_event_stream_client_connection_binding_release(binding);

    return NULL;
}

/* An internal helper function that lets us fake socket closes (at least from the binding's perspective) */
napi_value aws_napi_event_stream_client_connection_close_internal(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_connection_close_internal - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_connection_close_internal - needs exactly 1 argument");
        return NULL;
    }

    struct aws_event_stream_client_connection_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_close_internal - Failed to extract connection binding from first "
            "argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_close_internal - binding was null");
        return NULL;
    }

    if (binding->connection != NULL) {
        aws_event_stream_rpc_client_connection_close(binding->connection, AWS_IO_SOCKET_CLOSED);
    }

    return NULL;
}

static void s_aws_event_stream_rpc_client_on_connection_shutdown_fn(
    struct aws_event_stream_rpc_client_connection *connection,
    int error_code,
    void *user_data) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_event_stream_client_connection_binding *binding = user_data;

    struct aws_event_stream_connection_event_data *shutdown_data =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_connection_event_data));
    shutdown_data->allocator = allocator;
    shutdown_data->error_code = error_code;
    shutdown_data->binding = binding;       /* we already have a ref from the original connect call */
    shutdown_data->connection = connection; /* not really necessary with shutdown, but doesn't hurt */

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_shutdown, shutdown_data));
}

static void s_napi_on_event_stream_client_connection_setup(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {

    (void)context;

    struct aws_event_stream_connection_event_data *setup_data = user_data;
    struct aws_event_stream_client_connection_binding *binding = setup_data->binding;

    /*
     * We took a reference to the connection when we initialized setup_data.  That is our reference; no need to take
     * one here.
     */
    binding->connection = setup_data->connection;

    if (env && !binding->is_closed) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream connection, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_connection_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_on_event_stream_client_connection_setup - event_stream_client_connection node wrapper no "
                "longer resolvable");
            goto close;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, setup_data->error_code, &params[1]), { goto close; });

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_connection_setup, NULL, function, num_params, params));

        /* Successful callback, skip ahead */
        goto done;
    }

close:

    /*
     * We hit here only if the JS object has been closed or there was a terminal failure in trying to invoke
     * the setup callback.  In all cases, log it, and shutdown the connection.
     */
    AWS_LOGF_INFO(
        AWS_LS_NODEJS_CRT_GENERAL,
        "s_napi_on_event_stream_client_connection_setup - node wrapper has been closed or hit a terminal failure, "
        "halting connection setup");

    /*
     * Close the connection, starting the shutdown process
     */
    if (binding->connection != NULL) {
        aws_event_stream_rpc_client_connection_close(binding->connection, AWS_CRT_NODEJS_ERROR_EVENT_STREAM_USER_CLOSE);
    }

done:

    /*
     * Our invariant is that for the time interval between attempting to connect and either
     *
     *  (1) connection establishment failed, or
     *  (2) connection establishment succeeded and some arbitrary time later, gets shutdown
     *
     * we maintain a ref on the binding itself, ie native event stream can safely invoke callbacks that are
     * guaranteed to reach a valid binding.
     *
     * It's trickier than normal because, while we acquire in a single spot (the connect() call), we release in
     * two very different spots:
     *
     *  (1) connection establishment failed: here
     *  (2) connection establishment succeeded: in s_napi_on_event_stream_client_connection_shutdown
     *
     * Important: in the case that we successfully connected but close had already been called, we don't release
     * the binding yet and instead let shutdown release it.
     */
    if (!setup_data->connection) {
        /*
         * Only release the binding if this was a failure to connect.
         */
        s_aws_event_stream_client_connection_binding_release(binding);
    }

    aws_mem_release(setup_data->allocator, setup_data);
}

static void s_aws_event_stream_rpc_client_on_connection_setup_fn(
    struct aws_event_stream_rpc_client_connection *connection,
    int error_code,
    void *user_data) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_event_stream_client_connection_binding *binding = user_data;

    struct aws_event_stream_connection_event_data *setup_data =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_connection_event_data));
    setup_data->allocator = allocator;
    setup_data->error_code = error_code;
    setup_data->binding = binding; /* we already have a ref from the original connect call */
    setup_data->connection = connection;

    if (connection != NULL) {
        /*
         * We don't own the initial ref (the channel does, sigh).  While we are in setup data atm, this acquire
         * represents the binding's reference.
         */
        aws_event_stream_rpc_client_connection_acquire(setup_data->connection);
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_setup, setup_data));
}

napi_value aws_napi_event_stream_client_connection_connect(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_connection_connect - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_connect - needs exactly 2 arguments");
        return NULL;
    }

    struct aws_event_stream_client_connection_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_connect - Failed to extract connection binding from first "
            "argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_connect - binding was null");
        return NULL;
    }

    if (binding->is_closed) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_connect - connection already closed");
        return NULL;
    }

    AWS_FATAL_ASSERT(binding->connection == NULL);

    napi_value connection_setup_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            connection_setup_callback,
            "aws_event_stream_client_connection_on_connection_setup",
            s_napi_on_event_stream_client_connection_setup,
            binding,
            &binding->on_connection_setup),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_connection_connect - failed to create threadsafe callback function");
            return NULL;
        });

    struct aws_tls_connection_options *tls_options = NULL;
    if (binding->using_tls) {
        tls_options = &binding->tls_connection_options;
    }

    struct aws_event_stream_rpc_client_connection_options connect_options = {
        .host_name = aws_string_c_str(binding->host),
        .port = binding->port,
        .socket_options = &binding->socket_options,
        .tls_options = tls_options,
        .bootstrap = aws_napi_get_default_client_bootstrap(),
        .on_connection_setup = s_aws_event_stream_rpc_client_on_connection_setup_fn,
        .on_connection_protocol_message = s_aws_event_stream_rpc_client_connection_protocol_message_fn,
        .on_connection_shutdown = s_aws_event_stream_rpc_client_on_connection_shutdown_fn,
        .user_data = binding,
    };

    s_aws_event_stream_client_connection_binding_acquire(binding);

    if (aws_event_stream_rpc_client_connection_connect(allocator, &connect_options)) {
        /* Undo the acquire just above */
        s_aws_event_stream_client_connection_binding_release(binding);
        aws_napi_throw_last_error_with_context(
            env,
            "aws_napi_event_stream_client_connection_connect - synchronous failure invoking "
            "aws_event_stream_rpc_client_connection_connect");
        return NULL;
    }

    return NULL;
}

struct aws_event_stream_protocol_message_flushed_callback {
    struct aws_allocator *allocator;
    struct aws_event_stream_client_connection_binding *binding;
    napi_threadsafe_function on_message_flushed;
    int error_code;
};

static void s_aws_event_stream_protocol_message_flushed_callback_destroy(
    struct aws_event_stream_protocol_message_flushed_callback *callback_data) {
    if (callback_data == NULL) {
        return;
    }

    AWS_CLEAN_THREADSAFE_FUNCTION(callback_data, on_message_flushed);
    s_aws_event_stream_client_connection_binding_release(callback_data->binding);

    aws_mem_release(callback_data->allocator, callback_data);
}

static void s_napi_on_event_stream_client_connection_message_flushed(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {

    (void)context;

    struct aws_event_stream_protocol_message_flushed_callback *callback_data = user_data;
    struct aws_event_stream_client_connection_binding *binding = callback_data->binding;

    if (env && !binding->is_closed) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_CALL(env, napi_create_uint32(env, callback_data->error_code, &params[0]), { goto done; });

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, callback_data->on_message_flushed, NULL, function, num_params, params));
    }

done:

    s_aws_event_stream_protocol_message_flushed_callback_destroy(callback_data);
}

static void s_aws_event_stream_on_protocol_message_flushed(int error_code, void *user_data) {
    struct aws_event_stream_protocol_message_flushed_callback *callback_data = user_data;

    callback_data->error_code = error_code;

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(callback_data->on_message_flushed, callback_data));
}

napi_value aws_napi_event_stream_client_connection_send_protocol_message(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_event_stream_message_storage message_storage;
    AWS_ZERO_STRUCT(message_storage);

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_send_protocol_message - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_connection_send_protocol_message - needs exactly 3 arguments");
        return NULL;
    }

    struct aws_event_stream_client_connection_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_send_protocol_message - Failed to extract connection binding from "
            "first "
            "argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_connection_send_protocol_message - binding was null");
        return NULL;
    }

    if (binding->is_closed) {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_connection_send_protocol_message - connection already closed");
        return NULL;
    }

    AWS_FATAL_ASSERT(binding->connection != NULL);

    napi_value napi_message_options = *arg++;
    napi_value napi_message = NULL;
    if (aws_napi_get_named_property(
            env, napi_message_options, AWS_EVENT_STREAM_PROPERTY_NAME_MESSAGE, napi_object, &napi_message) !=
        AWS_NGNPR_VALID_VALUE) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_send_protocol_message - message options with invalid message "
            "parameter");
        return NULL;
    }

    struct aws_event_stream_protocol_message_flushed_callback *callback_data =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_protocol_message_flushed_callback));
    callback_data->allocator = allocator;
    callback_data->binding = s_aws_event_stream_client_connection_binding_acquire(binding);

    if (s_aws_event_stream_message_storage_init_from_js(&message_storage, allocator, env, napi_message, binding)) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_send_protocol_message - failed to read message properties from JS "
            "object");
        goto error;
    }

    napi_value message_flushed_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            message_flushed_callback,
            "aws_event_stream_client_connection_on_message_flushed",
            s_napi_on_event_stream_client_connection_message_flushed,
            callback_data,
            &callback_data->on_message_flushed),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_connection_send_protocol_message - failed to create threadsafe callback "
                "function");
            goto error;
        });

    struct aws_event_stream_rpc_message_args message_args = {
        .headers = (struct aws_event_stream_header_value_pair *)message_storage.headers.data,
        .headers_count = s_aws_array_list_length(&message_storage.headers),
        .payload = message_storage.payload,
        .message_type = message_storage.message_type,
        .message_flags = message_storage.message_flags,
    };

    if (aws_event_stream_rpc_client_connection_send_protocol_message(
            binding->connection, &message_args, s_aws_event_stream_on_protocol_message_flushed, callback_data)) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_connection_send_protocol_message - synchronous error invoking native "
            "send_protocol_message");
        goto error;
    }

    goto done;

error:

    s_aws_event_stream_protocol_message_flushed_callback_destroy(callback_data);

done:

    s_aws_event_stream_message_storage_clean_up(&message_storage);

    return NULL;
}

/*********************************************************************************************************************/

/*
 * Binding object that outlives the associated napi wrapper object.  When that object finalizes, then it's a signal
 * to this object to destroy the stream (and itself, afterwards).
 *
 * WARNING
 * Data Access Rules:
 *  (1) If in the libuv thread (called from JS or in the invocation of a thread-safe function), you may access anything
 *      in the binding
 *  (2) Otherwise, you may only access thread-safe functions or the binding's ref count APIs.  In particular,
 *      'stream' and 'is_closed' are off-limits unless you're in the libuv thread.
 */
struct aws_event_stream_client_stream_binding {
    struct aws_allocator *allocator;

    /*
     * We ref count the binding itself because there are two primary time intervals that together create a union
     * that we must honor.
     *
     * Interval #1: The binding must live from new() to close()
     * Interval #2: The binding must live from activate() to {stream failure || stream shutdown} as processed
     *    by the libuv thread.  It is incorrect to react to those events in the event loop callback; we must bundle
     *    and ship them across to the libuv thread.  When the libuv thread is processing a stream failure or
     *    shutdown, we know that no other events can possibly be pending (they would have already been
     *    processed in the libuv thread).
     *
     * The union of those two intervals is "probably" enough, but its correctness would rest on an internal property
     * of the node implementation itself: "are calls to napi_call_threadsafe_function() well-ordered with respect to
     * a single producer (we only call it from the libuv thread itself)?"  This is almost certainly true, but I don't
     * see it guaranteed within the n-api documentation.  For that reason, we also add the intervals of all
     * completable stream events: incoming stream messages and outbound message flushes
     */
    struct aws_ref_count ref_count;

    /*
     * May only be accessed from within the libuv thread.  This includes stream APIs like acquire and release.
     */
    struct aws_event_stream_rpc_client_continuation_token *stream;
    bool is_closed;

    /*
     * Single count ref to the JS stream object.
     */
    napi_ref node_event_stream_client_stream_ref;

    /*
     * Single count ref to the node external managed by the binding.
     */
    napi_ref node_event_stream_client_stream_external_ref;

    napi_threadsafe_function on_stream_activated;
    napi_threadsafe_function on_stream_ended;
    napi_threadsafe_function on_stream_message;
};

static void s_aws_event_stream_client_stream_binding_on_zero(void *context) {
    if (context == NULL) {
        return;
    }

    struct aws_event_stream_client_stream_binding *binding = context;

    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_stream_activated);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_stream_ended);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_stream_message);

    aws_mem_release(binding->allocator, binding);
}

static struct aws_event_stream_client_stream_binding *s_aws_event_stream_client_stream_binding_acquire(
    struct aws_event_stream_client_stream_binding *binding) {
    if (binding == NULL) {
        return NULL;
    }

    aws_ref_count_acquire(&binding->ref_count);
    return binding;
}

static struct aws_event_stream_client_stream_binding *s_aws_event_stream_client_stream_binding_release(
    struct aws_event_stream_client_stream_binding *binding) {
    if (binding != NULL) {
        aws_ref_count_release(&binding->ref_count);
    }

    return NULL;
}

static void s_close_stream_binding(napi_env env, struct aws_event_stream_client_stream_binding *binding) {
    AWS_FATAL_ASSERT(env != NULL);

    binding->is_closed = true;

    napi_ref node_event_stream_client_stream_external_ref = binding->node_event_stream_client_stream_external_ref;
    binding->node_event_stream_client_stream_external_ref = NULL;

    napi_ref node_event_stream_client_stream_ref = binding->node_event_stream_client_stream_ref;
    binding->node_event_stream_client_stream_ref = NULL;

    if (node_event_stream_client_stream_external_ref != NULL) {
        napi_delete_reference(env, node_event_stream_client_stream_external_ref);
    }

    if (node_event_stream_client_stream_ref != NULL) {
        napi_delete_reference(env, node_event_stream_client_stream_ref);
    }
}

static void s_napi_event_stream_on_stream_ended(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct aws_event_stream_client_stream_binding *binding = user_data;

    if (env && !binding->is_closed) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_stream_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_on_stream_ended - event_stream_client_stream node wrapper no "
                "longer resolvable");
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(env, binding->on_stream_ended, NULL, function, num_params, params));
    }

done:

    if (binding->stream != NULL) {
        aws_event_stream_rpc_client_continuation_release(binding->stream);
        binding->stream = NULL;
    }

    /* release the binding ref acquired in the call to activate() */
    s_aws_event_stream_client_stream_binding_release(binding);
}

static void s_event_stream_on_stream_ended(
    struct aws_event_stream_rpc_client_continuation_token *stream,
    void *user_data) {

    (void)stream;

    struct aws_event_stream_client_stream_binding *binding = user_data;

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_stream_ended, binding));
}

struct aws_event_stream_stream_message_event {
    struct aws_allocator *allocator;
    struct aws_event_stream_message_storage storage;
    struct aws_event_stream_client_stream_binding *binding;
};

static void s_aws_event_stream_stream_message_event_destroy(struct aws_event_stream_stream_message_event *event) {
    if (event == NULL) {
        return;
    }

    s_aws_event_stream_message_storage_clean_up(&event->storage);
    s_aws_event_stream_client_stream_binding_release(event->binding);

    aws_mem_release(event->allocator, event);
}

static void s_napi_event_stream_on_stream_message(napi_env env, napi_value function, void *context, void *user_data) {

    (void)context;

    struct aws_event_stream_stream_message_event *message_event = user_data;
    struct aws_event_stream_client_stream_binding *binding = message_event->binding;

    if (env && !binding->is_closed) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_stream_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_on_stream_message - event_stream_client_stream node wrapper no "
                "longer resolvable");
            goto done;
        }

        if (s_aws_create_napi_value_from_event_stream_message_storage(env, &message_event->storage, &params[1])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_event_stream_on_stream_message - failed to create JS representation of incoming "
                "message");
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(env, binding->on_stream_message, NULL, function, num_params, params));
    }

done:

    s_aws_event_stream_stream_message_event_destroy(message_event);
}

static void s_event_stream_on_stream_message(
    struct aws_event_stream_rpc_client_continuation_token *stream,
    const struct aws_event_stream_rpc_message_args *message_args,
    void *user_data) {

    (void)stream;

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_event_stream_stream_message_event *event =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_stream_message_event));

    event->allocator = allocator;
    event->binding =
        s_aws_event_stream_client_stream_binding_acquire((struct aws_event_stream_client_stream_binding *)user_data);

    if (s_aws_event_stream_message_storage_init_from_native(&event->storage, allocator, message_args)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_event_stream_on_stream_message - unable to initialize message storage",
            (void *)event->binding);
        s_aws_event_stream_stream_message_event_destroy(event);
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(event->binding->on_stream_message, event));
}

napi_value aws_napi_event_stream_client_stream_new(napi_env env, napi_callback_info info) {
    napi_value node_args[4];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - needs exactly 4 arguments");
        return NULL;
    }

    napi_value node_stream_ref = NULL;
    napi_value node_external = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_event_stream_client_stream_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_client_stream_binding));
    binding->allocator = allocator;
    aws_ref_count_init(&binding->ref_count, binding, s_aws_event_stream_client_stream_binding_on_zero);

    AWS_NAPI_CALL(env, napi_create_external(env, binding, NULL, NULL, &node_external), {
        aws_mem_release(allocator, binding);
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - Failed to create n-api external");
        s_aws_event_stream_client_stream_binding_release(binding);
        goto done;
    });

    /*
     * From here on out, a failure will lead the external to getting finalized by node, which in turn will lead the
     * binding to getting cleaned up.
     */

    /* Arg #1: the js stream */
    napi_value node_stream = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_stream)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - Required stream parameter is null");
        goto error;
    }

    AWS_NAPI_CALL(env, napi_create_reference(env, node_stream, 1, &binding->node_event_stream_client_stream_ref), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_new - Failed to create reference to node event stream client stream");
        goto error;
    });

    /* Arg #2: the event stream connection to create a stream on */
    struct aws_event_stream_client_connection_binding *connection_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&connection_binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_new - Failed to extract connection binding from "
            "first "
            "argument");
        goto error;
    });

    if (connection_binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - binding was null");
        goto error;
    }

    if (connection_binding->is_closed) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - connection already closed");
        goto error;
    }

    if (connection_binding->connection == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - connection is null");
        goto error;
    }

    /* Arg #3: on stream ended event handler */
    napi_value on_stream_ended_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_stream_ended_event_handler)) {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_stream_new - required on_stream_ended event handler is null");
        goto error;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            on_stream_ended_event_handler,
            "aws_event_stream_client_connection_on_stream_ended",
            s_napi_event_stream_on_stream_ended,
            NULL,
            &binding->on_stream_ended),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_stream_new - failed to initialize on_stream_ended threadsafe function");
            goto error;
        });

    /* Arg #4: on stream message event handler */
    napi_value on_stream_message_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_stream_message_event_handler)) {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_stream_new - required on_stream_message event handler is null");
        goto error;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            on_stream_message_event_handler,
            "aws_event_stream_on_stream_message",
            s_napi_event_stream_on_stream_message,
            NULL,
            &binding->on_stream_message),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_stream_new - failed to initialize on_stream_message threadsafe function");
            goto error;
        });

    struct aws_event_stream_rpc_client_stream_continuation_options stream_options = {
        .on_continuation = s_event_stream_on_stream_message,
        .on_continuation_closed = s_event_stream_on_stream_ended,
        .user_data = binding,
    };

    binding->stream =
        aws_event_stream_rpc_client_connection_new_stream(connection_binding->connection, &stream_options);
    if (binding->stream == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_new - Failed to create native stream");
        goto error;
    }

    AWS_NAPI_CALL(
        env, napi_create_reference(env, node_external, 1, &binding->node_event_stream_client_stream_external_ref), {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_stream_new - Failed to create one count reference to napi external");
            goto error;
        });

    node_stream_ref = node_external;
    goto done;

error:

    s_close_stream_binding(env, binding);

done:

    return node_stream_ref;
}

napi_value aws_napi_event_stream_client_stream_close(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_close - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_close - needs exactly 1 argument");
        return NULL;
    }

    struct aws_event_stream_client_stream_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_close - Failed to extract stream binding from first argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_close - binding was null");
        return NULL;
    }

    /* This severs the ability to call back into JS and makes the binding's extern available for garbage collection */
    s_close_stream_binding(env, binding);

    struct aws_event_stream_rpc_client_continuation_token *stream = binding->stream;
    if (stream != NULL) {
        binding->stream = NULL;
        aws_event_stream_rpc_client_continuation_release(stream);
    }

    /*
     * Release the allocation-ref on the binding.  If there is a stream activation in progress (or being shutdown) there
     * is a second ref outstanding which is removed on stream shutdown or failed activation.
     *
     * This is safe to do here because the internal state of the JS stream object blocks all future native
     * invocations.
     */
    s_aws_event_stream_client_stream_binding_release(binding);

    return NULL;
}

struct aws_event_stream_activation_event_data {
    struct aws_allocator *allocator;
    int error_code;
    struct aws_event_stream_client_stream_binding *binding;
};

static void s_napi_on_event_stream_client_stream_activation(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {
    (void)context;

    struct aws_event_stream_activation_event_data *activation_data = user_data;
    struct aws_event_stream_client_stream_binding *binding = activation_data->binding;

    if (env && !binding->is_closed) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the event stream, then it's been garbage collected and we
         * should not do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_event_stream_client_stream_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_on_event_stream_client_stream_activation - event_stream_client_stream node wrapper no "
                "longer resolvable");
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, activation_data->error_code, &params[1]), { goto done; });

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_stream_activated, NULL, function, num_params, params));
    }

done:

    /* A failed activation must release the binding ref acquired in the call to activate() */
    if (activation_data->error_code != 0) {
        s_aws_event_stream_client_stream_binding_release(binding);
    }

    aws_mem_release(activation_data->allocator, activation_data);
}

static void s_aws_event_stream_on_stream_activation_flush(int error_code, void *user_data) {
    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_event_stream_client_stream_binding *binding = user_data;

    struct aws_event_stream_activation_event_data *activation_data =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_activation_event_data));
    activation_data->allocator = allocator;
    activation_data->error_code = error_code;
    activation_data->binding = binding; /* we already have a ref from the original activate call */

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_stream_activated, activation_data));
}

static int s_aws_extract_activation_options_from_js(
    napi_env env,
    napi_value napi_activation_options,
    struct aws_event_stream_client_stream_binding *binding,
    struct aws_byte_buf *operation_name_buffer,
    struct aws_event_stream_message_storage *activation_message) {

    if (aws_napi_get_named_property_as_bytebuf(
            env,
            napi_activation_options,
            AWS_EVENT_STREAM_PROPERTY_NAME_OPERATION,
            napi_string,
            operation_name_buffer) != AWS_NGNPR_VALID_VALUE) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_extract_activation_options_from_js - failed to get required `operation` property from "
            "activation options",
            (void *)binding);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    napi_value napi_activation_message;
    if (aws_napi_get_named_property(
            env,
            napi_activation_options,
            AWS_EVENT_STREAM_PROPERTY_NAME_MESSAGE,
            napi_object,
            &napi_activation_message)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_extract_activation_options_from_js - failed to get required `message` property from "
            "activation options",
            (void *)binding);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();
    if (s_aws_event_stream_message_storage_init_from_js(
            activation_message, allocator, env, napi_activation_message, binding)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_extract_activation_options_from_js - failed to unpack activation message from JS",
            (void *)binding);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_event_stream_client_stream_activate(napi_env env, napi_callback_info info) {

    struct aws_byte_buf operation_name_buffer;
    AWS_ZERO_STRUCT(operation_name_buffer);
    struct aws_event_stream_message_storage activation_message;
    AWS_ZERO_STRUCT(activation_message);

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_activate - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_activate - needs exactly 3 arguments");
        return NULL;
    }

    struct aws_event_stream_client_stream_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_activate - Failed to extract stream binding from first "
            "argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_activate - binding was null");
        return NULL;
    }

    if (binding->is_closed || binding->stream == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_activate - stream already closed");
        return NULL;
    }

    napi_value napi_activation_options = *arg++;
    if (s_aws_extract_activation_options_from_js(
            env, napi_activation_options, binding, &operation_name_buffer, &activation_message)) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_activate - unable to unpack activation options from JS object");
        goto done;
    }

    napi_value stream_activation_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            stream_activation_callback,
            "aws_event_stream_client_stream_on_activation",
            s_napi_on_event_stream_client_stream_activation,
            binding,
            &binding->on_stream_activated),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_stream_activate - failed to create threadsafe callback function");
            goto done;
        });

    s_aws_event_stream_client_stream_binding_acquire(binding);

    struct aws_event_stream_rpc_message_args message_args = {
        .headers = (struct aws_event_stream_header_value_pair *)activation_message.headers.data,
        .headers_count = s_aws_array_list_length(&activation_message.headers),
        .payload = activation_message.payload,
        .message_type = activation_message.message_type,
        .message_flags = activation_message.message_flags,
    };

    if (aws_event_stream_rpc_client_continuation_activate(
            binding->stream,
            aws_byte_cursor_from_buf(&operation_name_buffer),
            &message_args,
            s_aws_event_stream_on_stream_activation_flush,
            binding)) {
        /* Undo the acquire just above */
        s_aws_event_stream_client_stream_binding_release(binding);
        aws_napi_throw_last_error_with_context(
            env,
            "aws_napi_event_stream_client_stream_activate - synchronous failure invoking "
            "aws_event_stream_rpc_client_continuation_activate");
        goto done;
    }

done:

    aws_byte_buf_clean_up(&operation_name_buffer);
    s_aws_event_stream_message_storage_clean_up(&activation_message);

    return NULL;
}

struct aws_event_stream_stream_message_flushed_callback {
    struct aws_allocator *allocator;
    struct aws_event_stream_client_stream_binding *binding;
    napi_threadsafe_function on_message_flushed;
    int error_code;
};

static void s_aws_event_stream_stream_message_flushed_callback_destroy(
    struct aws_event_stream_stream_message_flushed_callback *callback_data) {
    if (callback_data == NULL) {
        return;
    }

    AWS_CLEAN_THREADSAFE_FUNCTION(callback_data, on_message_flushed);
    s_aws_event_stream_client_stream_binding_release(callback_data->binding);

    aws_mem_release(callback_data->allocator, callback_data);
}

static void s_napi_on_event_stream_client_stream_message_flushed(
    napi_env env,
    napi_value function,
    void *context,
    void *user_data) {

    (void)context;

    struct aws_event_stream_stream_message_flushed_callback *callback_data = user_data;
    struct aws_event_stream_client_stream_binding *binding = callback_data->binding;

    if (env && !binding->is_closed) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_CALL(env, napi_create_uint32(env, callback_data->error_code, &params[0]), { goto done; });

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, callback_data->on_message_flushed, NULL, function, num_params, params));
    }

done:

    s_aws_event_stream_stream_message_flushed_callback_destroy(callback_data);
}

static void s_aws_event_stream_on_stream_message_flushed(int error_code, void *user_data) {
    struct aws_event_stream_stream_message_flushed_callback *callback_data = user_data;

    callback_data->error_code = error_code;

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(callback_data->on_message_flushed, callback_data));
}

napi_value aws_napi_event_stream_client_stream_send_message(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_event_stream_message_storage message_storage;
    AWS_ZERO_STRUCT(message_storage);

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(
            env, NULL, "aws_napi_event_stream_client_stream_send_message - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_send_message - needs exactly 3 arguments");
        return NULL;
    }

    struct aws_event_stream_client_stream_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_send_message - Failed to extract stream binding from "
            "first "
            "argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_send_message - binding was null");
        return NULL;
    }

    if (binding->is_closed || binding->stream == NULL) {
        napi_throw_error(env, NULL, "aws_napi_event_stream_client_stream_send_message - connection already closed");
        return NULL;
    }

    napi_value napi_message_options = *arg++;
    napi_value napi_message = NULL;
    if (aws_napi_get_named_property(
            env, napi_message_options, AWS_EVENT_STREAM_PROPERTY_NAME_MESSAGE, napi_object, &napi_message) !=
        AWS_NGNPR_VALID_VALUE) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_send_message - message options with invalid message "
            "parameter");
        return NULL;
    }

    struct aws_event_stream_stream_message_flushed_callback *callback_data =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_event_stream_stream_message_flushed_callback));
    callback_data->allocator = allocator;
    callback_data->binding = s_aws_event_stream_client_stream_binding_acquire(binding);

    if (s_aws_event_stream_message_storage_init_from_js(&message_storage, allocator, env, napi_message, binding)) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_send_message - failed to read message properties from JS "
            "object");
        goto error;
    }

    napi_value message_flushed_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            message_flushed_callback,
            "aws_event_stream_client_stream_on_message_flushed",
            s_napi_on_event_stream_client_stream_message_flushed,
            callback_data,
            &callback_data->on_message_flushed),
        {
            napi_throw_error(
                env,
                NULL,
                "aws_napi_event_stream_client_stream_send_message - failed to create threadsafe callback "
                "function");
            goto error;
        });

    struct aws_event_stream_rpc_message_args message_args = {
        .headers = (struct aws_event_stream_header_value_pair *)message_storage.headers.data,
        .headers_count = s_aws_array_list_length(&message_storage.headers),
        .payload = message_storage.payload,
        .message_type = message_storage.message_type,
        .message_flags = message_storage.message_flags,
    };

    if (aws_event_stream_rpc_client_continuation_send_message(
            binding->stream, &message_args, s_aws_event_stream_on_stream_message_flushed, callback_data)) {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_event_stream_client_stream_send_message - synchronous error invoking native "
            "send_message");
        goto error;
    }

    goto done;

error:

    s_aws_event_stream_stream_message_flushed_callback_destroy(callback_data);

done:

    s_aws_event_stream_message_storage_clean_up(&message_storage);

    return NULL;
}
