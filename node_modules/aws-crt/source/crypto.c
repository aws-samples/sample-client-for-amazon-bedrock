/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "crypto.h"

#include <aws/cal/hash.h>
#include <aws/cal/hmac.h>

/*******************************************************************************
 * Hash
 ******************************************************************************/

/** Finalizer for an hash external */
static void s_hash_finalize(napi_env env, void *finalize_data, void *finalize_hint) {

    (void)env;
    (void)finalize_hint;

    struct aws_hash *hash = finalize_data;
    AWS_ASSERT(hash);

    aws_hash_destroy(hash);
}

napi_value aws_napi_hash_md5_new(napi_env env, napi_callback_info info) {

    (void)info;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_hash *hash = aws_md5_new(allocator);
    if (!hash) {
        return NULL;
    }

    napi_value node_external = NULL;
    if (napi_create_external(env, hash, s_hash_finalize, NULL, &node_external)) {
        napi_throw_error(env, NULL, "Failed create n-api external");
    }
    return node_external;
}

napi_value aws_napi_hash_sha1_new(napi_env env, napi_callback_info info) {

    (void)info;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_hash *hash = aws_sha1_new(allocator);
    if (!hash) {
        return NULL;
    }

    napi_value node_external = NULL;
    if (napi_create_external(env, hash, s_hash_finalize, NULL, &node_external)) {
        napi_throw_error(env, NULL, "Failed create n-api external");
    }
    return node_external;
}

napi_value aws_napi_hash_sha256_new(napi_env env, napi_callback_info info) {

    (void)info;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_hash *hash = aws_sha256_new(allocator);
    if (!hash) {
        return NULL;
    }

    napi_value node_external = NULL;
    if (napi_create_external(env, hash, s_hash_finalize, NULL, &node_external)) {
        napi_throw_error(env, NULL, "Failed create n-api external");
    }
    return node_external;
}

napi_value aws_napi_hash_update(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hash_update needs exactly 2 arguments");
        return NULL;
    }

    struct aws_hash *hash = NULL;
    if (napi_get_value_external(env, node_args[0], (void **)&hash)) {
        napi_throw_error(env, NULL, "Failed to extract hash from first argument");
        return NULL;
    }

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[1])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    if (aws_hash_update(hash, &to_hash_cur)) {
        aws_napi_throw_last_error(env);
    }

    aws_byte_buf_clean_up(&to_hash);

    return NULL;
}

napi_value aws_napi_hash_digest(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hash_digest needs exactly 2 arguments");
        return NULL;
    }

    struct aws_hash *hash = NULL;
    if (napi_get_value_external(env, node_args[0], (void **)&hash)) {
        napi_throw_error(env, NULL, "Failed to extract hash from first argument");
        return NULL;
    }

    size_t digest_size = hash->digest_size;
    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[1], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_hash_finalize(hash, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
        return NULL;
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    return dataview;
}

napi_value aws_napi_hash_md5_compute(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hash_md5_compute needs exactly 2 arguments");
        return NULL;
    }

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        return NULL;
    }

    size_t digest_size = AWS_MD5_LEN;
    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[1], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_md5_compute(aws_napi_get_allocator(), &to_hash_cur, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    aws_byte_buf_clean_up(&to_hash);

    return dataview;
}

napi_value aws_napi_hash_sha256_compute(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hash_sha256_compute needs exactly 2 arguments");
        return NULL;
    }

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        return NULL;
    }

    size_t digest_size = AWS_MD5_LEN;
    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[1], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_sha256_compute(aws_napi_get_allocator(), &to_hash_cur, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    aws_byte_buf_clean_up(&to_hash);

    return dataview;
}

napi_value aws_napi_hash_sha1_compute(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hash_sha1_compute needs exactly 2 arguments");
        return NULL;
    }

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        return NULL;
    }

    size_t digest_size = AWS_MD5_LEN;
    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[1], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_sha1_compute(aws_napi_get_allocator(), &to_hash_cur, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    aws_byte_buf_clean_up(&to_hash);

    return dataview;
}

/*******************************************************************************
 * HMAC
 ******************************************************************************/

/** Finalizer for an hash external */
static void s_hmac_finalize(napi_env env, void *finalize_data, void *finalize_hint) {

    (void)env;
    (void)finalize_hint;

    struct aws_hmac *hmac = finalize_data;
    AWS_ASSERT(hmac);

    aws_hmac_destroy(hmac);
}

napi_value aws_napi_hmac_sha256_new(napi_env env, napi_callback_info info) {

    (void)info;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hmac_sha256_new needs exactly 1 argument");
        return NULL;
    }

    struct aws_byte_buf secret;
    if (aws_byte_buf_init_from_napi(&secret, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "secret argument must be a string or array");
        return NULL;
    }
    struct aws_byte_cursor secret_cur = aws_byte_cursor_from_buf(&secret);

    struct aws_hmac *hmac = aws_sha256_hmac_new(allocator, &secret_cur);
    if (!hmac) {
        aws_byte_buf_clean_up(&secret);
        return NULL;
    }

    napi_value node_external = NULL;
    if (napi_create_external(env, hmac, s_hmac_finalize, NULL, &node_external)) {
        napi_throw_error(env, NULL, "Failed create n-api external");
        aws_hmac_destroy(hmac);
        aws_byte_buf_clean_up_secure(&secret);
    }
    return node_external;
}

napi_value aws_napi_hmac_update(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hmac_update needs exactly 2 arguments");
        return NULL;
    }

    struct aws_hmac *hmac = NULL;
    if (napi_get_value_external(env, node_args[0], (void **)&hmac)) {
        napi_throw_error(env, NULL, "Failed to extract hmac from first argument");
        return NULL;
    }

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[1])) {
        napi_throw_type_error(env, NULL, "to_hmac argument must be a string or array");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    if (aws_hmac_update(hmac, &to_hash_cur)) {
        aws_napi_throw_last_error(env);
    }

    aws_byte_buf_clean_up(&to_hash);

    return NULL;
}

napi_value aws_napi_hmac_digest(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hmac_digest needs exactly 2 arguments");
        return NULL;
    }

    struct aws_hmac *hmac = NULL;
    if (napi_get_value_external(env, node_args[0], (void **)&hmac)) {
        napi_throw_error(env, NULL, "Failed to extract hmac from first argument");
        return NULL;
    }

    size_t digest_size = hmac->digest_size;
    if (!aws_napi_is_null_or_undefined(env, node_args[1])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[1], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_hmac_finalize(hmac, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
        return NULL;
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    return dataview;
}

napi_value aws_napi_hmac_sha256_compute(napi_env env, napi_callback_info info) {

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    if (napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL)) {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    }
    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "hmac_sha256_compute needs exactly 3 arguments");
        return NULL;
    }

    struct aws_byte_buf secret;
    if (aws_byte_buf_init_from_napi(&secret, env, node_args[0])) {
        napi_throw_type_error(env, NULL, "secret argument must be a string or array");
        return NULL;
    }
    struct aws_byte_cursor secret_cur = aws_byte_cursor_from_buf(&secret);

    struct aws_byte_buf to_hash;
    if (aws_byte_buf_init_from_napi(&to_hash, env, node_args[1])) {
        napi_throw_type_error(env, NULL, "to_hash argument must be a string or array");
        return NULL;
    }

    size_t digest_size = AWS_MD5_LEN;
    if (!aws_napi_is_null_or_undefined(env, node_args[2])) {

        uint32_t truncate_to = 0;
        if (napi_get_value_uint32(env, node_args[2], &truncate_to)) {
            napi_throw_type_error(env, NULL, "truncate_to argument must be undefined or a positive number");
            return NULL;
        }

        if (digest_size > truncate_to) {
            digest_size = truncate_to;
        }
    }

    napi_value arraybuffer;
    void *data = NULL;
    if (napi_create_arraybuffer(env, digest_size, &data, &arraybuffer)) {
        napi_throw_error(env, NULL, "Failed to create output arraybuffer");
        return NULL;
    }

    struct aws_byte_cursor to_hash_cur = aws_byte_cursor_from_buf(&to_hash);
    struct aws_byte_buf out_buf = aws_byte_buf_from_empty_array(data, digest_size);
    if (aws_sha256_hmac_compute(aws_napi_get_allocator(), &secret_cur, &to_hash_cur, &out_buf, digest_size)) {
        aws_napi_throw_last_error(env);
    }

    napi_value dataview;
    if (napi_create_dataview(env, digest_size, arraybuffer, 0, &dataview)) {
        napi_throw_error(env, NULL, "Failed to create output dataview");
        return NULL;
    }

    aws_byte_buf_clean_up(&to_hash);

    return dataview;
}
