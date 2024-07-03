/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "http_connection_manager.h"
#include "http_connection.h"
#include "io.h"

#include <aws/http/connection_manager.h>
#include <aws/http/proxy.h>
#include <aws/io/socket.h>
#include <aws/io/tls_channel_handler.h>

struct http_connection_manager_binding {
    struct aws_http_connection_manager *manager;
    struct aws_allocator *allocator;
    napi_env env;
    napi_ref node_external;
    napi_threadsafe_function on_shutdown;
};

struct aws_http_connection_manager *aws_napi_get_http_connection_manager(
    struct http_connection_manager_binding *binding) {
    return binding->manager;
}

static void s_http_connection_manager_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)finalize_hint;
    (void)env;
    struct http_connection_manager_binding *binding = finalize_data;
    aws_mem_release(binding->allocator, binding);
}

static void s_http_connection_manager_shutdown_call(
    napi_env env,
    napi_value on_shutdown,
    void *context,
    void *user_data) {
    struct http_connection_manager_binding *binding = context;
    (void)user_data;
    if (env) {
        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, binding->on_shutdown, NULL, on_shutdown, 0, NULL));
    }
}

static void s_http_connection_manager_shutdown_complete(void *user_data) {
    struct http_connection_manager_binding *binding = user_data;
    if (binding->on_shutdown) {
        AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_shutdown, NULL));
    }
    AWS_NAPI_ENSURE(binding->env, aws_napi_release_threadsafe_function(binding->on_shutdown, napi_tsfn_abort));
}

napi_value aws_napi_http_connection_manager_new(napi_env env, napi_callback_info info) {

    napi_value result = NULL;

    napi_value node_args[9];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Unable to get callback info");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_manager_new takes exactly 8 arguments");
        return NULL;
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_http_connection_manager_options options;
    AWS_ZERO_STRUCT(options);
    struct aws_byte_buf host_buf;
    AWS_ZERO_STRUCT(host_buf);
    struct aws_tls_connection_options tls_connection_options;
    AWS_ZERO_STRUCT(tls_connection_options);

    napi_value node_bootstrap = *arg++;
    struct client_bootstrap_binding *client_bootstrap_binding = NULL;
    napi_get_value_external(env, node_bootstrap, (void **)&client_bootstrap_binding);
    if (client_bootstrap_binding != NULL) {
        options.bootstrap = aws_napi_get_client_bootstrap(client_bootstrap_binding);
    } else {
        options.bootstrap = aws_napi_get_default_client_bootstrap();
    }

    napi_value node_host = *arg++;
    if (aws_byte_buf_init_from_napi(&host_buf, env, node_host)) {
        napi_throw_type_error(env, NULL, "host must be a string");
        return NULL;
    }
    options.host = aws_byte_cursor_from_buf(&host_buf);

    struct http_connection_manager_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct http_connection_manager_binding));
    AWS_FATAL_ASSERT(binding);

    binding->allocator = allocator;
    binding->env = env;

    napi_value node_port = *arg++;
    uint32_t port = 0;
    if (napi_get_value_uint32(env, node_port, &port)) {
        napi_throw_type_error(env, NULL, "port must be a number between 0 and 4294967296");
        goto cleanup;
    }
    options.port = port;

    napi_value node_max_conns = *arg++;
    uint32_t max_connections = 0;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_max_conns, &max_connections), {
        napi_throw_type_error(env, NULL, "max_connections must be a number");
        goto cleanup;
    });
    options.max_connections = (size_t)max_connections;

    napi_value node_window_size = *arg++;
    uint32_t window_size = 16 * 1024;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_window_size, &window_size), {
        napi_throw_type_error(env, NULL, "initial_window_size must be a number");
        goto cleanup;
    });
    options.initial_window_size = (size_t)window_size;

    napi_value node_socket_options = *arg++;
    const struct aws_socket_options *socket_options = NULL;
    if (!aws_napi_is_null_or_undefined(env, node_socket_options)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_socket_options, (void **)&socket_options), {
            napi_throw_type_error(env, NULL, "socket_options must be undefined or a valid SocketOptions");
            goto cleanup;
        });
    }
    options.socket_options = socket_options;

    napi_value node_tls_opts = *arg++;
    struct aws_tls_connection_options *tls_opts = NULL;
    if (!aws_napi_is_null_or_undefined(env, node_tls_opts)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls_opts, (void **)&tls_opts), {
            napi_throw_type_error(env, NULL, "tls_opts must be undefined or a valid TlsConnectionOptions");
            goto cleanup;
        });
    }
    options.tls_connection_options = tls_opts;

    napi_value node_proxy_options = *arg++;
    struct aws_http_proxy_options *proxy_options = NULL;
    if (!aws_napi_is_null_or_undefined(env, node_proxy_options)) {
        struct http_proxy_options_binding *proxy_binding = NULL;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_proxy_options, (void **)&proxy_binding), {
            napi_throw_type_error(env, NULL, "tls_opts must be undefined or a valid TlsConnectionOptions");
            goto cleanup;
        });
        proxy_options = aws_napi_get_http_proxy_options(proxy_binding);
    }
    /* proxy_options are copied internally, no need to go nuts on copies */
    options.proxy_options = proxy_options;

    napi_value node_on_shutdown = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_shutdown)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_shutdown,
                "aws_http_connection_manager_on_shutdown",
                s_http_connection_manager_shutdown_call,
                binding,
                &binding->on_shutdown),
            {
                napi_throw_type_error(env, NULL, "on_shutdown must be a valid callback or undefined");
                goto cleanup;
            });
    }

    options.shutdown_complete_callback = s_http_connection_manager_shutdown_complete;
    options.shutdown_complete_user_data = binding;
    binding->manager = aws_http_connection_manager_new(allocator, &options);
    if (!binding->manager) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }

    napi_value node_external = NULL;
    AWS_NAPI_CALL(env, napi_create_external(env, binding, s_http_connection_manager_finalize, NULL, &node_external), {
        napi_throw_error(env, NULL, "Unable to create node external");
        goto external_failed;
    });
    AWS_NAPI_CALL(env, napi_create_reference(env, node_external, 1, &binding->node_external), {
        napi_throw_error(env, NULL, "Unable to create reference to node external");
        goto external_failed;
    });

    /* success, set the return value */
    result = node_external;
    goto done;

external_failed:
    aws_http_connection_manager_release(binding->manager);

cleanup:
done:
    aws_tls_connection_options_clean_up(&tls_connection_options);
    aws_byte_buf_clean_up(&host_buf);

    return result;
}

napi_value aws_napi_http_connection_manager_close(napi_env env, napi_callback_info info) {

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Unable to get callback info");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_manager_close takes exactly 1 argument");
        return NULL;
    }

    napi_value node_external = *arg++;
    struct http_connection_manager_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_external, (void **)&binding), {
        napi_throw_type_error(env, NULL, "connection_manager must be a valid HttpConnectionManager");
        return NULL;
    });

    aws_http_connection_manager_release(binding->manager);

    return NULL;
}

struct connection_acquired_args {
    struct http_connection_manager_binding *binding;
    napi_threadsafe_function on_acquired;
    struct aws_http_connection *connection;
    int error_code;
};

static void s_http_connection_manager_on_acquired_call(
    napi_env env,
    napi_value on_acquired,
    void *context,
    void *user_data) {
    struct http_connection_manager_binding *binding = context;
    struct connection_acquired_args *args = user_data;

    if (env) {
        napi_value connection_external = aws_napi_http_connection_from_manager(env, args->connection);
        AWS_FATAL_ASSERT(connection_external);

        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);
        params[0] = connection_external;
        AWS_NAPI_ENSURE(env, napi_create_int32(env, args->error_code, &params[1]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, args->on_acquired, NULL, on_acquired, num_params, params));

        AWS_NAPI_ENSURE(env, aws_napi_unref_threadsafe_function(env, args->on_acquired));
    }

    aws_mem_release(binding->allocator, args);
}

static void s_http_connection_manager_acquired(
    struct aws_http_connection *connection,
    int error_code,
    void *user_data) {
    struct connection_acquired_args *args = user_data;
    args->connection = connection;
    args->error_code = error_code;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(args->on_acquired, args));
}

napi_value aws_napi_http_connection_manager_acquire(napi_env env, napi_callback_info info) {
    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Unable to get callback info");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_manager_acquire takes exactly 2 arguments");
        return NULL;
    }

    napi_value node_external = *arg++;
    struct http_connection_manager_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_external, (void **)&binding), {
        napi_throw_type_error(env, NULL, "connection_manager should be an external");
        return NULL;
    });

    struct connection_acquired_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct connection_acquired_args));
    AWS_FATAL_ASSERT(args);
    args->binding = binding;

    napi_value node_on_acquired = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            node_on_acquired,
            "aws_http_connection_manager_on_acquired",
            s_http_connection_manager_on_acquired_call,
            binding,
            &args->on_acquired),
        {
            napi_throw_type_error(env, NULL, "on_acquired should be a valid callback");
            goto failed;
        });

    aws_http_connection_manager_acquire_connection(binding->manager, s_http_connection_manager_acquired, args);
    return NULL;

failed:
    aws_mem_release(binding->allocator, args);
    return NULL;
}

napi_value aws_napi_http_connection_manager_release(napi_env env, napi_callback_info info) {
    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Unable to get callback info");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_manager_release takes exactly 2 arguments");
        return NULL;
    }

    napi_value node_external = *arg++;
    struct http_connection_manager_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_external, (void **)&binding), {
        napi_throw_type_error(env, NULL, "connection_manager should be an external");
        return NULL;
    });

    napi_value node_connection = *arg++;
    struct http_connection_binding *connection_binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_connection, (void **)&connection_binding), {
        napi_throw_type_error(env, NULL, "connection should be an external");
        return NULL;
    });

    struct aws_http_connection *connection = aws_napi_get_http_connection(connection_binding);
    if (aws_http_connection_manager_release_connection(binding->manager, connection)) {
        aws_napi_throw_last_error(env);
        return NULL;
    }

    return NULL;
}
