/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
#include "http_message.h"

#include "class_binder.h"
#include "http_headers.h"

#include <aws/http/request_response.h>

static struct aws_napi_class_info s_request_class_info;

static aws_napi_method_fn s_request_constructor;

static aws_napi_property_get_fn s_request_method_get;
static aws_napi_property_set_fn s_request_method_set;
static aws_napi_property_get_fn s_request_path_get;
static aws_napi_property_set_fn s_request_path_set;
static aws_napi_property_get_fn s_request_headers_get;
static aws_napi_property_set_fn s_request_body_set;

napi_status aws_napi_http_message_bind(napi_env env, napi_value exports) {

    static const struct aws_napi_method_info s_request_constructor_info = {
        .name = "HttpRequest",
        .method = s_request_constructor,
        .num_arguments = 2,
        .arg_types = {napi_string, napi_string, napi_object, napi_external},
    };

    static const struct aws_napi_property_info s_request_properties[] = {
        {
            .name = "method",
            .type = napi_string,
            .getter = s_request_method_get,
            .setter = s_request_method_set,
            .attributes = napi_enumerable | napi_writable,
        },
        {
            .name = "path",
            .type = napi_string,
            .getter = s_request_path_get,
            .setter = s_request_path_set,
            .attributes = napi_enumerable | napi_writable,
        },
        {
            .name = "headers",
            .type = napi_object,
            .getter = s_request_headers_get,
            .attributes = napi_enumerable,
        },
        {
            .name = "body",
            .setter = s_request_body_set,
            .attributes = napi_enumerable | napi_writable,
        },
    };

    AWS_NAPI_CALL(
        env,
        aws_napi_define_class(
            env,
            exports,
            &s_request_constructor_info,
            s_request_properties,
            AWS_ARRAY_SIZE(s_request_properties),
            NULL,
            0,
            &s_request_class_info),
        { return status; });

    return napi_ok;
}

/***********************************************************************************************************************
 * Request
 **********************************************************************************************************************/

struct http_request_binding {
    struct aws_http_message *native;
    struct aws_allocator *allocator;

    napi_ref node_headers;
};

/* Need a special finalizer to avoid releasing a request object we don't own */
static void s_napi_wrapped_http_request_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;

    struct http_request_binding *binding = finalize_data;
    struct aws_allocator *allocator = binding->allocator;

    aws_mem_release(allocator, binding);
}

napi_status aws_napi_http_message_wrap(napi_env env, struct aws_http_message *message, napi_value *result) {

    struct http_request_binding *binding =
        aws_mem_calloc(aws_napi_get_allocator(), 1, sizeof(struct http_request_binding));
    binding->native = message;
    binding->allocator = aws_napi_get_allocator();
    return aws_napi_wrap(env, &s_request_class_info, binding, s_napi_wrapped_http_request_finalize, result);
}

struct aws_http_message *aws_napi_http_message_unwrap(napi_env env, napi_value js_object) {

    struct http_request_binding *binding = NULL;
    AWS_NAPI_CALL(env, napi_unwrap(env, js_object, (void **)&binding), { return NULL; });
    return binding->native;
}

/***********************************************************************************************************************
 * Constructor
 **********************************************************************************************************************/

static void s_napi_http_request_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;

    struct http_request_binding *binding = finalize_data;
    struct aws_allocator *allocator = finalize_hint;

    if (binding->node_headers != NULL) {
        napi_delete_reference(env, binding->node_headers);
    }

    aws_http_message_destroy(binding->native);
    aws_mem_release(allocator, binding);
}

static napi_value s_request_constructor(napi_env env, const struct aws_napi_callback_info *cb_info) {

    struct aws_allocator *alloc = aws_napi_get_allocator();
    struct http_request_binding *binding = aws_mem_calloc(alloc, 1, sizeof(struct http_request_binding));
    if (!binding) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }
    const struct aws_napi_argument *arg = NULL;

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    struct aws_byte_cursor method_cur = aws_byte_cursor_from_buf(&arg->native.string);

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    struct aws_byte_cursor path_cur = aws_byte_cursor_from_buf(&arg->native.string);

    if (aws_napi_method_next_argument(napi_object, cb_info, &arg)) {
        AWS_NAPI_ENSURE(env, napi_create_reference(env, arg->node, 1, &binding->node_headers));

        struct aws_http_headers *headers = aws_napi_http_headers_unwrap(env, arg->node);
        binding->native = aws_http_message_new_request_with_headers(alloc, headers);
        aws_http_headers_release(headers); /* the message retains a reference */
    } else {
        binding->native = aws_http_message_new_request(alloc);
    }

    if (!binding->native) {
        aws_napi_throw_last_error(env);
        goto cleanup;
    }
    aws_http_message_set_request_method(binding->native, method_cur);
    aws_http_message_set_request_path(binding->native, path_cur);

    if (aws_napi_method_next_argument(napi_external, cb_info, &arg)) {
        aws_http_message_set_body_stream(binding->native, arg->native.external);
    }

    napi_value node_this = cb_info->native_this;
    AWS_NAPI_CALL(env, napi_wrap(env, node_this, binding, s_napi_http_request_finalize, alloc, NULL), {
        napi_throw_error(env, NULL, "Failed to wrap HttpRequest");
        goto cleanup;
    });

    return node_this;

cleanup:
    if (binding) {
        if (binding->native) {
            aws_http_message_destroy(binding->native);
        }
        aws_mem_release(alloc, binding);
    }
    return NULL;
}

/***********************************************************************************************************************
 * Properties
 **********************************************************************************************************************/

static napi_value s_request_method_get(napi_env env, void *native_this) {

    struct http_request_binding *binding = native_this;

    struct aws_byte_cursor result_cur;
    aws_http_message_get_request_method(binding->native, &result_cur);

    napi_value result = NULL;
    AWS_NAPI_CALL(
        env, napi_create_string_utf8(env, (const char *)result_cur.ptr, result_cur.len, &result), { return NULL; });

    return result;
}

static void s_request_method_set(napi_env env, void *native_this, const struct aws_napi_argument *value) {
    (void)env;

    struct http_request_binding *binding = native_this;

    aws_http_message_set_request_method(binding->native, aws_byte_cursor_from_buf(&value->native.string));
}

static napi_value s_request_path_get(napi_env env, void *native_this) {

    struct http_request_binding *binding = native_this;

    struct aws_byte_cursor result_cur;
    aws_http_message_get_request_path(binding->native, &result_cur);

    napi_value result = NULL;
    AWS_NAPI_CALL(
        env, napi_create_string_utf8(env, (const char *)result_cur.ptr, result_cur.len, &result), { return NULL; });

    return result;
}

static void s_request_path_set(napi_env env, void *native_this, const struct aws_napi_argument *value) {
    (void)env;

    struct http_request_binding *binding = native_this;

    aws_http_message_set_request_path(binding->native, aws_byte_cursor_from_buf(&value->native.string));
}

static napi_value s_request_headers_get(napi_env env, void *native_this) {

    struct http_request_binding *binding = native_this;

    napi_value result = NULL;
    if (binding->node_headers) {
        AWS_NAPI_ENSURE(env, napi_get_reference_value(env, binding->node_headers, &result));
    } else {
        struct aws_http_headers *headers = aws_http_message_get_headers(binding->native);
        AWS_NAPI_ENSURE(env, aws_napi_http_headers_wrap(env, headers, &result));
    }

    /* Store the value for later */
    AWS_NAPI_ENSURE(env, napi_create_reference(env, result, 1, &binding->node_headers));

    return result;
}

static void s_request_body_set(napi_env env, void *native_this, const struct aws_napi_argument *value) {
    (void)env;

    struct http_request_binding *binding = native_this;

    aws_http_message_set_body_stream(binding->native, value->native.external);
}
