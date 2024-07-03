#ifndef AWS_CRT_NODEJS_HTTP_CONNECTION_H
#define AWS_CRT_NODEJS_HTTP_CONNECTION_H

/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

struct http_proxy_options_binding;

napi_value aws_napi_http_proxy_options_new(napi_env env, napi_callback_info info);
struct aws_http_proxy_options *aws_napi_get_http_proxy_options(struct http_proxy_options_binding *binding);

napi_value aws_napi_http_connection_new(napi_env env, napi_callback_info info);
napi_value aws_napi_http_connection_close(napi_env env, napi_callback_info info);

struct http_connection_binding;
struct aws_http_connection;

struct aws_http_connection *aws_napi_get_http_connection(struct http_connection_binding *binding);
napi_value aws_napi_http_connection_from_manager(napi_env env, struct aws_http_connection *connection);

#endif /* AWS_CRT_NODEJS_HTTP_CONNECTION_H */
