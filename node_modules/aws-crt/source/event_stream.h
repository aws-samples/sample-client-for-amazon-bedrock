/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#ifndef AWS_CRT_NODEJS_EVENT_STREAM_H
#define AWS_CRT_NODEJS_EVENT_STREAM_H

#include "module.h"

napi_value aws_napi_event_stream_client_connection_new(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_connection_close(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_connection_close_internal(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_connection_connect(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_connection_send_protocol_message(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_stream_new(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_stream_close(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_stream_activate(napi_env env, napi_callback_info info);

napi_value aws_napi_event_stream_client_stream_send_message(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_EVENT_STREAM_H */
