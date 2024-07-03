/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "mqtt_client_connection.h"

#include "mqtt_client.h"

#include "http_connection.h"
#include "http_message.h"

#include <aws/mqtt/client.h>

#include <aws/http/proxy.h>

#include <aws/io/socket.h>
#include <aws/io/tls_channel_handler.h>

#include <aws/common/linked_list.h>
#include <aws/common/mutex.h>

static const char *AWS_NAPI_KEY_INCOMPLETE_OPERATION_COUNT = "incompleteOperationCount";
static const char *AWS_NAPI_KEY_INCOMPLETE_OPERATION_SIZE = "incompleteOperationSize";
static const char *AWS_NAPI_KEY_UNACKED_OPERATION_COUNT = "unackedOperationCount";
static const char *AWS_NAPI_KEY_UNACKED_OPERATION_SIZE = "unackedOperationSize";

static void s_transform_websocket_call(napi_env env, napi_value transform_websocket, void *context, void *user_data);
void s_transform_websocket(
    struct aws_http_message *request,
    void *user_data,
    aws_mqtt_transform_websocket_handshake_complete_fn *complete_fn,
    void *complete_ctx);

struct mqtt_connection_binding {
    struct aws_allocator *allocator;
    bool use_tls_options;
    struct aws_tls_connection_options tls_options;
    struct aws_mqtt_client_connection *connection;

    napi_env env;

    napi_ref node_external;
    napi_threadsafe_function on_connection_interrupted;
    napi_threadsafe_function on_connection_resumed;
    napi_threadsafe_function on_any_publish;
    napi_threadsafe_function transform_websocket;
    napi_threadsafe_function on_closed;
    napi_threadsafe_function on_connection_success;
    napi_threadsafe_function on_connection_failure;
    bool first_successfull_connection;
};

static void s_mqtt_client_connection_release_threadsafe_function_on_failure(struct mqtt_connection_binding *binding) {

    if (binding->on_connection_failure != NULL) {
        AWS_NAPI_ENSURE(
            binding->env, aws_napi_release_threadsafe_function(binding->on_connection_failure, napi_tsfn_abort));
        binding->on_connection_failure = NULL;
    }
}

static void s_mqtt_client_connection_release_threadsafe_function(struct mqtt_connection_binding *binding) {

    if (binding->on_connection_interrupted != NULL) {
        AWS_NAPI_ENSURE(
            binding->env, aws_napi_release_threadsafe_function(binding->on_connection_interrupted, napi_tsfn_abort));
        binding->on_connection_interrupted = NULL;
    }

    if (binding->on_connection_resumed != NULL) {
        AWS_NAPI_ENSURE(
            binding->env, aws_napi_release_threadsafe_function(binding->on_connection_resumed, napi_tsfn_abort));
        binding->on_connection_resumed = NULL;
    }

    if (binding->on_any_publish != NULL) {
        AWS_NAPI_ENSURE(binding->env, aws_napi_release_threadsafe_function(binding->on_any_publish, napi_tsfn_abort));
        binding->on_any_publish = NULL;
    }

    if (binding->transform_websocket != NULL) {
        AWS_NAPI_ENSURE(
            binding->env, aws_napi_release_threadsafe_function(binding->transform_websocket, napi_tsfn_abort));
        binding->transform_websocket = NULL;
    }

    if (binding->on_closed != NULL) {
        AWS_NAPI_ENSURE(binding->env, aws_napi_release_threadsafe_function(binding->on_closed, napi_tsfn_abort));
        binding->on_closed = NULL;
    }

    if (binding->on_connection_success != NULL) {
        AWS_NAPI_ENSURE(
            binding->env, aws_napi_release_threadsafe_function(binding->on_connection_success, napi_tsfn_abort));
        binding->on_connection_success = NULL;
    }
}

static void s_mqtt_client_connection_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)finalize_hint;
    (void)env;
    struct mqtt_connection_binding *binding = finalize_data;

    AWS_LOGF_DEBUG(AWS_LS_NODEJS_CRT_GENERAL, "Destroying binding for connection %p", (void *)binding->connection);

    /* Should have already been done, but just to be safe -- now that it's reentrant -- release the functions anyways */
    s_mqtt_client_connection_release_threadsafe_function(binding);
    s_mqtt_client_connection_release_threadsafe_function_on_failure(binding);

    if (binding->use_tls_options) {
        aws_tls_connection_options_clean_up(&binding->tls_options);
    }
    if (binding->connection) {
        aws_mqtt_client_connection_release(binding->connection);
    }

    aws_mem_release(binding->allocator, binding);
}

napi_value aws_napi_mqtt_client_connection_close(napi_env env, napi_callback_info info) {

    struct mqtt_connection_binding *binding = NULL;
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];

    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_close needs exactly 1 argument");
        return NULL;
    }

    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract connection from first argument");
        return NULL;
    });

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has already been closed and cannot be closed again");
        return NULL;
    }

    /* connection has been shutdown, no callbacks will happen after it */
    s_mqtt_client_connection_release_threadsafe_function(binding);
    s_mqtt_client_connection_release_threadsafe_function_on_failure(binding);

    /* no more node interop will be done, free node resources */
    if (binding->node_external) {
        napi_delete_reference(env, binding->node_external);
        binding->node_external = NULL;
    }

    if (binding->connection) {
        aws_mqtt_client_connection_release(binding->connection);
        binding->connection = NULL;
    }

    return NULL;
}

/*******************************************************************************
 * on_connection_interrupted
 ******************************************************************************/
struct connection_interrupted_args {
    int error_code;
};

static void s_on_connection_interrupted_call(napi_env env, napi_value on_interrupted, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct connection_interrupted_args *args = user_data;

    if (env) {
        if (binding->on_connection_interrupted) {

            napi_value params[1];
            const size_t num_params = AWS_ARRAY_SIZE(params);

            AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[0]));

            AWS_NAPI_ENSURE(
                env,
                aws_napi_dispatch_threadsafe_function(
                    env, binding->on_connection_interrupted, NULL, on_interrupted, num_params, params));
        } else {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "Interrupt callback invoked for connection binding %p but callback is null",
                (void *)binding);
        }
    }

    aws_mem_release(binding->allocator, args);
}

static void s_on_connection_interrupted(
    struct aws_mqtt_client_connection *connection,
    int error_code,
    void *user_data) {
    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    if (!binding->on_connection_interrupted) {
        return;
    }

    struct connection_interrupted_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct connection_interrupted_args));
    AWS_FATAL_ASSERT(args);
    args->error_code = error_code;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_interrupted, args));
}

/*******************************************************************************
 * on_connection_resumed
 ******************************************************************************/
struct connection_resumed_args {
    enum aws_mqtt_connect_return_code return_code;
    bool session_present;
};

static void s_on_connection_resumed_call(napi_env env, napi_value on_resumed, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct connection_resumed_args *args = user_data;

    if (env) {
        if (binding->on_connection_resumed) {
            napi_value params[2];
            const size_t num_params = AWS_ARRAY_SIZE(params);

            AWS_NAPI_ENSURE(env, napi_create_int32(env, args->return_code, &params[0]));
            AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->session_present, &params[1]));

            AWS_NAPI_ENSURE(
                env,
                aws_napi_dispatch_threadsafe_function(
                    env, binding->on_connection_resumed, NULL, on_resumed, num_params, params));
        } else {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "Resume callback invoked for connection binding %p but callback is null",
                (void *)binding);
        }
    }

    aws_mem_release(binding->allocator, args);
}

static void s_on_connection_resumed(
    struct aws_mqtt_client_connection *connection,
    enum aws_mqtt_connect_return_code return_code,
    bool session_present,
    void *user_data) {
    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    if (!binding->on_connection_resumed) {
        return;
    }

    struct connection_resumed_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct connection_resumed_args));
    AWS_FATAL_ASSERT(args);

    args->return_code = return_code;
    args->session_present = session_present;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_resumed, args));
}

/*******************************************************************************
 * on_connection_success
 ******************************************************************************/
struct connection_success_args {
    enum aws_mqtt_connect_return_code return_code;
    bool session_present;
};

static void s_on_connection_success_call(napi_env env, napi_value on_success, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct connection_success_args *args = user_data;

    if (env) {
        if (binding->on_connection_success) {
            napi_value params[2];
            const size_t num_params = AWS_ARRAY_SIZE(params);

            AWS_NAPI_ENSURE(env, napi_create_int32(env, args->return_code, &params[0]));
            AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->session_present, &params[1]));

            AWS_NAPI_ENSURE(
                env,
                aws_napi_dispatch_threadsafe_function(
                    env, binding->on_connection_success, NULL, on_success, num_params, params));
        } else {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "Success callback invoked for connection binding %p but callback is null",
                (void *)binding);
        }
    }
    aws_mem_release(binding->allocator, args);
}

static void s_on_connection_success(
    struct aws_mqtt_client_connection *connection,
    enum aws_mqtt_connect_return_code return_code,
    bool session_present,
    void *user_data) {
    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    binding->first_successfull_connection = true;
    if (!binding->on_connection_success) {
        return;
    }

    struct connection_success_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct connection_success_args));
    AWS_FATAL_ASSERT(args);

    args->return_code = return_code;
    args->session_present = session_present;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_success, args));
}

/*******************************************************************************
 * on_connection_failure
 ******************************************************************************/

struct connection_failure_args {
    int error_code;
};
static void s_on_connection_failure_call(napi_env env, napi_value on_failure, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct connection_failure_args *args = user_data;
    if (env) {
        if (binding->on_connection_failure) {
            napi_value params[1];
            const size_t num_params = AWS_ARRAY_SIZE(params);

            AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[0]));

            AWS_NAPI_ENSURE(
                env,
                aws_napi_dispatch_threadsafe_function(
                    env, binding->on_connection_failure, NULL, on_failure, num_params, params));
            s_mqtt_client_connection_release_threadsafe_function_on_failure(binding);
        } else {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "Failure callback invoked for connection binding %p but callback is null",
                (void *)binding);
        }
    }
    aws_mem_release(binding->allocator, args);
}

static void s_on_connection_failure(struct aws_mqtt_client_connection *connection, int error_code, void *user_data) {
    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    if (!binding->on_connection_failure) {
        return;
    }

    struct connection_failure_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct connection_failure_args));
    AWS_FATAL_ASSERT(args);
    args->error_code = error_code;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_failure, args));
}

napi_value aws_napi_mqtt_client_connection_new(napi_env env, napi_callback_info cb_info) {

    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[14];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_new received wrong number of arguments");
        return NULL;
    }

    struct mqtt_connection_binding *binding = aws_mem_calloc(allocator, 1, sizeof(struct mqtt_connection_binding));
    AWS_FATAL_ASSERT(binding);
    binding->env = env;
    binding->allocator = allocator;
    binding->first_successfull_connection = false;

    napi_value node_external;
    AWS_NAPI_CALL(env, napi_create_external(env, binding, s_mqtt_client_connection_finalize, NULL, &node_external), {
        napi_throw_error(env, NULL, "Failed create n-api external");
        aws_mem_release(allocator, binding);
        return NULL;
    });

    /* From hereon, we need to clean up if errors occur.
     * It's good practice to store long-lived values in the binding, and clean them up from the finalizer.
     * If this new() function fails partway through, the finalizer will still run and clean them up. */

    napi_value result = NULL;

    /* Allocations that should not outlive this function */
    struct aws_byte_buf will_topic;
    AWS_ZERO_STRUCT(will_topic);
    struct aws_byte_buf will_payload;
    AWS_ZERO_STRUCT(will_payload);
    struct aws_byte_buf username;
    AWS_ZERO_STRUCT(username);
    struct aws_byte_buf password;
    AWS_ZERO_STRUCT(password);

    napi_value node_client_external = *arg++;
    struct mqtt_nodejs_client *node_client;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_client_external, (void **)&node_client), {
        napi_throw_error(env, NULL, "Failed to extract client from external");
        goto cleanup;
    });

    napi_value node_on_interrupted = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_interrupted)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_interrupted,
                "aws_mqtt_client_connection_on_connection_interrupted",
                s_on_connection_interrupted_call,
                binding,
                &binding->on_connection_interrupted),
            { goto cleanup; });
    }

    napi_value node_on_resumed = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_resumed)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_resumed,
                "aws_mqtt_client_connection_on_connection_resumed",
                s_on_connection_resumed_call,
                binding,
                &binding->on_connection_resumed),
            { goto cleanup; });
    }

    napi_value node_on_success = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_success)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_success,
                "aws_mqtt_client_connection_on_connection_success",
                s_on_connection_success_call,
                binding,
                &binding->on_connection_success),
            { goto cleanup; });
    }

    napi_value node_on_failure = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_failure)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_failure,
                "aws_mqtt_client_connection_on_connection_failure",
                s_on_connection_failure_call,
                binding,
                &binding->on_connection_failure),
            { goto cleanup; });
    }

    /* CREATE THE THING */
    binding->connection = aws_mqtt_client_connection_new(node_client->native_client);
    if (!binding->connection) {
        napi_throw_error(env, NULL, "Failed create native connection object");
        goto cleanup;
    }

    if (binding->on_connection_interrupted || binding->on_connection_resumed) {
        aws_mqtt_client_connection_set_connection_interruption_handlers(
            binding->connection, s_on_connection_interrupted, binding, s_on_connection_resumed, binding);
    }

    if (binding->on_connection_failure || binding->on_connection_success) {
        if (aws_mqtt_client_connection_set_connection_result_handlers(
                binding->connection, s_on_connection_success, binding, s_on_connection_failure, binding) !=
            AWS_OP_SUCCESS) {
            goto cleanup;
        }
    }

    napi_value node_tls = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_tls)) {
        struct aws_tls_ctx *tls_ctx;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls, (void **)&tls_ctx), {
            napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
            goto cleanup;
        });

        aws_tls_connection_options_init_from_ctx(&binding->tls_options, tls_ctx);
        binding->use_tls_options = true;
    }

    napi_value node_will = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_will)) {
        napi_value node_topic = NULL;
        AWS_NAPI_CALL(env, napi_get_named_property(env, node_will, "topic", &node_topic), {
            napi_throw_type_error(env, NULL, "will must contain a topic string");
            goto cleanup;
        });
        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&will_topic, env, node_topic), {
            aws_napi_throw_last_error(env);
            goto cleanup;
        });
        napi_value node_payload;
        AWS_NAPI_CALL(env, napi_get_named_property(env, node_will, "payload", &node_payload), {
            napi_throw_type_error(env, NULL, "will must contain a payload DataView");
            goto cleanup;
        });
        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&will_payload, env, node_payload), {
            aws_napi_throw_last_error(env);
            goto cleanup;
        });
        napi_value node_qos;
        AWS_NAPI_CALL(env, napi_get_named_property(env, node_will, "qos", &node_qos), {
            napi_throw_type_error(env, NULL, "will must contain a qos member");
            goto cleanup;
        });
        enum aws_mqtt_qos will_qos;
        AWS_NAPI_CALL(env, napi_get_value_int32(env, node_qos, (int32_t *)&will_qos), {
            napi_throw_type_error(env, NULL, "will.qos must be a number");
            goto cleanup;
        });
        napi_value node_retain;
        AWS_NAPI_CALL(env, napi_get_named_property(env, node_will, "retain", &node_retain), {
            napi_throw_type_error(env, NULL, "will must contain a retain member");
            goto cleanup;
        });
        bool will_retain;
        AWS_NAPI_CALL(env, napi_get_value_bool(env, node_retain, &will_retain), {
            napi_throw_type_error(env, NULL, "will.retain must be a boolean");
            goto cleanup;
        });

        struct aws_byte_cursor topic_cur = aws_byte_cursor_from_buf(&will_topic);
        struct aws_byte_cursor payload_cur = aws_byte_cursor_from_buf(&will_payload);
        if (aws_mqtt_client_connection_set_will(binding->connection, &topic_cur, will_qos, will_retain, &payload_cur)) {
            aws_napi_throw_last_error(env);
            goto cleanup;
        }
    }

    napi_value node_username = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_username)) {
        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&username, env, node_username), {
            napi_throw_type_error(env, NULL, "username must be a String");
            goto cleanup;
        });
    }

    napi_value node_password = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_password)) {
        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&password, env, node_password), {
            napi_throw_type_error(env, NULL, "password must be a String");
            goto cleanup;
        });
    }

    if (username.buffer || password.buffer) {
        struct aws_byte_cursor username_cur = aws_byte_cursor_from_buf(&username);
        struct aws_byte_cursor password_cur = aws_byte_cursor_from_buf(&password);
        if (aws_mqtt_client_connection_set_login(binding->connection, &username_cur, &password_cur)) {
            aws_napi_throw_last_error(env);
            goto cleanup;
        }
    }

    napi_value node_use_websocket = *arg++;
    bool use_websocket = false;
    if (!aws_napi_is_null_or_undefined(env, node_use_websocket)) {
        AWS_NAPI_CALL(env, napi_get_value_bool(env, node_use_websocket, &use_websocket), {
            napi_throw_type_error(env, NULL, "use_websocket must be a boolean");
            goto cleanup;
        });
    }

    napi_value node_proxy_options = *arg++;
    struct aws_http_proxy_options *proxy_options = NULL;
    if (!aws_napi_is_null_or_undefined(env, node_proxy_options)) {
        struct http_proxy_options_binding *proxy_binding = NULL;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_proxy_options, (void **)&proxy_binding), {
            napi_throw_type_error(env, NULL, "proxy_options must be an external");
            goto cleanup;
        });
        /* proxy_options are copied internally, no need to go nuts on copies */
        proxy_options = aws_napi_get_http_proxy_options(proxy_binding);
        aws_mqtt_client_connection_set_http_proxy_options(binding->connection, proxy_options);
    }

    napi_value node_transform_websocket = *arg++;
    if (use_websocket) {
        if (!aws_napi_is_null_or_undefined(env, node_transform_websocket)) {
            AWS_NAPI_CALL(
                env,
                aws_napi_create_threadsafe_function(
                    env,
                    node_transform_websocket,
                    "aws_mqtt_client_connection_transform_websocket",
                    s_transform_websocket_call,
                    binding,
                    &binding->transform_websocket),
                {
                    napi_throw_error(env, NULL, "Failed to bind transform_websocket callback");
                    goto cleanup;
                });
            aws_mqtt_client_connection_use_websockets(binding->connection, s_transform_websocket, binding, NULL, NULL);
        } else {
            aws_mqtt_client_connection_use_websockets(binding->connection, NULL, NULL, NULL, NULL);
        }
    }

    /* set reconnect min/max times. beware that user that might have passed only one of these values */
    napi_value node_reconnect_min_sec = *arg++;
    napi_value node_reconnect_max_sec = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_reconnect_min_sec) &&
        !aws_napi_is_null_or_undefined(env, node_reconnect_max_sec)) {

        int64_t reconnect_min_sec = -1;
        int64_t reconnect_max_sec = -1;

        if (!aws_napi_is_null_or_undefined(env, node_reconnect_min_sec)) {
            AWS_NAPI_CALL(env, napi_get_value_int64(env, node_reconnect_min_sec, &reconnect_min_sec), {
                napi_throw_type_error(env, NULL, "reconnect_min_sec must be a Number");
                goto cleanup;
            });

            if (reconnect_min_sec < 0) {
                napi_throw_range_error(env, NULL, "reconnect_min_sec cannot be negative");
                goto cleanup;
            }
        }

        if (!aws_napi_is_null_or_undefined(env, node_reconnect_max_sec)) {
            AWS_NAPI_CALL(env, napi_get_value_int64(env, node_reconnect_max_sec, &reconnect_max_sec), {
                napi_throw_type_error(env, NULL, "reconnect_max_sec must be a Number");
                goto cleanup;
            });

            if (reconnect_max_sec < 0) {
                napi_throw_range_error(env, NULL, "reconnect_max_sec cannot be negative");
                goto cleanup;
            }
        }

        if (aws_mqtt_client_connection_set_reconnect_timeout(
                binding->connection, (uint64_t)reconnect_min_sec, (uint64_t)reconnect_max_sec)) {
            napi_throw_error(env, NULL, "failed to set reconnect min/max timeout");
            goto cleanup;
        }
    } else {
        napi_throw_error(env, NULL, "reconnect min/max timeout is missing.");
        goto cleanup;
    }

    /* napi_create_reference() must be the last thing called by this function.
     * Once this succeeds, the external will not be cleaned up automatically */
    AWS_NAPI_CALL(env, napi_create_reference(env, node_external, 1, &binding->node_external), {
        napi_throw_error(env, NULL, "Failed to reference node external");
        goto cleanup;
    });

    result = node_external;

cleanup:
    aws_byte_buf_clean_up(&will_topic);
    aws_byte_buf_clean_up(&will_payload);
    aws_byte_buf_clean_up(&username);
    aws_byte_buf_clean_up(&password);
    return result;
}

/*******************************************************************************
 * Connect
 ******************************************************************************/
struct connect_args {
    struct aws_allocator *allocator;
    struct mqtt_connection_binding *binding;
    enum aws_mqtt_connect_return_code return_code;
    int error_code;
    bool session_present;
    napi_threadsafe_function on_connect;
};

static void s_destroy_connect_args(struct connect_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    if (args->on_connect != 0) {
        AWS_FATAL_ASSERT(args->binding != NULL);
        AWS_NAPI_ENSURE(args->binding->env, aws_napi_release_threadsafe_function(args->on_connect, napi_tsfn_abort));
    }

    aws_mem_release(args->allocator, args);
}

static void s_on_connect_call(napi_env env, napi_value on_connect, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct connect_args *args = user_data;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[0]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->return_code, &params[1]));
        AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->session_present, &params[2]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_connect, NULL, on_connect, num_params, params));
    }

    /*
     * This is terrible and we need to make backwards incompatible changes to the API to correct it, but for now
     * clean up the connection function bindings if the initial connect failed because that's the contract
     * that we fulfilled in the past.  If we don't clean these up here then current programs written against
     * the current contract will leak their resumed/interrupted/websocket callbacks.
     */
    if (args->return_code || args->error_code) {
        /* Failed to create a connection, none of the callbacks will be invoked again */
        s_mqtt_client_connection_release_threadsafe_function(binding);
        if (binding->first_successfull_connection == true) {
            /* separating the cleanup to on_connection_failure, to make it
             * possible for the callback to be sent later and not free the
             * callback prematurely. It will be freed when we send the callback
             * itself later on. if it is not the first successfull connection,
             * then re-connect will handle this scenario */
            s_mqtt_client_connection_release_threadsafe_function_on_failure(binding);
        }
    }

    s_destroy_connect_args(args);
}

static void s_on_connected(
    struct aws_mqtt_client_connection *connection,
    int error_code,
    enum aws_mqtt_connect_return_code return_code,
    bool session_present,
    void *user_data) {
    (void)connection;

    struct connect_args *args = user_data;

    if (!args->on_connect) {
        s_destroy_connect_args(args);
        return;
    }

    args->error_code = error_code;
    args->return_code = return_code;
    args->session_present = session_present;
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_connect, args));
}

struct transform_websocket_args {
    struct mqtt_connection_binding *binding;

    struct aws_http_message *request;

    aws_mqtt_transform_websocket_handshake_complete_fn *complete_fn;
    void *complete_ctx;
};

static napi_value s_napi_transform_websocket_complete(napi_env env, napi_callback_info cb_info) {

    struct transform_websocket_args *args = NULL;
    int error_code = AWS_ERROR_SUCCESS;

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, (void **)&args), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        goto cleanup;
    });
    if (num_args > 1) {
        napi_throw_error(env, NULL, "transform_websocket_complete needs exactly 0 or 1 arguments");
        goto cleanup;
    }

    napi_value node_error_code = *arg++;
    /* If the user didn't provide an error_code, the napi_value will be undefined, so we can ignore it */
    if (!aws_napi_is_null_or_undefined(env, node_error_code)) {
        AWS_NAPI_CALL(env, napi_get_value_int32(env, node_error_code, &error_code), {
            napi_throw_type_error(env, NULL, "error_code must be a number or undefined");
            goto cleanup;
        });
    }

    args->complete_fn(args->request, error_code, args->complete_ctx);

cleanup:

    if (args != NULL) {
        aws_mem_release(args->binding->allocator, args);
    }

    return NULL;
}

static void s_transform_websocket_call(napi_env env, napi_value transform_websocket, void *context, void *user_data) {
    // struct mqtt_connection_binding *binding = context;
    (void)context;
    struct transform_websocket_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, aws_napi_http_message_wrap(env, args->request, &params[0]));
        AWS_NAPI_ENSURE(
            env,
            napi_create_function(
                env,
                "transform_websocket_complete",
                NAPI_AUTO_LENGTH,
                &s_napi_transform_websocket_complete,
                args,
                &params[1]));

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, args->binding->transform_websocket, NULL, transform_websocket, num_params, params));
    } else {
        args->complete_fn(args->request, AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV, args->complete_ctx);

        aws_mem_release(args->binding->allocator, args);
    }
}

void s_transform_websocket(
    struct aws_http_message *request,
    void *user_data,
    aws_mqtt_transform_websocket_handshake_complete_fn *complete_fn,
    void *complete_ctx) {

    struct mqtt_connection_binding *binding = user_data;

    struct transform_websocket_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct transform_websocket_args));
    AWS_FATAL_ASSERT(args);

    args->binding = binding;
    args->request = request;
    args->complete_fn = complete_fn;
    args->complete_ctx = complete_ctx;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->transform_websocket, args));
}

napi_value aws_napi_mqtt_client_connection_connect(napi_env env, napi_callback_info cb_info) {

    bool success = false;

    struct aws_socket_options *socket_options = NULL;
    struct mqtt_connection_binding *binding = NULL;

    struct aws_byte_buf client_id;
    AWS_ZERO_STRUCT(client_id);
    struct aws_byte_buf server_name;
    AWS_ZERO_STRUCT(server_name);
    struct connect_args *on_connect_args = NULL;

    napi_value node_args[10];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        goto cleanup;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_connect received wrong number of arguments");
        goto cleanup;
    }

    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract connection from first argument");
        goto cleanup;
    });

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        goto cleanup;
    }

    struct aws_allocator *allocator = binding->allocator;

    napi_value node_client_id = *arg++;
    AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&client_id, env, node_client_id), {
        napi_throw_type_error(env, NULL, "client_id must be a String");
        goto cleanup;
    });

    napi_value node_server_name = *arg++;
    AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&server_name, env, node_server_name), {
        napi_throw_type_error(env, NULL, "server_name must be a String");
        goto cleanup;
    });

    napi_value node_port = *arg++;
    uint32_t port_number = 0;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_port, &port_number), {
        napi_throw_type_error(env, NULL, "port must be a Number");
        goto cleanup;
    });

    napi_value node_socket_options = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_socket_options)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_socket_options, (void **)&socket_options), {
            napi_throw_type_error(env, NULL, "connect_timeout must be a Number");
            goto cleanup;
        });
    }

    napi_value node_keep_alive_time = *arg++;
    uint32_t keep_alive_time = 0;
    if (!aws_napi_is_null_or_undefined(env, node_keep_alive_time)) {
        AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_keep_alive_time, &keep_alive_time), {
            napi_throw_type_error(env, NULL, "keep_alive must be a Number");
            goto cleanup;
        });
    }

    napi_value node_ping_timeout = *arg++;
    uint32_t ping_timeout = 0;
    if (!aws_napi_is_null_or_undefined(env, node_ping_timeout)) {
        AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_ping_timeout, &ping_timeout), {
            napi_throw_type_error(env, NULL, "ping_timeout must be a Number");
            goto cleanup;
        });
    }

    napi_value node_protocol_operation_timeout = *arg++;
    uint32_t protocol_operation_timeout = 0;
    if (!aws_napi_is_null_or_undefined(env, node_protocol_operation_timeout)) {
        AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_protocol_operation_timeout, &protocol_operation_timeout), {
            napi_throw_type_error(env, NULL, "protocol_operation_timeout must be a Number");
            goto cleanup;
        });
    }

    napi_value node_clean_session = *arg++;
    bool clean_session = false;
    if (!aws_napi_is_null_or_undefined(env, node_clean_session)) {
        AWS_NAPI_CALL(env, napi_get_value_bool(env, node_clean_session, &clean_session), {
            napi_throw_type_error(env, NULL, "clean_session must be a boolean");
            goto cleanup;
        });
    }

    napi_value node_on_connect = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_connect)) {

        on_connect_args = aws_mem_calloc(allocator, 1, sizeof(struct connect_args));
        AWS_FATAL_ASSERT(on_connect_args);
        on_connect_args->allocator = allocator;
        on_connect_args->binding = binding;

        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_connect,
                "aws_mqtt_client_connection_on_connect",
                s_on_connect_call,
                binding,
                &on_connect_args->on_connect),
            {
                napi_throw_error(env, NULL, "Failed to bind on_connect callback");
                goto cleanup;
            });
    }

    struct aws_byte_cursor client_id_cur = aws_byte_cursor_from_buf(&client_id);
    struct aws_byte_cursor server_name_cur = aws_byte_cursor_from_buf(&server_name);

    struct aws_mqtt_connection_options options;
    options.clean_session = clean_session;
    options.client_id = client_id_cur;
    options.host_name = server_name_cur;
    options.keep_alive_time_secs = (uint16_t)keep_alive_time;
    options.on_connection_complete = s_on_connected;
    options.ping_timeout_ms = ping_timeout;
    options.protocol_operation_timeout_ms = protocol_operation_timeout;
    options.port = port_number;

    options.socket_options = socket_options;
    options.tls_options = binding->use_tls_options ? &binding->tls_options : NULL;
    options.user_data = on_connect_args; /* on_connect user_data */

    if (aws_mqtt_client_connection_connect(binding->connection, &options)) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }

    success = true;

cleanup:

    aws_byte_buf_clean_up(&client_id);
    aws_byte_buf_clean_up(&server_name);

    if (!success && on_connect_args) {
        s_destroy_connect_args(on_connect_args);
    }

    return NULL;
}

/*******************************************************************************
 * Reconnect Deprecated
 ******************************************************************************/

napi_value aws_napi_mqtt_client_connection_reconnect(napi_env env, napi_callback_info cb_info) {

    struct mqtt_connection_binding *binding = NULL;

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_reconnect needs exactly 2 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        return NULL;
    });

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        return NULL;
    }

    struct connect_args *args = aws_mem_calloc(binding->allocator, 1, sizeof(struct connect_args));
    AWS_FATAL_ASSERT(args);
    args->allocator = binding->allocator;
    args->binding = binding;

    napi_value node_on_connect = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_connect)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_connect,
                "aws_mqtt_client_connection_on_reconnect",
                s_on_connect_call,
                binding,
                &args->on_connect),
            { goto on_error; });
    }

    if (aws_mqtt_client_connection_reconnect(binding->connection, s_on_connected, binding)) {
        aws_napi_throw_last_error(env);
        goto on_error;
    }

    return NULL;

on_error:

    s_destroy_connect_args(args);

    return NULL;
}

/*******************************************************************************
 * Publish
 ******************************************************************************/
struct puback_args {
    struct aws_allocator *allocator;
    struct mqtt_connection_binding *binding;
    uint16_t packet_id;
    int error_code;
    napi_threadsafe_function on_puback;
};

static void s_destroy_puback_args(struct puback_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    if (args->on_puback != 0) {
        AWS_FATAL_ASSERT(args->binding != NULL);
        AWS_NAPI_ENSURE(args->binding->env, aws_napi_release_threadsafe_function(args->on_puback, napi_tsfn_abort));
    }

    aws_mem_release(args->allocator, args);
}

static void s_on_publish_complete_call(napi_env env, napi_value on_puback, void *context, void *user_data) {
    (void)context;
    struct puback_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_create_uint32(env, args->packet_id, &params[0]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[1]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_puback, NULL, on_puback, num_params, params));
    }

    s_destroy_puback_args(args);
}

static void s_on_publish_complete(
    struct aws_mqtt_client_connection *connection,
    uint16_t packet_id,
    int error_code,
    void *user_data) {

    (void)connection;

    struct puback_args *args = user_data;

    args->packet_id = packet_id;
    args->error_code = error_code;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_puback, args));
}

napi_value aws_napi_mqtt_client_connection_publish(napi_env env, napi_callback_info info) {

    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct puback_args *args = aws_mem_calloc(allocator, 1, sizeof(struct puback_args));
    AWS_FATAL_ASSERT(args);
    args->allocator = allocator;

    struct aws_byte_buf topic_buf;
    struct aws_byte_buf payload_buf;
    AWS_ZERO_STRUCT(topic_buf);
    AWS_ZERO_STRUCT(payload_buf);

    napi_value node_args[6];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        goto cleanup;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_publish needs exactly 6 arguments");
        goto cleanup;
    }

    napi_value node_binding = *arg++;
    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        goto cleanup;
    });

    args->binding = binding;

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        goto cleanup;
    }

    napi_value node_topic = *arg++;
    AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&topic_buf, env, node_topic), {
        napi_throw_type_error(env, NULL, "topic must be a String");
        goto cleanup;
    });

    napi_value node_payload = *arg++;
    AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&payload_buf, env, node_payload), {
        napi_throw_type_error(env, NULL, "payload is invalid type");
        goto cleanup;
    });

    napi_value node_qos = *arg++;
    uint32_t qos_uint = 0;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_qos, &qos_uint), {
        napi_throw_type_error(env, NULL, "qos must be a number");
        goto cleanup;
    });
    enum aws_mqtt_qos qos = (enum aws_mqtt_qos)qos_uint;

    napi_value node_retain = *arg++;
    bool retain = false;
    AWS_NAPI_CALL(env, napi_get_value_bool(env, node_retain, &retain), {
        napi_throw_type_error(env, NULL, "retain must be a bool");
        goto cleanup;
    });

    napi_value node_on_puback = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_puback)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_puback,
                "aws_mqtt_client_connection_on_puback",
                s_on_publish_complete_call,
                binding,
                &args->on_puback),
            { goto cleanup; });
    }

    const struct aws_byte_cursor topic_cur = aws_byte_cursor_from_buf(&topic_buf);
    const struct aws_byte_cursor payload_cur = aws_byte_cursor_from_buf(&payload_buf);
    uint16_t pub_id = aws_mqtt_client_connection_publish(
        binding->connection, &topic_cur, qos, retain, &payload_cur, s_on_publish_complete, args);
    if (!pub_id) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }

    aws_byte_buf_clean_up(&payload_buf);
    aws_byte_buf_clean_up(&topic_buf);
    return NULL;

cleanup:

    aws_byte_buf_clean_up(&payload_buf);
    aws_byte_buf_clean_up(&topic_buf);

    s_destroy_puback_args(args);

    return NULL;
}

/*******************************************************************************
 * Subscribe
 ******************************************************************************/
struct suback_args {
    struct aws_allocator *allocator;
    struct mqtt_connection_binding *binding;
    uint16_t packet_id;
    enum aws_mqtt_qos qos;
    int error_code;
    struct aws_byte_buf topic; /* not confident that we can guarantee a cursor ref will always be valid */
    napi_threadsafe_function on_suback;
};

static void s_destroy_suback_args(struct suback_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    aws_byte_buf_clean_up(&args->topic);

    if (args->on_suback != 0) {
        AWS_FATAL_ASSERT(args->binding != NULL);
        AWS_NAPI_ENSURE(args->binding->env, aws_napi_release_threadsafe_function(args->on_suback, napi_tsfn_abort));
    }

    aws_mem_release(args->allocator, args);
}

static void s_on_suback_call(napi_env env, napi_value on_suback, void *context, void *user_data) {
    (void)context;
    struct suback_args *args = user_data;

    if (env) {
        napi_value params[4];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->packet_id, &params[0]));
        AWS_NAPI_ENSURE(
            env, napi_create_string_utf8(env, (const char *)args->topic.buffer, args->topic.len, &params[1]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->qos, &params[2]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[3]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_suback, NULL, on_suback, num_params, params));
    }

    s_destroy_suback_args(args);
}

static void s_on_suback(
    struct aws_mqtt_client_connection *connection,
    uint16_t packet_id,
    const struct aws_byte_cursor *topic,
    enum aws_mqtt_qos qos,
    int error_code,
    void *user_data) {
    (void)connection;
    (void)topic;

    struct suback_args *args = user_data;
    if (args == NULL) {
        return;
    }

    if (!args->on_suback) {
        s_destroy_suback_args(args);
        return;
    }

    args->error_code = error_code;
    args->qos = qos;
    args->packet_id = packet_id;

    AWS_NAPI_ENSURE(args->binding->env, aws_napi_queue_threadsafe_function(args->on_suback, args));
}

/* user data which describes a subscription, passed to aws_mqtt_connection_subscribe */
struct subscription {
    struct aws_allocator *allocator;
    struct aws_byte_buf topic; /* stored here as long as the sub is active, referenced by callbacks */
    napi_threadsafe_function on_publish;
};

static void s_destroy_subscription(struct subscription *sub) {
    if (sub == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(sub->allocator != NULL);

    if (sub->on_publish != 0) {
        AWS_NAPI_ENSURE(NULL, aws_napi_release_threadsafe_function(sub->on_publish, napi_tsfn_release));
    }

    aws_byte_buf_clean_up(&sub->topic);
    aws_mem_release(sub->allocator, sub);
}

static void s_on_publish_user_data_clean_up(void *user_data) {
    s_destroy_subscription(user_data);
}

/* arguments for publish callbacks */
struct on_publish_args {
    struct aws_allocator *allocator;
    struct aws_byte_buf topic;    /* owned by this */
    struct aws_byte_buf *payload; /* owned by this until the external array buffer in the direct callback is created */
    bool dup;
    enum aws_mqtt_qos qos;
    bool retain;
    /* created by subscription, but we add/dec ref on our copy of the pointer too */
    napi_threadsafe_function on_publish;
};

static void s_destroy_on_publish_args(struct on_publish_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    if (args->on_publish != NULL) {
        AWS_NAPI_ENSURE(NULL, aws_napi_release_threadsafe_function(args->on_publish, napi_tsfn_release));
    }

    if (args->payload != NULL) {
        aws_byte_buf_clean_up(args->payload);
        aws_mem_release(args->allocator, args->payload);
    }

    aws_byte_buf_clean_up(&args->topic);

    aws_mem_release(args->allocator, args);
}

static void s_publish_external_arraybuffer_finalizer(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_data;
    struct aws_byte_buf *buf = finalize_hint;

    struct aws_allocator *allocator = buf->allocator;
    AWS_FATAL_ASSERT(allocator != NULL);

    aws_byte_buf_clean_up(buf);
    aws_mem_release(allocator, buf);
}

static void s_on_publish_call(napi_env env, napi_value on_publish, void *context, void *user_data) {
    (void)context;
    struct on_publish_args *args = user_data;

    if (env) {
        napi_value params[5];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(
            env, napi_create_string_utf8(env, (const char *)args->topic.buffer, args->topic.len, &params[0]));

        AWS_NAPI_ENSURE(
            env,
            aws_napi_create_external_arraybuffer(
                env,
                args->payload->buffer,
                args->payload->len,
                s_publish_external_arraybuffer_finalizer,
                args->payload,
                &params[1]));

        AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->dup, &params[2]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->qos, &params[3]));
        AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->retain, &params[4]));

        /*
         * We've successfully created the external array buffer whose finalizer will clean this byte_buf up.
         * It's now safe and correct to set this to NULL in the args so that the args destructor does not clean it up.
         */
        args->payload = NULL;

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_publish, NULL, on_publish, num_params, params));
    }

    s_destroy_on_publish_args(args);
}

/* called in response to a message being published to an active subscription */
static void s_on_publish(
    struct aws_mqtt_client_connection *connection,
    const struct aws_byte_cursor *topic,
    const struct aws_byte_cursor *payload,
    bool dup,
    enum aws_mqtt_qos qos,
    bool retain,
    void *user_data) {

    (void)connection;

    struct subscription *sub = user_data;
    /* users can use a null handler to sub to a topic, and then handle it with the any handler */
    if (!sub->on_publish) {
        return;
    }

    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_ENSURE(NULL, napi_get_threadsafe_function_context(sub->on_publish, (void **)&binding));

    struct aws_allocator *allocator = binding->allocator;
    struct on_publish_args *args = aws_mem_calloc(allocator, 1, sizeof(struct on_publish_args));
    AWS_FATAL_ASSERT(args);

    args->allocator = allocator;
    args->dup = dup;
    args->qos = qos;
    args->retain = retain;
    args->on_publish = sub->on_publish;

    /*
     * We share this threadsafe function with the subscription structure.  Each applies a inc/dec ref because
     * it isn't clear that we can guarantee the order of destruction because we don't really have any
     * guarantees about V8's internal scheduling/ordering invariants for queued functions.
     */
    if (args->on_publish != 0) {
        AWS_NAPI_ENSURE(NULL, aws_napi_acquire_threadsafe_function(args->on_publish));
    }

    if (aws_byte_buf_init_copy_from_cursor(&args->topic, allocator, *topic)) {
        AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "Failed to copy MQTT topic, message will not be delivered");
        goto on_error;
    }

    /*
     * Create the payload as a pointer-to-buf so cleanup responsibilities can be transferred to the payload's
     * finalizer.
     */
    args->payload = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));
    if (args->payload == NULL) {
        goto on_error;
    }

    /* this is freed after being delivered to node in s_on_publish_call */
    if (aws_byte_buf_init_copy_from_cursor(args->payload, allocator, *payload)) {
        AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "Failed to copy MQTT payload buffer, message will not be delivered");
        goto on_error;
    }

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_publish, args));

    return;

on_error:

    s_destroy_on_publish_args(args);
}

napi_value aws_napi_mqtt_client_connection_subscribe(napi_env env, napi_callback_info cb_info) {

    napi_value node_args[5];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_subscribe needs exactly 5 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        return NULL;
    });

    struct aws_allocator *allocator = binding->allocator;
    struct suback_args *suback = NULL;
    struct subscription *sub = aws_mem_calloc(allocator, 1, sizeof(struct subscription));
    AWS_FATAL_ASSERT(sub);
    sub->allocator = allocator;

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        goto cleanup;
    }

    napi_value node_topic = *arg++;
    AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&sub->topic, env, node_topic), {
        napi_throw_type_error(env, NULL, "topic must be a String");
        goto cleanup;
    });

    napi_value node_qos = *arg++;
    uint32_t qos_uint = 0;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_qos, &qos_uint), {
        napi_throw_type_error(env, NULL, "qos must be a number");
        goto cleanup;
    });
    enum aws_mqtt_qos qos = (enum aws_mqtt_qos)qos_uint;

    napi_value node_on_publish = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_publish)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_publish,
                "aws_mqtt_client_connection_on_publish",
                s_on_publish_call,
                binding,
                &sub->on_publish),
            { goto cleanup; });
    }

    napi_value node_on_suback = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_suback)) {
        suback = aws_mem_calloc(allocator, 1, sizeof(struct suback_args));
        AWS_FATAL_ASSERT(suback);
        suback->allocator = allocator;
        suback->binding = binding;
        aws_byte_buf_init_copy_from_cursor(&suback->topic, allocator, aws_byte_cursor_from_buf(&sub->topic));
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_suback,
                "aws_mqtt_client_connection_on_suback",
                s_on_suback_call,
                binding,
                &suback->on_suback),
            { goto cleanup; });
    }

    struct aws_byte_cursor topic_cur = aws_byte_cursor_from_buf(&sub->topic);
    uint16_t sub_id = aws_mqtt_client_connection_subscribe(
        binding->connection, &topic_cur, qos, s_on_publish, sub, s_on_publish_user_data_clean_up, s_on_suback, suback);

    if (!sub_id) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }

    return NULL;

cleanup:

    s_destroy_subscription(sub);
    s_destroy_suback_args(suback);

    return NULL;
}

/*
 * on-any publish
 */
struct on_any_publish_args {
    struct aws_allocator *allocator;
    struct aws_string *topic;
    struct aws_byte_buf *payload;
    bool dup;
    enum aws_mqtt_qos qos;
    bool retain;
};

static void s_destroy_on_any_publish_args(struct on_any_publish_args *args) {
    if (args == NULL) {
        return;
    }

    aws_string_destroy(args->topic);

    /*
     * Between payload construction and transfer to the external array the only failure options are fatal, but
     * as a pattern I believe it to be better (future-proofing, consistency) to properly handle the possibility
     * of the payload getting created but not transferred to the external array's finalizer
     */
    if (args->payload) {
        aws_byte_buf_clean_up(args->payload);
        aws_mem_release(args->allocator, args->payload);
    }

    aws_mem_release(args->allocator, args);
}

static void s_any_publish_external_arraybuffer_finalizer(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_data;

    struct aws_byte_buf *payload = finalize_hint;
    struct aws_allocator *allocator = payload->allocator;
    AWS_FATAL_ASSERT(allocator != NULL);

    aws_byte_buf_clean_up(payload);
    aws_mem_release(allocator, payload);
}

static void s_on_any_publish_call(napi_env env, napi_value on_publish, void *context, void *user_data) {
    struct mqtt_connection_binding *binding = context;
    struct on_any_publish_args *args = user_data;

    if (env) {
        if (binding->on_any_publish) {
            napi_value params[5];
            const size_t num_params = AWS_ARRAY_SIZE(params);

            AWS_NAPI_ENSURE(
                env, napi_create_string_utf8(env, aws_string_c_str(args->topic), args->topic->len, &params[0]));

            AWS_NAPI_ENSURE(
                env,
                aws_napi_create_external_arraybuffer(
                    env,
                    args->payload->buffer,
                    args->payload->len,
                    s_any_publish_external_arraybuffer_finalizer,
                    args->payload,
                    &params[1]));

            AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->dup, &params[2]));
            AWS_NAPI_ENSURE(env, napi_create_int32(env, args->qos, &params[3]));
            AWS_NAPI_ENSURE(env, napi_get_boolean(env, args->retain, &params[4]));

            /*
             * We've successfully created the external array buffer whose finalizer will clean this byte_buf up.
             * It's now safe and correct to set this to NULL in the args so that the args destructor does not clean it
             * up.
             */
            args->payload = NULL;

            AWS_NAPI_ENSURE(
                env,
                aws_napi_dispatch_threadsafe_function(
                    env, binding->on_any_publish, NULL, on_publish, num_params, params));
        } else {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "Any publish callback invoked for connection binding %p but callback is null",
                (void *)binding);
        }
    }

    s_destroy_on_any_publish_args(args);
}

static void s_on_any_publish(
    struct aws_mqtt_client_connection *connection,
    const struct aws_byte_cursor *topic,
    const struct aws_byte_cursor *payload,
    bool dup,
    enum aws_mqtt_qos qos,
    bool retain,
    void *user_data) {

    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    if (binding->on_any_publish == NULL) {
        return;
    }

    struct aws_allocator *allocator = binding->allocator;
    struct on_any_publish_args *args = aws_mem_calloc(allocator, 1, sizeof(struct on_publish_args));
    AWS_FATAL_ASSERT(args);

    args->allocator = allocator;
    args->topic = aws_string_new_from_array(allocator, topic->ptr, topic->len);
    args->dup = dup;
    args->qos = qos;
    args->retain = retain;
    args->payload = aws_mem_calloc(allocator, 1, sizeof(struct aws_byte_buf));

    /* this is freed after being delivered to node in s_on_any_publish_call */
    if (aws_byte_buf_init_copy_from_cursor(args->payload, allocator, *payload)) {
        AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "Failed to copy MQTT payload buffer, payload will not be delivered");
        goto on_error;
    }

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_any_publish, args));

    return;

on_error:

    s_destroy_on_any_publish_args(args);
}

napi_value aws_napi_mqtt_client_connection_on_message(napi_env env, napi_callback_info cb_info) {
    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_on_message needs exactly 2 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Unable to extract external");
        return NULL;
    });

    napi_value node_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_handler)) {
        napi_throw_error(env, NULL, "handler must not be null or undefined");
        return NULL;
    }

    /*
     * There's no reasonable way of making this safe for multiple calls.  We have to assume this is pre-connect
     * otherwise the callback could be getting used in another thread as we try and change it here.
     */
    if (binding->on_any_publish != NULL) {
        napi_throw_error(env, NULL, "on_any_publish handler cannot be set more than once");
        return NULL;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env, node_handler, "on_any_publish", s_on_any_publish_call, binding, &binding->on_any_publish),
        { return NULL; });

    if (aws_mqtt_client_connection_set_on_any_publish_handler(binding->connection, s_on_any_publish, binding)) {
        napi_throw_error(env, NULL, "Unable to set on_any_publish handler");
        return NULL;
    }

    return NULL;
}

/*******************************************************************************
 * Unsubscribe
 ******************************************************************************/

struct unsuback_args {
    struct aws_allocator *allocator;
    struct mqtt_connection_binding *binding;
    struct aws_byte_buf topic; /* stored here until unsub completes */
    uint16_t packet_id;
    int error_code;
    napi_threadsafe_function on_unsuback;
};

static void s_destroy_unsuback_args(struct unsuback_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    aws_byte_buf_clean_up(&args->topic);

    if (args->on_unsuback != 0) {
        AWS_FATAL_ASSERT(args->binding != NULL);
        AWS_NAPI_ENSURE(args->binding->env, aws_napi_release_threadsafe_function(args->on_unsuback, napi_tsfn_abort));
    }

    aws_mem_release(args->allocator, args);
}

static void s_on_unsub_ack_call(napi_env env, napi_value on_unsuback, void *context, void *user_data) {
    (void)context;

    struct unsuback_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_create_uint32(env, args->packet_id, &params[0]));
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[1]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_unsuback, NULL, on_unsuback, num_params, params));
    }

    s_destroy_unsuback_args(args);
}

static void s_on_unsubscribe_complete(
    struct aws_mqtt_client_connection *connection,
    uint16_t packet_id,
    int error_code,
    void *user_data) {
    (void)connection;

    struct unsuback_args *args = user_data;

    if (!args->on_unsuback) {
        s_destroy_unsuback_args(args);
        return;
    }

    args->packet_id = packet_id;
    args->error_code = error_code;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_unsuback, args));
}

napi_value aws_napi_mqtt_client_connection_unsubscribe(napi_env env, napi_callback_info cb_info) {

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_unsubscribe needs exactly 3 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        return NULL;
    });

    struct aws_allocator *allocator = binding->allocator;
    struct unsuback_args *args = aws_mem_calloc(allocator, 1, sizeof(struct unsuback_args));
    AWS_FATAL_ASSERT(args);
    args->allocator = allocator;
    args->binding = binding;

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        goto cleanup;
    }

    napi_value node_topic = *arg++;
    if (aws_byte_buf_init_from_napi(&args->topic, env, node_topic)) {
        napi_throw_type_error(env, NULL, "topic must be a String");
        goto cleanup;
    }

    napi_value node_on_unsuback = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_unsuback)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_unsuback,
                "aws_mqtt_client_connection_on_unsuback",
                s_on_unsub_ack_call,
                binding,
                &args->on_unsuback),
            { goto cleanup; });
    }

    const struct aws_byte_cursor topic_cur = aws_byte_cursor_from_buf(&args->topic);
    uint16_t unsub_id =
        aws_mqtt_client_connection_unsubscribe(binding->connection, &topic_cur, s_on_unsubscribe_complete, args);

    if (!unsub_id) {
        napi_throw_error(env, NULL, "Failed to initiate subscribe request");
        goto cleanup;
    }

    args->packet_id = unsub_id;

    return NULL;

cleanup:

    s_destroy_unsuback_args(args);

    return NULL;
}

/*******************************************************************************
 * Disconnect
 ******************************************************************************/
struct disconnect_args {
    struct aws_allocator *allocator;
    struct mqtt_connection_binding *binding;
    napi_threadsafe_function on_disconnect;
};

static void s_destroy_disconnect_args(struct disconnect_args *args) {
    if (args == NULL) {
        return;
    }

    AWS_FATAL_ASSERT(args->allocator != NULL);

    if (args->on_disconnect != 0) {
        AWS_FATAL_ASSERT(args->binding != NULL);
        AWS_NAPI_ENSURE(args->binding->env, aws_napi_release_threadsafe_function(args->on_disconnect, napi_tsfn_abort));
    }

    aws_mem_release(args->allocator, args);
}

static void s_on_disconnect_call(napi_env env, napi_value on_disconnect, void *context, void *user_data) {
    (void)context;
    struct disconnect_args *args = user_data;

    if (env) {
        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_disconnect, NULL, on_disconnect, 0, NULL));
    }

    s_destroy_disconnect_args(args);
}

static void s_on_disconnected(struct aws_mqtt_client_connection *connection, void *user_data) {
    (void)connection;

    struct disconnect_args *args = user_data;
    if (!args->on_disconnect) {
        s_destroy_disconnect_args(args);
        return;
    }

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_disconnect, args));
}

napi_value aws_napi_mqtt_client_connection_disconnect(napi_env env, napi_callback_info cb_info) {

    struct mqtt_connection_binding *binding = NULL;

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_connection_disconnect needs exactly 2 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        return NULL;
    });

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        return NULL;
    }

    struct aws_allocator *allocator = binding->allocator;
    struct disconnect_args *args = aws_mem_calloc(allocator, 1, sizeof(struct disconnect_args));
    AWS_FATAL_ASSERT(args);
    args->allocator = allocator;
    args->binding = binding;

    napi_value node_on_disconnect = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_disconnect)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_disconnect,
                "aws_mqtt_client_connection_on_disconnect",
                s_on_disconnect_call,
                binding,
                &args->on_disconnect),
            { goto on_error; });
    }

    if (aws_mqtt_client_connection_disconnect(binding->connection, s_on_disconnected, args)) {
        aws_napi_throw_last_error(env);
        goto on_error;
    }

    return NULL;

on_error:

    s_destroy_disconnect_args(args);

    return NULL;
}

/*******************************************************************************
 * Operation Statistics
 ******************************************************************************/

static int s_create_napi_mqtt_connection_statistics(
    napi_env env,
    const struct aws_mqtt_connection_operation_statistics *stats,
    napi_value *stats_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_stats = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_stats), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_INCOMPLETE_OPERATION_COUNT, stats->incomplete_operation_count)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_INCOMPLETE_OPERATION_SIZE, stats->incomplete_operation_size)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_UNACKED_OPERATION_COUNT, stats->unacked_operation_count)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_UNACKED_OPERATION_SIZE, stats->unacked_operation_size)) {
        return AWS_OP_ERR;
    };

    *stats_out = napi_stats;

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_mqtt_client_connection_get_queue_statistics(napi_env env, napi_callback_info info) {

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt_client_connection_get_queue_statistics - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt_client_connection_get_queue_statistics - needs exactly 1 argument");
        return NULL;
    }

    struct mqtt_connection_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract binding from external");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt_client_connection_get_queue_statistics - binding was null");
        return NULL;
    }

    if (binding->connection == NULL) {
        napi_throw_error(env, NULL, "Connection has been closed and can no longer be used");
        return NULL;
    }

    struct aws_mqtt_connection_operation_statistics stats;
    AWS_ZERO_STRUCT(stats);
    aws_mqtt_client_connection_get_stats(binding->connection, &stats);

    napi_value napi_stats = NULL;
    if (s_create_napi_mqtt_connection_statistics(env, &stats, &napi_stats)) {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt_client_connection_get_queue_statistics - failed to build statistics value");
        return NULL;
    }

    return napi_stats;
}

/*******************************************************************************
 * On Closed
 ******************************************************************************/

static void s_on_closed_call(napi_env env, napi_value on_closed, void *context, void *user_data) {
    (void)user_data;
    struct mqtt_connection_binding *binding = context;

    if (binding->on_closed == NULL) {
        return;
    }

    if (env) {
        AWS_NAPI_ENSURE(env, aws_napi_dispatch_threadsafe_function(env, binding->on_closed, NULL, on_closed, 0, NULL));
    }
}

static void s_on_closed(
    struct aws_mqtt_client_connection *connection,
    struct on_connection_closed_data *data,
    void *user_data) {

    (void)data;
    (void)connection;

    struct mqtt_connection_binding *binding = user_data;
    if (binding->on_closed == NULL) {
        return;
    }

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_closed, binding));
    return;
}

napi_value aws_napi_mqtt_client_connection_on_closed(napi_env env, napi_callback_info cb_info) {
    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt_client_on_closed needs exactly 2 arguments");
        return NULL;
    }

    napi_value node_binding = *arg++;
    struct mqtt_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(env, NULL, "Unable to extract external");
        return NULL;
    });

    napi_value node_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_handler)) {
        napi_throw_error(env, NULL, "handler must not be null or undefined");
        return NULL;
    }

    /*
     * There's no reasonable way of making this safe for multiple calls.  We have to assume this is pre-connect
     * otherwise the callback could be getting used in another thread as we try and change it here.
     */
    if (binding->on_closed != NULL) {
        napi_throw_error(env, NULL, "on_closed handler cannot be set more than once");
        return NULL;
    }

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env, node_handler, "on_closed", s_on_closed_call, binding, &binding->on_closed),
        { return NULL; });

    if (aws_mqtt_client_connection_set_connection_closed_handler(binding->connection, s_on_closed, binding)) {
        napi_throw_error(env, NULL, "Unable to set on_closed handler");
        return NULL;
    }

    return NULL;
}
