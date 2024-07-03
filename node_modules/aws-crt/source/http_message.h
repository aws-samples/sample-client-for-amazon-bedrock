#ifndef AWS_CRT_NODEJS_HTTP_MESSAGE_H
#define AWS_CRT_NODEJS_HTTP_MESSAGE_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

napi_status aws_napi_http_message_bind(napi_env env, napi_value exports);

struct aws_http_message;
napi_status aws_napi_http_message_wrap(napi_env env, struct aws_http_message *message, napi_value *result);
struct aws_http_message *aws_napi_http_message_unwrap(napi_env env, napi_value js_object);

#endif /* AWS_CRT_NODEJS_HTTP_MESSAGE_H */
