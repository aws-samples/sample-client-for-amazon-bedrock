#ifndef AWS_CRT_NODEJS_CHECKSUMS_H
#define AWS_CRT_NODEJS_CHECKSUMS_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

napi_value aws_napi_checksums_crc32(napi_env env, napi_callback_info info);
napi_value aws_napi_checksums_crc32c(napi_env env, napi_callback_info info);

#endif /* AWS_CRT_NODEJS_CHECKSUMS_H */
