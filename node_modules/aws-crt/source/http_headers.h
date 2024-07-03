#ifndef AWS_CRT_NODEJS_HTTP_HEADERS_H
#define AWS_CRT_NODEJS_HTTP_HEADERS_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

napi_status aws_napi_http_headers_bind(napi_env env, napi_value exports);

struct aws_http_headers;
napi_status aws_napi_http_headers_wrap(napi_env env, struct aws_http_headers *headers, napi_value *result);
struct aws_http_headers *aws_napi_http_headers_unwrap(napi_env env, napi_value js_object);

#endif /* AWS_CRT_NODEJS_HTTP_HEADERS_H */
