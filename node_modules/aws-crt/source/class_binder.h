#ifndef AWS_CRT_NODEJS_CLASS_BINDER_H
#define AWS_CRT_NODEJS_CLASS_BINDER_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

/* Increment this as you find functions that require more arguments */
#define AWS_NAPI_METHOD_MAX_ARGS 9

/**
 * Expected to be stored statically, but is for internal usage only.
 */
struct aws_napi_class_info {
    uint8_t filler[40];
};

/**
 * Passed as a parameter to functions accepting arguments.
 */
struct aws_napi_argument {
    napi_value node;
    napi_valuetype type;
    union {
        bool boolean;
        int64_t number;
        struct aws_byte_buf string;
        void *external;
    } native;
};

/**
 * Passed to methods
 */
struct aws_napi_callback_info {
    napi_value node_this;
    void *native_this;
    const struct aws_napi_argument *arguments;
    size_t num_args;
};

/***********************************************************************************************************************
 * Properties
 **********************************************************************************************************************/
typedef napi_value(aws_napi_property_get_fn)(napi_env env, void *native_this);
typedef void(aws_napi_property_set_fn)(napi_env env, void *native_this, const struct aws_napi_argument *value);

struct aws_napi_property_info {
    const char *name;
    const char *symbol;
    napi_valuetype type;

    aws_napi_property_get_fn *getter;
    aws_napi_property_set_fn *setter;

    napi_property_attributes attributes;
};

/***********************************************************************************************************************
 * Methods
 **********************************************************************************************************************/
typedef napi_value(aws_napi_method_fn)(napi_env env, const struct aws_napi_callback_info *cb_info);

struct aws_napi_method_info {
    const char *name;
    const char *symbol;
    aws_napi_method_fn *method;

    size_t num_arguments; /* Number of *REQUIRED* arguments. 0 -> AWS_NAPI_METHOD_MAX_ARGS */
    napi_valuetype arg_types[AWS_NAPI_METHOD_MAX_ARGS];

    napi_property_attributes attributes;
};

/***********************************************************************************************************************
 * API
 **********************************************************************************************************************/

bool aws_napi_method_next_argument(
    napi_valuetype expected_type,
    const struct aws_napi_callback_info *cb_info,
    const struct aws_napi_argument **next_arg);

napi_status aws_napi_define_class(
    napi_env env,
    napi_value exports,
    const struct aws_napi_method_info *constructor,
    const struct aws_napi_property_info *properties,
    size_t num_properties,
    const struct aws_napi_method_info *methods,
    size_t num_methods,
    struct aws_napi_class_info *class_info);

/* The constructor comes from class info will wrap the native object.
 * Thus, the finalizer will be invoked with native as
 * the finalize_data and class_info as the finalize_hint */
napi_status aws_napi_wrap(
    napi_env env,
    struct aws_napi_class_info *class_info,
    void *native,
    napi_finalize finalizer,
    napi_value *result);

napi_status aws_napi_define_function(napi_env env, napi_value exports, struct aws_napi_method_info *method);

#endif /* AWS_CRT_NODEJS_CLASS_BINDER_H */
