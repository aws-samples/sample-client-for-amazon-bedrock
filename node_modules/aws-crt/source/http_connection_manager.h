#ifndef AWS_CRT_NODEJS_HTTP_CONNECTION_MANAGER_H
#define AWS_CRT_NODEJS_HTTP_CONNECTION_MANAGER_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

struct aws_http_connection_manager;
struct http_connection_manager_binding;

struct aws_http_connection_manager *aws_napi_get_http_connection_manager(
    struct http_connection_manager_binding *binding);

napi_value aws_napi_http_connection_manager_new(napi_env env, napi_callback_info info);
napi_value aws_napi_http_connection_manager_acquire(napi_env env, napi_callback_info info);
napi_value aws_napi_http_connection_manager_release(napi_env env, napi_callback_info info);
napi_value aws_napi_http_connection_manager_close(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_HTTP_CONNECTION_MANAGER_H */
