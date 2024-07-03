
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "checksums.h"

#include <aws/checksums/crc.h>

napi_value crc_common(napi_env env, napi_callback_info info, uint32_t (*checksum_fn)(const uint8_t *, int, uint32_t)) {
    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    struct aws_byte_buf to_hash;
    AWS_ZERO_STRUCT(to_hash);
    // struct aws_byte_buf *to_hash_ptr = (struct aws_byte_buf*)NULL;
    napi_value node_val = NULL;

    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        goto done;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_checksums_crc needs exactly 2 arguments");
        goto done;
    }

    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        goto done;
    }
    uint8_t *buffer = to_hash.buffer;
    size_t length = to_hash.len;
    uint32_t previous = 0;

    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {
        if (napi_get_value_uint32(env, node_args[1], &previous)) {
            napi_throw_type_error(env, NULL, "previous argument must be undefined or a positive number");
            goto done;
        }
    }

    uint32_t val = previous;
    while (length > INT_MAX) {
        val = checksum_fn(buffer, INT_MAX, val);
        buffer += (size_t)INT_MAX;
        length -= (size_t)INT_MAX;
    }
    val = checksum_fn(buffer, (int)length, val);
    AWS_NAPI_CALL(env, napi_create_uint32(env, val, &node_val), { goto done; });

done:
    aws_byte_buf_clean_up(&to_hash);

    return node_val;
}

napi_value aws_napi_checksums_crc32(napi_env env, napi_callback_info info) {
    return crc_common(env, info, aws_checksums_crc32);
}

napi_value aws_napi_checksums_crc32c(napi_env env, napi_callback_info info) {
    return crc_common(env, info, aws_checksums_crc32c);
}
