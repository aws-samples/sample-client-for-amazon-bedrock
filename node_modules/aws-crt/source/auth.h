#ifndef AWS_CRT_NODEJS_AUTH_H
#define AWS_CRT_NODEJS_AUTH_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

napi_status aws_napi_auth_bind(napi_env env, napi_value exports);

struct aws_credentials_provider;

napi_status aws_napi_credentials_provider_wrap(
    napi_env env,
    struct aws_credentials_provider *creds_provider,
    napi_value *result);
struct aws_credentials_provider *aws_napi_credentials_provider_unwrap(napi_env env, napi_value js_object);

struct aws_signing_config_aws;
struct aws_signing_config_aws *aws_signing_config_aws_prepare_and_unwrap(napi_env env, napi_value js_object);

#endif /* AWS_CRT_NODEJS_AUTH_H */
