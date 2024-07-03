/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#ifndef AWS_CRT_NODEJS_MQTT5_CLIENT_H
#define AWS_CRT_NODEJS_MQTT5_CLIENT_H

#include "module.h"

napi_value aws_napi_mqtt5_client_new(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_start(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_stop(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_subscribe(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_unsubscribe(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_publish(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_get_queue_statistics(napi_env env, napi_callback_info info);

napi_value aws_napi_mqtt5_client_close(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_MQTT5_CLIENT_H */
