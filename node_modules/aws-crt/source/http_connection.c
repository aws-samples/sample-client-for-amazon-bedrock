/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "http_connection.h"
#include "io.h"

#include <aws/http/connection.h>
#include <aws/http/proxy.h>
#include <aws/io/tls_channel_handler.h>

struct http_proxy_options_binding {
    struct aws_http_proxy_options native;

    struct aws_allocator *allocator;

    struct aws_string *host_name;
    struct aws_string *auth_username;
    struct aws_string *auth_password;
};

void s_proxy_options_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;

    struct http_proxy_options_binding *binding = finalize_data;

    aws_string_destroy(binding->host_name);
    aws_string_destroy(binding->auth_username);
    aws_string_destroy(binding->auth_password);

    aws_mem_release(binding->allocator, binding);
}
napi_value aws_napi_http_proxy_options_new(napi_env env, napi_callback_info info) {

    napi_value node_args[7];
    size_t num_args = AWS_ARRAY_SIZE(node_args);

    napi_value *arg = &node_args[0];
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_proxy_options_new requires exactly 7 arguments");
        return NULL;
    }

    napi_value node_external = NULL; /* return value, external that wraps the aws_tls_connection_options */

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct http_proxy_options_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct http_proxy_options_binding));
    AWS_FATAL_ASSERT(binding && "Failed to allocate new http_proxy_options_binding");
    binding->allocator = allocator;

    napi_value node_host_name = *arg++;
    binding->host_name = aws_string_new_from_napi(env, node_host_name);
    if (!binding->host_name) {
        AWS_NAPI_ENSURE(env, napi_throw_type_error(env, NULL, "Unable to convert host_name to string"));
        goto cleanup;
    }
    binding->native.host = aws_byte_cursor_from_string(binding->host_name);

    napi_value node_port = *arg++;
    uint32_t port;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_port, &port), {
        napi_throw_type_error(env, NULL, "port must be a number");
        goto cleanup;
    });
    binding->native.port = port;

    napi_value node_auth_method = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_auth_method)) {
        uint32_t auth_method = 0;
        AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_auth_method, &auth_method), {
            napi_throw_type_error(env, NULL, "auth_method must be a number");
            goto cleanup;
        });
        binding->native.auth_type = auth_method;
    }

    napi_value node_username = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_username)) {
        binding->auth_username = aws_string_new_from_napi(env, node_username);
        if (!binding->auth_username) {
            napi_throw_type_error(env, NULL, "Unable to convert auth_username to string");
            goto cleanup;
        }
        binding->native.auth_username = aws_byte_cursor_from_string(binding->auth_username);
    }

    napi_value node_password = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_password)) {
        binding->auth_password = aws_string_new_from_napi(env, node_password);
        if (!binding->auth_password) {
            napi_throw_type_error(env, NULL, "Unable to convert auth_password to string");
            goto cleanup;
        }
        binding->native.auth_password = aws_byte_cursor_from_string(binding->auth_password);
    }

    napi_value node_tls_opts = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_tls_opts)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls_opts, (void **)&binding->native.tls_options), {
            napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
            goto cleanup;
        });
    }

    napi_value node_connection_type = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_connection_type)) {
        uint32_t connection_type = 0;
        AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_connection_type, &connection_type), {
            napi_throw_type_error(env, NULL, "connection_type must be a number");
            goto cleanup;
        });
        binding->native.connection_type = connection_type;
    }

    if (binding->native.connection_type == AWS_HPCT_HTTP_FORWARD && binding->native.tls_options != NULL) {
        AWS_NAPI_ENSURE(env, napi_throw_type_error(env, NULL, "Forwarding proxy connections cannot use tls"));
        goto cleanup;
    }

    AWS_NAPI_CALL(
        env, napi_create_external(env, binding, s_proxy_options_finalize, NULL, &node_external), { goto cleanup; });

    return node_external;

cleanup:
    s_proxy_options_finalize(env, binding, NULL);
    return NULL;
}
struct aws_http_proxy_options *aws_napi_get_http_proxy_options(struct http_proxy_options_binding *binding) {
    return &binding->native;
}

struct http_connection_binding {
    struct aws_http_connection *connection;
    struct aws_allocator *allocator;
    napi_ref node_external;
    napi_env env;
    napi_threadsafe_function on_setup;
    napi_threadsafe_function on_shutdown;
};

/* finalizer called when node cleans up this object */
static void s_http_connection_from_manager_binding_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)finalize_hint;
    (void)env;
    struct http_connection_binding *binding = finalize_data;

    /* no release call, the http_client_connection_manager has already released it */
    aws_mem_release(binding->allocator, binding);
}

struct aws_http_connection *aws_napi_get_http_connection(struct http_connection_binding *binding) {
    return binding->connection;
}

napi_value aws_napi_http_connection_from_manager(napi_env env, struct aws_http_connection *connection) {
    struct http_connection_binding *binding =
        aws_mem_calloc(aws_napi_get_allocator(), 1, sizeof(struct http_connection_binding));
    if (!binding) {
        aws_napi_throw_last_error(env);
        return NULL;
    }
    binding->env = env;
    binding->connection = connection;
    binding->allocator = aws_napi_get_allocator();

    napi_value node_external = NULL;
    AWS_NAPI_CALL(
        env,
        napi_create_external(env, binding, s_http_connection_from_manager_binding_finalize, NULL, &node_external),
        {
            napi_throw_error(env, NULL, "Unable to create external for managed connection");
            aws_mem_release(aws_napi_get_allocator(), binding);
            return NULL;
        });
    return node_external;
}

struct on_connection_args {
    struct http_connection_binding *binding;
    int error_code;
};

static void s_http_on_connection_setup_call(napi_env env, napi_value on_setup, void *context, void *user_data) {
    struct http_connection_binding *binding = context;
    struct on_connection_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_get_reference_value(env, args->binding->node_external, &params[0]));
        AWS_NAPI_ENSURE(env, napi_create_uint32(env, args->error_code, &params[1]));

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, binding->on_setup, NULL, on_setup, num_params, params));
    }

    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_setup, napi_tsfn_abort));
    if (args->error_code) {
        /* setup failed, shutdown will never get invoked. Clean up the functions here */
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_shutdown, napi_tsfn_abort));
    }

    aws_mem_release(binding->allocator, args);
}

static void s_http_on_connection_setup(struct aws_http_connection *connection, int error_code, void *user_data) {
    struct http_connection_binding *binding = user_data;
    binding->connection = connection;
    if (binding->on_setup) {
        struct on_connection_args *args = aws_mem_calloc(binding->allocator, 1, sizeof(struct on_connection_args));
        args->binding = binding;
        args->error_code = error_code;
        AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_setup, args));
    }
}

static void s_http_on_connection_shutdown_call(napi_env env, napi_value on_shutdown, void *context, void *user_data) {
    struct http_connection_binding *binding = context;
    struct on_connection_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, napi_get_reference_value(env, args->binding->node_external, &params[0]));
        AWS_NAPI_ENSURE(env, napi_create_uint32(env, args->error_code, &params[1]));

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(env, binding->on_shutdown, NULL, on_shutdown, num_params, params));
    }

    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_shutdown, napi_tsfn_abort));
    aws_mem_release(binding->allocator, args);
}

static void s_http_on_connection_shutdown(struct aws_http_connection *connection, int error_code, void *user_data) {
    struct http_connection_binding *binding = user_data;
    binding->connection = connection;
    if (binding->on_shutdown) {
        struct on_connection_args *args = aws_mem_calloc(binding->allocator, 1, sizeof(struct on_connection_args));
        args->binding = binding;
        args->error_code = error_code;
        AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_shutdown, args));
    }
}

/* finalizer called when node cleans up this object */
static void s_http_connection_binding_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;
    struct http_connection_binding *binding = finalize_data;

    aws_http_connection_release(binding->connection);
    aws_mem_release(binding->allocator, binding);
}

napi_value aws_napi_http_connection_new(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value result = NULL;
    struct aws_tls_connection_options *tls_opts = NULL;
    struct aws_http_proxy_options *proxy_opts = NULL;
    struct aws_string *host_name = NULL;
    struct aws_http_client_connection_options options = AWS_HTTP_CLIENT_CONNECTION_OPTIONS_INIT;
    options.allocator = allocator;

    /* parse/validate arguments */
    napi_value node_args[8];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retrieve callback information");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_new needs exactly 7 arguments");
        return NULL;
    }

    napi_value node_bootstrap = *arg++;

    struct aws_client_bootstrap *bootstrap = NULL;
    struct client_bootstrap_binding *bootstrap_binding = NULL;
    napi_get_value_external(env, node_bootstrap, (void **)&bootstrap_binding);
    if (bootstrap_binding != NULL) {
        bootstrap = aws_napi_get_client_bootstrap(bootstrap_binding);
    } else {
        bootstrap = aws_napi_get_default_client_bootstrap();
    }

    /* create node external to hold the connection wrapper, cleanup is required from here on out */
    struct http_connection_binding *binding = aws_mem_calloc(allocator, 1, sizeof(struct http_connection_binding));
    if (!binding) {
        aws_napi_throw_last_error(env);
        goto alloc_failed;
    }

    binding->allocator = allocator;
    binding->env = env;

    napi_value node_on_setup = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_on_setup)) {
        napi_throw_error(env, NULL, "on_connection_setup must be a callback");
        return NULL;
    }
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            node_on_setup,
            "aws_http_connection_on_connection_setup",
            s_http_on_connection_setup_call,
            binding,
            &binding->on_setup),
        { goto failed_callbacks; });

    napi_value node_on_shutdown = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_on_shutdown)) {
        AWS_NAPI_CALL(
            env,
            aws_napi_create_threadsafe_function(
                env,
                node_on_shutdown,
                "aws_http_connection_on_connection_shutdown",
                s_http_on_connection_shutdown_call,
                binding,
                &binding->on_shutdown),
            { goto failed_callbacks; });
    }

    /* will be owned by tls_options */
    napi_value node_host_name = *arg++;
    host_name = aws_string_new_from_napi(env, node_host_name);
    if (!host_name) {
        napi_throw_type_error(env, NULL, "host_name must be a String");
        goto argument_error;
    }

    napi_value node_port = *arg++;
    uint32_t port = 0;
    AWS_NAPI_CALL(env, napi_get_value_uint32(env, node_port, &port), {
        napi_throw_type_error(env, NULL, "port must be a Number");
        goto argument_error;
    });
    options.port = port;

    napi_value node_socket_options = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_socket_options, (void **)&options.socket_options), {
        napi_throw_error(env, NULL, "Unable to extract socket_options from external");
        goto argument_error;
    });

    napi_value node_tls_opts = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_tls_opts)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls_opts, (void **)&tls_opts), {
            napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
            goto argument_error;
        });
    }

    napi_value node_proxy_opts = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_proxy_opts)) {
        struct http_proxy_options_binding *proxy_binding = NULL;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_proxy_opts, (void **)&proxy_binding), {
            napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
            goto argument_error;
        });
        /* proxy_options are copied internally, no need to go nuts on copies */
        proxy_opts = &proxy_binding->native;
    }

    napi_value node_external = NULL;
    AWS_NAPI_CALL(
        env, napi_create_external(env, binding, s_http_connection_binding_finalize, binding, &node_external), {
            napi_throw_error(env, NULL, "Failed to create napi external for http_connection_binding");
            goto create_external_failed;
        });

    AWS_NAPI_CALL(env, napi_create_reference(env, node_external, 1, &binding->node_external), {
        napi_throw_error(env, NULL, "Failed to reference node_external");
        goto create_external_failed;
    });

    options.bootstrap = bootstrap;
    options.host_name = aws_byte_cursor_from_string(host_name);
    options.on_setup = s_http_on_connection_setup;
    options.on_shutdown = s_http_on_connection_shutdown;
    options.proxy_options = proxy_opts;
    options.user_data = binding;

    if (tls_opts) {
        if (!tls_opts->server_name) {
            struct aws_byte_cursor server_name_cursor = aws_byte_cursor_from_string(host_name);
            aws_tls_connection_options_set_server_name(tls_opts, allocator, &server_name_cursor);
        }
        options.tls_options = tls_opts;
    }

    if (aws_http_client_connect(&options)) {
        aws_napi_throw_last_error(env);
        goto connect_failed;
    }

    result = node_external;
    goto done;

connect_failed:
create_external_failed:
failed_callbacks:
    if (binding) {
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_setup, napi_tsfn_abort));
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_shutdown, napi_tsfn_abort));
    }
    aws_mem_release(allocator, binding);
alloc_failed:
argument_error:
done:
    aws_string_destroy(host_name);
    return result;
}

napi_value aws_napi_http_connection_close(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to extract arguments");
        return NULL;
    });
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "http_connection_close takes exactly 1 argument");
        return NULL;
    }

    struct http_connection_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_args[0], (void **)&binding), {
        napi_throw_error(env, NULL, "Failed to extract http_connection_binding from external");
        return NULL;
    });

    if (binding->connection) {
        aws_http_connection_close(binding->connection);
    }

    /* the rest of cleanup happens in s_http_connection_binding_finalize() */
    return NULL;
}
