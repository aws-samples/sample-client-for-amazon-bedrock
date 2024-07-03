#ifndef AWS_CRT_NODEJS_CRYTPO_H
#define AWS_CRT_NODEJS_CRYTPO_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

AWS_EXTERN_C_BEGIN

napi_value aws_napi_hash_md5_new(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_sha1_new(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_sha256_new(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_update(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_digest(napi_env env, napi_callback_info info);

napi_value aws_napi_hash_md5_compute(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_sha1_compute(napi_env env, napi_callback_info info);
napi_value aws_napi_hash_sha256_compute(napi_env env, napi_callback_info info);

napi_value aws_napi_hmac_sha256_new(napi_env env, napi_callback_info info);
napi_value aws_napi_hmac_update(napi_env env, napi_callback_info info);
napi_value aws_napi_hmac_digest(napi_env env, napi_callback_info info);

napi_value aws_napi_hmac_sha256_compute(napi_env env, napi_callback_info info);

AWS_EXTERN_C_END

#endif /* AWS_CRT_NODEJS_CRYTPO_H */
