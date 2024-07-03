/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "http_headers.h"

#include "class_binder.h"

#include <aws/http/request_response.h>

static struct aws_napi_class_info s_headers_class_info;
static aws_napi_method_fn s_headers_constructor;

static aws_napi_property_get_fn s_headers_length_get;

static aws_napi_method_fn s_headers_get;
static aws_napi_method_fn s_headers_get_values;
static aws_napi_method_fn s_headers_get_index;
static aws_napi_method_fn s_headers__iterator;
static aws_napi_method_fn s_headers_add_header;
static aws_napi_method_fn s_headers_set_header;
static aws_napi_method_fn s_headers_remove;
static aws_napi_method_fn s_headers_remove_value;
static aws_napi_method_fn s_headers_clear;
static aws_napi_method_fn s_headers__flatten;

static napi_ref s_iterator_constructor;
static napi_value s_iterator_ctor(napi_env env, napi_callback_info info);
static napi_value s_iterator_next(napi_env env, napi_callback_info info);

napi_status aws_napi_http_headers_bind(napi_env env, napi_value exports) {

    static const struct aws_napi_method_info s_headers_constructor_info = {
        .name = "HttpHeaders",
        .method = s_headers_constructor,

        .num_arguments = 0,
        .arg_types = {napi_object},
    };

    static const struct aws_napi_property_info s_headers_properties[] = {
        {
            .name = "length",
            .type = napi_number,

            .getter = s_headers_length_get,
            .attributes = napi_enumerable,
        },
    };

    static const struct aws_napi_method_info s_headers_methods[] = {
        {
            .name = "get",
            .method = s_headers_get,
            .num_arguments = 1,
            .arg_types = {napi_string},
        },
        {
            .name = "get_values",
            .method = s_headers_get_values,
            .num_arguments = 1,
            .arg_types = {napi_string},
        },
        {
            .name = "get_index",
            .method = s_headers_get_index,
            .num_arguments = 1,
            .arg_types = {napi_number},
        },
        {
            .symbol = "iterator",
            .method = s_headers__iterator,
        },
        {
            .name = "add",
            .method = s_headers_add_header,
            .num_arguments = 2,
            .arg_types = {napi_string, napi_string},
        },
        {
            .name = "set",
            .method = s_headers_set_header,
            .num_arguments = 2,
            .arg_types = {napi_string, napi_string},
        },
        {
            .name = "remove",
            .method = s_headers_remove,
            .num_arguments = 1,
            .arg_types = {napi_string},
        },
        {
            .name = "remove_value",
            .method = s_headers_remove_value,
            .num_arguments = 2,
            .arg_types = {napi_string, napi_string},
        },
        {
            .name = "clear",
            .method = s_headers_clear,
            .num_arguments = 0,
        },
        {
            .name = "_flatten",
            .method = s_headers__flatten,
            .num_arguments = 0,
        },
    };

    AWS_NAPI_CALL(
        env,
        aws_napi_define_class(
            env,
            exports,
            &s_headers_constructor_info,
            s_headers_properties,
            AWS_ARRAY_SIZE(s_headers_properties),
            s_headers_methods,
            AWS_ARRAY_SIZE(s_headers_methods),
            &s_headers_class_info),
        { return status; });

    static const napi_property_descriptor s_iterator_properties[] = {
        {
            .utf8name = "next",
            .method = s_iterator_next,
            .attributes = napi_enumerable,
        },
    };

    napi_value iterator_ctor = NULL;
    AWS_NAPI_CALL(
        env,
        napi_define_class(
            env,
            "Iterator",
            NAPI_AUTO_LENGTH,
            s_iterator_ctor,
            NULL,
            AWS_ARRAY_SIZE(s_iterator_properties),
            s_iterator_properties,
            &iterator_ctor),
        { return status; });

    AWS_NAPI_CALL(env, napi_create_reference(env, iterator_ctor, 1, &s_iterator_constructor), { return status; });

    return napi_ok;
}

/***********************************************************************************************************************
 * Headers
 **********************************************************************************************************************/

static void s_napi_http_headers_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;

    aws_http_headers_release(finalize_data);
}

napi_status aws_napi_http_headers_wrap(napi_env env, struct aws_http_headers *headers, napi_value *result) {
    aws_http_headers_acquire(headers);
    return aws_napi_wrap(env, &s_headers_class_info, headers, s_napi_http_headers_finalize, result);
}

struct aws_http_headers *aws_napi_http_headers_unwrap(napi_env env, napi_value js_object) {
    struct aws_http_headers *headers = NULL;
    AWS_NAPI_CALL(env, napi_unwrap(env, js_object, (void **)&headers), { return NULL; });
    aws_http_headers_acquire(headers);
    return headers;
}

static napi_value s_headers_constructor(napi_env env, const struct aws_napi_callback_info *cb_info) {

    struct aws_allocator *alloc = aws_napi_get_allocator();
    struct aws_http_headers *headers = aws_http_headers_new(alloc);
    const struct aws_napi_argument *arg = NULL;

    if (aws_napi_method_next_argument(napi_object, cb_info, &arg)) {
        napi_value node_headers = arg->node;

        bool is_array = false;
        if (napi_is_array(env, node_headers, &is_array) || !is_array) {
            napi_throw_type_error(env, NULL, "headers must be an array of arrays");
            goto cleanup;
        }

        uint32_t num_headers = 0;
        AWS_NAPI_CALL(env, napi_get_array_length(env, node_headers, &num_headers), {
            napi_throw_error(env, NULL, "Could not get length of header array");
            goto cleanup;
        });

        struct aws_byte_buf name_buf;
        struct aws_byte_buf value_buf;
        aws_byte_buf_init(&name_buf, alloc, 256);
        aws_byte_buf_init(&value_buf, alloc, 256);
        for (uint32_t idx = 0; idx < num_headers; ++idx) {
            napi_value node_header = NULL;
            AWS_NAPI_CALL(env, napi_get_element(env, node_headers, idx, &node_header), {
                napi_throw_error(env, NULL, "Failed to extract headers");
                goto header_parse_error;
            });

            AWS_NAPI_CALL(env, napi_is_array(env, node_header, &is_array), {
                napi_throw_error(env, NULL, "Cannot determine if headers are an array");
                goto header_parse_error;
            });
            if (!is_array) {
                napi_throw_type_error(env, NULL, "headers must be an array of 2 element arrays");
                goto header_parse_error;
            }

            uint32_t num_parts = 0;
            AWS_NAPI_CALL(env, napi_get_array_length(env, node_header, &num_parts), {
                napi_throw_error(env, NULL, "Could not get length of header parts");
                goto header_parse_error;
            });
            if (num_parts != 2) {
                napi_throw_error(env, NULL, "Could not get length of header parts or length was not 2");
                goto header_parse_error;
            }
            napi_value node_name = NULL;
            napi_value node = NULL;
            AWS_NAPI_CALL(env, napi_get_element(env, node_header, 0, &node_name), {
                napi_throw_error(env, NULL, "Could not extract header name");
                goto header_parse_error;
            });
            AWS_NAPI_CALL(env, napi_get_element(env, node_header, 1, &node), {
                napi_throw_error(env, NULL, "Could not extract header value");
                goto header_parse_error;
            });
            /* extract the length of the name and value strings, ensure the buffers can hold them, and
            then copy the values out. Should result in buffer re-use most of the time. */
            size_t length = 0;
            AWS_NAPI_CALL(env, napi_get_value_string_utf8(env, node_name, NULL, 0, &length), {
                napi_throw_type_error(env, NULL, "HTTP header was not a string or length could not be extracted");
                goto header_parse_error;
            });
            aws_byte_buf_reserve(&name_buf, length + 1);
            AWS_NAPI_CALL(env, napi_get_value_string_utf8(env, node, NULL, 0, &length), {
                napi_throw_type_error(env, NULL, "HTTP header was not a string or length could not be extracted");
                goto header_parse_error;
            });
            aws_byte_buf_reserve(&value_buf, length + 1);

            AWS_NAPI_CALL(
                env,
                napi_get_value_string_utf8(env, node_name, (char *)name_buf.buffer, name_buf.capacity, &name_buf.len),
                {
                    napi_throw_error(env, NULL, "HTTP header name could not be extracted");
                    goto header_parse_error;
                });
            AWS_NAPI_CALL(
                env,
                napi_get_value_string_utf8(env, node, (char *)value_buf.buffer, value_buf.capacity, &value_buf.len),
                {
                    napi_throw_error(env, NULL, "HTTP header value could not be extracted");
                    goto header_parse_error;
                });

            aws_http_headers_add(headers, aws_byte_cursor_from_buf(&name_buf), aws_byte_cursor_from_buf(&value_buf));
        }
        aws_byte_buf_clean_up(&name_buf);
        aws_byte_buf_clean_up(&value_buf);
        goto header_parse_success;

    header_parse_error:
        aws_byte_buf_clean_up(&name_buf);
        aws_byte_buf_clean_up(&value_buf);
        goto cleanup;
    }
header_parse_success:;

    napi_value node_this = cb_info->native_this;
    AWS_NAPI_CALL(env, napi_wrap(env, node_this, headers, s_napi_http_headers_finalize, NULL, NULL), {
        napi_throw_error(env, NULL, "Failed to wrap HttpHeaders");
        goto cleanup;
    });

    return node_this;

cleanup:
    if (headers) {
        aws_http_headers_release(headers);
    }
    return NULL;
}

static napi_value s_headers_length_get(napi_env env, void *native_this) {
    struct aws_http_headers *headers = native_this;

    napi_value result = NULL;
    AWS_NAPI_CALL(env, napi_create_uint32(env, (uint32_t)aws_http_headers_count(headers), &result), {
        aws_napi_throw_last_error(env);
    });
    return result;
}

static napi_value s_headers_create_header_array(napi_env env, const struct aws_http_header *header) {

    napi_value node_header = NULL;
    AWS_NAPI_ENSURE(env, napi_create_array(env, &node_header));

    napi_value node_name = NULL;
    napi_value node_value = NULL;
    AWS_NAPI_ENSURE(env, napi_create_string_utf8(env, (const char *)header->name.ptr, header->name.len, &node_name));
    AWS_NAPI_ENSURE(env, napi_create_string_utf8(env, (const char *)header->value.ptr, header->value.len, &node_value));
    AWS_NAPI_ENSURE(env, napi_set_element(env, node_header, 0, node_name));
    AWS_NAPI_ENSURE(env, napi_set_element(env, node_header, 1, node_value));

    return node_header;
}

static napi_value s_headers_get(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 1);
    struct aws_http_headers *native_this = cb_info->native_this;

    napi_value node_value = NULL;
    struct aws_byte_cursor value;
    if (aws_http_headers_get(native_this, aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string), &value)) {
        if (aws_last_error() != AWS_ERROR_HTTP_HEADER_NOT_FOUND) {
            aws_napi_throw_last_error(env);
        }
    } else {
        AWS_NAPI_ENSURE(env, napi_create_string_utf8(env, (const char *)value.ptr, value.len, &node_value));
    }
    return node_value;
}

static napi_value s_headers_get_values(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 1);
    struct aws_http_headers *native_this = cb_info->native_this;

    const struct aws_byte_cursor key = aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string);

    napi_value node_values = NULL;
    AWS_NAPI_ENSURE(env, napi_create_array(env, &node_values));

    const size_t num_headers = aws_http_headers_count(native_this);
    uint32_t array_idx = 0;
    for (size_t i = 0; i < num_headers; ++i) {
        struct aws_http_header header;
        aws_http_headers_get_index(native_this, i, &header);
        AWS_ASSUME(header.name.ptr && header.value.ptr);

        if (aws_byte_cursor_eq_ignore_case(&header.name, &key)) {
            napi_value node_value = NULL;
            AWS_NAPI_ENSURE(
                env, napi_create_string_utf8(env, (const char *)header.value.ptr, header.value.len, &node_value));
            napi_set_element(env, node_values, array_idx++, node_value);
        }
    }

    return node_values;
}

static napi_value s_headers_get_index(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 1);
    struct aws_http_headers *native_this = cb_info->native_this;

    const int64_t index = cb_info->arguments[0].native.number;
    if (index < 0 || (size_t)index > SIZE_MAX) {
        napi_throw_error(env, NULL, "Header index is out of bounds");
        return NULL;
    }

    struct aws_http_header header;
    if (aws_http_headers_get_index(native_this, (size_t)index, &header)) {
        aws_napi_throw_last_error(env);
        return NULL;
    }

    return s_headers_create_header_array(env, &header);
}

static napi_value s_headers__iterator(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 0);

    napi_value iterator_ctor = NULL;
    AWS_NAPI_ENSURE(env, napi_get_reference_value(env, s_iterator_constructor, &iterator_ctor));

    napi_value node_iterator = NULL;
    AWS_NAPI_ENSURE(env, napi_new_instance(env, iterator_ctor, 1, &cb_info->node_this, &node_iterator));

    return node_iterator;
}

static napi_value s_headers_add_header(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 2);
    struct aws_http_headers *native_this = cb_info->native_this;

    if (aws_http_headers_add(
            native_this,
            aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string),
            aws_byte_cursor_from_buf(&cb_info->arguments[1].native.string))) {
        aws_napi_throw_last_error(env);
    }

    return NULL;
}

static napi_value s_headers_set_header(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 2);
    struct aws_http_headers *native_this = cb_info->native_this;

    if (aws_http_headers_set(
            native_this,
            aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string),
            aws_byte_cursor_from_buf(&cb_info->arguments[1].native.string))) {
        aws_napi_throw_last_error(env);
    }

    return NULL;
}

static napi_value s_headers_remove(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 1);
    struct aws_http_headers *native_this = cb_info->native_this;

    if (aws_http_headers_erase(native_this, aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string))) {
        aws_napi_throw_last_error(env);
    }

    return NULL;
}

static napi_value s_headers_remove_value(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 2);
    struct aws_http_headers *native_this = cb_info->native_this;

    if (aws_http_headers_erase_value(
            native_this,
            aws_byte_cursor_from_buf(&cb_info->arguments[0].native.string),
            aws_byte_cursor_from_buf(&cb_info->arguments[1].native.string))) {
        aws_napi_throw_last_error(env);
    }

    return NULL;
}

static napi_value s_headers_clear(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 0);
    struct aws_http_headers *native_this = cb_info->native_this;

    aws_http_headers_clear(native_this);

    return NULL;
}

static napi_value s_headers__flatten(napi_env env, const struct aws_napi_callback_info *cb_info) {
    (void)env;

    AWS_FATAL_ASSERT(cb_info->num_args == 0);
    struct aws_http_headers *native_this = cb_info->native_this;

    napi_value node_values = NULL;
    AWS_NAPI_ENSURE(env, napi_create_array(env, &node_values));

    const size_t num_headers = aws_http_headers_count(native_this);
    uint32_t array_idx = 0;
    for (size_t i = 0; i < num_headers; ++i) {
        struct aws_http_header header;
        aws_http_headers_get_index(native_this, i, &header);
        AWS_ASSUME(header.name.ptr && header.value.ptr);

        napi_set_element(env, node_values, array_idx++, s_headers_create_header_array(env, &header));
    }

    return node_values;
}

/***********************************************************************************************************************
 * Iterator
 **********************************************************************************************************************/

struct headers_iterator {
    struct aws_http_headers *headers;
    size_t current_index;
};

static void s_iterator_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;

    struct headers_iterator *iterator = finalize_data;
    struct aws_allocator *allocator = finalize_hint;

    aws_http_headers_release(iterator->headers);
    aws_mem_release(allocator, iterator);
}

static napi_value s_iterator_ctor(napi_env env, napi_callback_info info) {

    size_t num_args = 1;
    napi_value native_headers = NULL;
    napi_value node_this = NULL;
    napi_get_cb_info(env, info, &num_args, &native_headers, &node_this, NULL);

    struct aws_allocator *allocator = aws_napi_get_allocator();

    /* Make and wrap an iterator object */
    struct headers_iterator *iterator = aws_mem_calloc(allocator, 1, sizeof(struct headers_iterator));
    iterator->headers = aws_napi_http_headers_unwrap(env, native_headers);
    iterator->current_index = 0;
    AWS_NAPI_ENSURE(env, napi_wrap(env, node_this, iterator, s_iterator_finalize, allocator, NULL));

    return node_this;
}

static napi_value s_iterator_next(napi_env env, napi_callback_info info) {

    size_t argc = 0;
    napi_value node_this = NULL;
    AWS_NAPI_ENSURE(env, napi_get_cb_info(env, info, &argc, NULL, &node_this, NULL));

    napi_valuetype t;
    AWS_NAPI_ENSURE(env, napi_typeof(env, node_this, &t));

    struct headers_iterator *iterator = NULL;
    AWS_NAPI_ENSURE(env, napi_unwrap(env, node_this, (void **)&iterator));

    bool done = false;
    napi_value node_value = NULL;
    if (iterator->current_index < aws_http_headers_count(iterator->headers)) {
        struct aws_http_header header;
        aws_http_headers_get_index(iterator->headers, iterator->current_index, &header);
        node_value = s_headers_create_header_array(env, &header);
        ++iterator->current_index;
    } else {
        done = true;
        AWS_NAPI_ENSURE(env, napi_get_undefined(env, &node_value));
    }

    napi_value node_done = NULL;
    AWS_NAPI_ENSURE(env, napi_get_boolean(env, done, &node_done));

    napi_value result = NULL;
    AWS_NAPI_ENSURE(env, napi_create_object(env, &result));
    AWS_NAPI_ENSURE(env, napi_set_named_property(env, result, "done", node_done));
    AWS_NAPI_ENSURE(env, napi_set_named_property(env, result, "value", node_value));

    return result;
}
