/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "class_binder.h"

#ifdef _MSC_VER
#    pragma warning(disable : 4204)
#endif /* _MSC_VER */

struct aws_napi_class_info_impl {
    const struct aws_napi_method_info *ctor_method;

    napi_ref constructor;

    struct {
        void *instance;
        napi_finalize finalizer;
        bool is_wrapping;
    } wrapping;
};

/* Make sure our static storage is big enough */
AWS_STATIC_ASSERT(sizeof(struct aws_napi_class_info) >= sizeof(struct aws_napi_class_info_impl));

/*
 * Populates an aws_napi_argument object from a napi value.
 *
 * \param env               The node environment.
 * \param value             The value to pull the value from.
 * \param expected_type     The type you expect the value to be. Pass napi_undefined to accept anything.
 * \param accept_undefined  Whether or not to accept expected_type OR undefined
 * \param out_value         The argument object to populate.
 */
static napi_status s_argument_parse(
    napi_env env,
    napi_value value,
    napi_valuetype expected_type,
    bool accept_undefined,
    struct aws_napi_argument *out_value) {

    out_value->node = value;
    AWS_NAPI_CALL(env, napi_typeof(env, value, &out_value->type), { return status; });

    if (expected_type != napi_undefined && out_value->type != expected_type &&
        !(accept_undefined && out_value->type == napi_undefined)) {
        switch (expected_type) {
            case napi_string:
                napi_throw_type_error(env, NULL, "Class binder argument expected a string");
                return napi_string_expected;

            case napi_number:
                napi_throw_type_error(env, NULL, "Class binder argument expected a number");
                return napi_number_expected;

            default:
                napi_throw_type_error(env, NULL, "Class binder argument wrong type");
                return napi_generic_failure;
        }
    }

    switch (out_value->type) {
        case napi_boolean: {
            AWS_NAPI_CALL(env, napi_get_value_bool(env, value, &out_value->native.boolean), { return status; });

            break;
        }

        case napi_string: {
            AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&out_value->native.string, env, value), { return status; });

            break;
        }

        case napi_number: {
            AWS_NAPI_CALL(env, napi_get_value_int64(env, value, &out_value->native.number), {
                napi_throw_type_error(env, NULL, "Class binder argument expected a number");
                return status;
            });

            break;
        }

        case napi_external: {
            AWS_NAPI_CALL(env, napi_get_value_external(env, value, &out_value->native.external), {
                napi_throw_type_error(env, NULL, "Class binder argument expected an external");
                return status;
            });

            break;
        }

        case napi_object: {
            /* Attempt to unwrap the object, just in case */
            napi_status result = napi_unwrap(env, value, &out_value->native.external);
            if (result != napi_ok) {
                out_value->native.external = NULL;
            }

            break;
        }

        default:
            /* Don't process, just leave as node value */
            break;
    }

    return napi_ok;
}

/*
 * Cleans up an aws_napi_argument object populated by s_argument_parse.
 *
 * \param env           The node environment.
 * \param value         The value to clean up.
 */
static void s_argument_cleanup(napi_env env, struct aws_napi_argument *value) {
    (void)env;

    switch (value->type) {
        case napi_string:
            aws_byte_buf_clean_up(&value->native.string);
            break;

        default:
            break;
    }
}

/*
 * Used as the class's constructor
 */
static napi_value s_constructor(napi_env env, napi_callback_info info) {

    napi_value node_args[AWS_NAPI_METHOD_MAX_ARGS];
    napi_value node_this = NULL;
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    struct aws_napi_class_info_impl *class_info = NULL;
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, &node_this, (void **)&class_info), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args > AWS_NAPI_METHOD_MAX_ARGS) {
        num_args = AWS_NAPI_METHOD_MAX_ARGS;
    }

    napi_value result = NULL;

    /* Check if we're wrapping an existing object or creating a new one */
    if (class_info->wrapping.is_wrapping) {
        AWS_FATAL_ASSERT(num_args == 0);

        AWS_NAPI_CALL(
            env,
            napi_wrap(env, node_this, class_info->wrapping.instance, class_info->wrapping.finalizer, class_info, NULL),
            {
                napi_throw_error(env, NULL, "Failed to wrap http_request");
                return NULL;
            });

    } else {
        const struct aws_napi_method_info *method = class_info->ctor_method;

        /* If there is no ctor method, don't both doing anything more, just return the empty object */
        if (method->method) {
            struct aws_napi_argument args[AWS_NAPI_METHOD_MAX_ARGS];
            AWS_ZERO_ARRAY(args);

            if (num_args < method->num_arguments) {
                napi_throw_error(env, NULL, "Class binder constructor given incorrect number of arguments");
                return NULL;
            }

            for (size_t i = 0; i < num_args; ++i) {
                if (s_argument_parse(env, node_args[i], method->arg_types[i], i >= method->num_arguments, &args[i])) {
                    goto cleanup_arguments;
                }
            }

            struct aws_napi_callback_info cb_info = {
                .node_this = node_this,
                .native_this = node_this,
                .num_args = num_args,
            };
            cb_info.arguments = args;

            method->method(env, &cb_info);

        cleanup_arguments:
            for (size_t i = 0; i < method->num_arguments; ++i) {
                s_argument_cleanup(env, &args[i]);
            }
        }
    }

    return result;
}

/*
 * Callback used to return the value of a property. Expects 0 arguments.
 */
static napi_value s_property_getter(napi_env env, napi_callback_info info) {

    void *native_this = NULL;

    napi_value node_this = NULL;
    size_t num_args = 0;
    void *data = NULL;
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, NULL, &node_this, &data), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != 0) {
        napi_throw_error(env, NULL, "Class binder getter needs exactly 0 arguments");
        return NULL;
    }

    AWS_NAPI_CALL(env, napi_unwrap(env, node_this, &native_this), {
        napi_throw_error(env, NULL, "Class binder property getter must be called on a wrapped object");
        return NULL;
    });

    const struct aws_napi_property_info *property = data;

    if (!property->getter) {
        napi_throw_error(env, NULL, "Property is not readable");
        return NULL;
    }

    napi_value result = property->getter(env, native_this);

#if DEBUG_BUILD
    /* In debug builds, validate that getters are returning the correct type */
    napi_valuetype result_type = napi_undefined;
    AWS_NAPI_CALL(env, napi_typeof(env, result, &result_type), { return NULL; });
    AWS_FATAL_ASSERT(property->type == napi_undefined || property->type == result_type);
#endif

    return result;
}

/*
 * Callback used to set the value of a property. Expects 1 argument.
 */
static napi_value s_property_setter(napi_env env, napi_callback_info info) {

    void *native_this = NULL;

    napi_value node_this = NULL;
    napi_value node_value;
    size_t num_args = 1;
    void *data = NULL;
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, &node_value, &node_this, &data), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args != 1) {
        napi_throw_error(env, NULL, "Class binder setter needs exactly 1 arguments");
        return NULL;
    }

    AWS_NAPI_CALL(env, napi_unwrap(env, node_this, &native_this), {
        napi_throw_error(env, NULL, "Class binder setter must be called on instance of a wrapped object");
        return NULL;
    });

    const struct aws_napi_property_info *property = data;

    if (!property->setter) {
        napi_throw_error(env, NULL, "Property is not writable");
        return NULL;
    }

    struct aws_napi_argument new_value;
    if (s_argument_parse(env, node_value, property->type, false, &new_value)) {
        return NULL;
    }

    property->setter(env, native_this, &new_value);

    s_argument_cleanup(env, &new_value);

    return NULL;
}

/*
 * Callback used to call a method on a bound object.
 */
static napi_value s_method_call(napi_env env, napi_callback_info info) {

    void *native_this = NULL;
    struct aws_napi_argument args[AWS_NAPI_METHOD_MAX_ARGS];
    AWS_ZERO_ARRAY(args);

    napi_value node_this = NULL;
    napi_value node_args[AWS_NAPI_METHOD_MAX_ARGS];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    void *data = NULL;
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, &node_this, &data), {
        napi_throw_error(env, NULL, "Failed to retreive callback information");
        return NULL;
    });
    if (num_args > AWS_NAPI_METHOD_MAX_ARGS) {
        num_args = AWS_NAPI_METHOD_MAX_ARGS;
    }

    struct aws_napi_method_info *method = data;
    if (num_args < method->num_arguments) {
        napi_throw_error(env, NULL, "Bound class's method requires more arguments");
        return NULL;
    }

    if ((method->attributes & napi_static) == 0) {
        AWS_NAPI_CALL(env, napi_unwrap(env, node_this, &native_this), {
            napi_throw_error(env, NULL, "Bound class's method must be called on instance of the class");
            return NULL;
        });
    }

    napi_value result = NULL;

    for (size_t i = 0; i < num_args; ++i) {
        if (s_argument_parse(env, node_args[i], method->arg_types[i], i >= method->num_arguments, &args[i])) {
            goto cleanup_arguments;
        }
    }

    struct aws_napi_callback_info cb_info = {
        .node_this = node_this,
        .native_this = native_this,
        .num_args = num_args,
    };
    cb_info.arguments = args;

    result = method->method(env, &cb_info);

cleanup_arguments:
    for (size_t i = 0; i < num_args; ++i) {
        s_argument_cleanup(env, &args[i]);
    }
    return result;
}

bool aws_napi_method_next_argument(
    napi_valuetype expected_type,
    const struct aws_napi_callback_info *cb_info,
    const struct aws_napi_argument **next_arg) {

    if (!*next_arg) {
        *next_arg = cb_info->arguments;
    } else {
        (*next_arg)++;
    }

    const size_t current_index = (*next_arg) - cb_info->arguments;
    return current_index <= cb_info->num_args &&
           ((expected_type == napi_undefined && (*next_arg)->type != napi_undefined) ||
            (expected_type == (*next_arg)->type));
}

static napi_status s_get_symbol(napi_env env, const char *symbol_name, napi_value *result) {
    napi_value global = NULL;
    AWS_NAPI_CALL(env, napi_get_global(env, &global), { return status; });

    napi_value symbol = NULL;
    AWS_NAPI_CALL(env, napi_get_named_property(env, global, "Symbol", &symbol), { return status; });
    AWS_NAPI_CALL(env, napi_get_named_property(env, symbol, symbol_name, result), { return status; });

    return napi_ok;
}

napi_status aws_napi_define_class(
    napi_env env,
    napi_value exports,
    const struct aws_napi_method_info *constructor,
    const struct aws_napi_property_info *properties,
    size_t num_properties,
    const struct aws_napi_method_info *methods,
    size_t num_methods,
    struct aws_napi_class_info *class_info) {

    AWS_FATAL_ASSERT(constructor->name);
    AWS_FATAL_ASSERT(constructor->attributes == napi_default);

    struct aws_napi_class_info_impl *impl = (struct aws_napi_class_info_impl *)class_info;
    impl->ctor_method = constructor;

    struct aws_allocator *allocator = aws_napi_get_allocator();

    const size_t num_descriptors = num_properties + num_methods;
    napi_property_descriptor *descriptors =
        aws_mem_calloc(allocator, num_descriptors, sizeof(napi_property_descriptor));

    size_t desc_i = 0;

    for (size_t prop_i = 0; prop_i < num_properties; ++prop_i) {
        napi_property_descriptor *desc = &descriptors[desc_i++];
        const struct aws_napi_property_info *property = &properties[prop_i];

        AWS_FATAL_ASSERT(property->name || property->symbol);
        AWS_FATAL_ASSERT(property->getter || property->setter);

        if (property->symbol) {
            AWS_NAPI_CALL(env, s_get_symbol(env, property->symbol, &desc->name), { return status; });
        } else {
            desc->utf8name = property->name;
        }
        desc->data = (void *)property;
        desc->getter = s_property_getter;
        desc->setter = s_property_setter;
        desc->attributes = property->attributes;
    }

    for (size_t method_i = 0; method_i < num_methods; ++method_i) {
        napi_property_descriptor *desc = &descriptors[desc_i++];
        const struct aws_napi_method_info *method = &methods[method_i];

        AWS_FATAL_ASSERT(method->name || method->symbol);
        AWS_FATAL_ASSERT(method->method);

        if (method->symbol) {
            AWS_NAPI_CALL(env, s_get_symbol(env, method->symbol, &desc->name), { return status; });
        } else {
            desc->utf8name = method->name;
        }
        desc->data = (void *)method;
        desc->method = s_method_call;
        desc->attributes = method->attributes;
    }

    napi_value node_constructor = NULL;
    AWS_NAPI_CALL(
        env,
        napi_define_class(
            env,
            constructor->name,
            NAPI_AUTO_LENGTH,
            s_constructor,
            class_info,
            num_descriptors,
            descriptors,
            &node_constructor),
        { return status; });

    /* Don't need descriptors anymore */
    aws_mem_release(allocator, descriptors);

    /* Reference the constructor for later user */
    AWS_NAPI_CALL(env, napi_create_reference(env, node_constructor, 1, &impl->constructor), { return status; });

    AWS_NAPI_CALL(env, napi_set_named_property(env, exports, constructor->name, node_constructor), { return status; });

    return napi_ok;
}

napi_status aws_napi_wrap(
    napi_env env,
    struct aws_napi_class_info *class_info,
    void *native,
    napi_finalize finalizer,
    napi_value *result) {

    struct aws_napi_class_info_impl *impl = (struct aws_napi_class_info_impl *)class_info;

    /* Retrieve the constructor */
    napi_value constructor = NULL;
    AWS_NAPI_CALL(env, napi_get_reference_value(env, impl->constructor, &constructor), {
        napi_throw_error(env, NULL, "Failed to dereference constructor value");
        return status;
    });

    /* Set our handy-dandy global state */
    impl->wrapping.is_wrapping = true;
    impl->wrapping.instance = native;
    impl->wrapping.finalizer = finalizer;
    AWS_NAPI_CALL(env, napi_new_instance(env, constructor, 0, NULL, result), {
        napi_throw_error(env, NULL, "Failed to construct class-bound object");
        return status;
    });
    AWS_ZERO_STRUCT(impl->wrapping);

    /* The constructor function will have called napi_wrap onto result */

    return napi_ok;
}

napi_status aws_napi_define_function(napi_env env, napi_value exports, struct aws_napi_method_info *method) {

    /* Set static attribute so that s_method_call doesn't try to unwrap the this object */
    method->attributes = napi_static;

    /* Create the function object */
    napi_value node_function = NULL;
    AWS_NAPI_CALL(
        env, napi_create_function(env, method->name, NAPI_AUTO_LENGTH, s_method_call, method, &node_function), {
            return status;
        });

    /* Initialize the name from the symbol if necessary, otherwise use the utf8 name */
    napi_value node_name = NULL;
    if (method->symbol) {
        AWS_NAPI_CALL(env, s_get_symbol(env, method->symbol, &node_name), { return status; });
    } else {
        AWS_NAPI_CALL(
            env, napi_create_string_utf8(env, method->name, NAPI_AUTO_LENGTH, &node_name), { return status; });
    }

    /* Export the function */
    AWS_NAPI_CALL(env, napi_set_property(env, exports, node_name, node_function), { return status; });

    return napi_ok;
}
