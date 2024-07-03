/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "mqtt_client.h"
#include "io.h"

static void s_mqtt_client_finalize(napi_env env, void *finalize_data, void *finalize_hint) {

    (void)env;
    (void)finalize_hint;

    struct mqtt_nodejs_client *node_client = finalize_data;
    AWS_ASSERT(node_client);

    struct aws_allocator *allocator = node_client->native_client->allocator;

    aws_mqtt_client_release(node_client->native_client);
    aws_mem_release(allocator, node_client);
}

napi_value aws_napi_mqtt_client_new(napi_env env, napi_callback_info info) {

    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct mqtt_nodejs_client *node_client = NULL;

    size_t num_args = 1;
    napi_value node_client_bootstrap;
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, &node_client_bootstrap, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args < 1) {
        napi_throw_error(env, NULL, "aws_nodejs_mqtt_client_new needs at least 1 argument");
        return NULL;
    }

    struct aws_client_bootstrap *client_bootstrap = NULL;
    struct client_bootstrap_binding *client_bootstrap_binding = NULL;
    napi_get_value_external(env, node_client_bootstrap, (void **)&client_bootstrap_binding);

    if (client_bootstrap_binding != NULL) {
        client_bootstrap = aws_napi_get_client_bootstrap(client_bootstrap_binding);
    } else {
        client_bootstrap = aws_napi_get_default_client_bootstrap();
    }

    node_client = aws_mem_acquire(allocator, sizeof(struct mqtt_nodejs_client));
    AWS_FATAL_ASSERT(node_client);
    AWS_ZERO_STRUCT(*node_client);

    node_client->native_client = aws_mqtt_client_new(allocator, client_bootstrap);
    if (node_client->native_client == NULL) {
        napi_throw_error(env, NULL, "Failed to init client");
        goto error;
    }

    napi_value node_external;
    AWS_NAPI_CALL(env, napi_create_external(env, node_client, s_mqtt_client_finalize, NULL, &node_external), {
        napi_throw_error(env, NULL, "Failed create n-api external");
        goto error;
    });

    return node_external;

error:
    if (node_client) {
        aws_mqtt_client_release(node_client->native_client);
        aws_mem_release(allocator, node_client);
    }

    return NULL;
}
