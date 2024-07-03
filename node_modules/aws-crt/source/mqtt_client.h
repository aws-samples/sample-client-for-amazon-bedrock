#ifndef AWS_CRT_NODEJS_MQTT_CLIENT_H
#define AWS_CRT_NODEJS_MQTT_CLIENT_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

#include <aws/mqtt/client.h>

struct mqtt_nodejs_client {
    struct aws_mqtt_client *native_client;
};

napi_value aws_napi_mqtt_client_new(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_MQTT_CLIENT_H */
