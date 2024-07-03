#ifndef AWS_CRT_NODEJS_HTTP_STREAM_H
#define AWS_CRT_NODEJS_HTTP_STREAM_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

napi_value aws_napi_http_stream_new(napi_env env, napi_callback_info info);
napi_value aws_napi_http_stream_activate(napi_env env, napi_callback_info info);
napi_value aws_napi_http_stream_close(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_HTTP_STREAM_H */
