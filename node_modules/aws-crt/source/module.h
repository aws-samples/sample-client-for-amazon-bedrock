#ifndef AWS_CRT_NODEJS_MODULE_H
#define AWS_CRT_NODEJS_MODULE_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include <aws/common/byte_buf.h>
#include <aws/common/logging.h>
#include <aws/common/string.h>

#define WIN32_LEAN_AND_MEAN

/* Suppress compiler warnings from node_api.h.
 * See: https://github.com/nodejs/node/pull/49103 */
#if defined(__clang__) || defined(__GNUC__)
#    pragma GCC diagnostic push
#    pragma GCC diagnostic ignored "-Wstrict-prototypes"
#endif

#define NAPI_VERSION 4
#include <node_api.h>

#if defined(__clang__) || defined(__GNUC__)
#    pragma GCC diagnostic pop
#endif

#define AWS_CRT_NODEJS_PACKAGE_ID 11

struct aws_client_bootstrap;
struct aws_event_loop;
struct aws_event_loop_group;

enum aws_crt_nodejs_errors {
    AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV = AWS_ERROR_ENUM_BEGIN_RANGE(AWS_CRT_NODEJS_PACKAGE_ID),
    AWS_CRT_NODEJS_ERROR_NAPI_FAILURE,
    AWS_CRT_NODEJS_ERROR_EVENT_STREAM_USER_CLOSE,

    AWS_CRT_NODEJS_ERROR_END_RANGE = AWS_ERROR_ENUM_END_RANGE(AWS_CRT_NODEJS_PACKAGE_ID)
};

enum aws_napi_log_subject {
    AWS_LS_NODEJS_CRT_GENERAL = AWS_LOG_SUBJECT_BEGIN_RANGE(AWS_CRT_NODEJS_PACKAGE_ID),

    AWS_LS_NODEJS_CRT_LAST = AWS_LOG_SUBJECT_END_RANGE(AWS_CRT_NODEJS_PACKAGE_ID),
};

/*
 * Helper functions for constructing JS objects.
 *
 * These create and attach properties of the associated JS type to an object.  For each type, two versions
 * exist - one version taking the parameter value directly, another taking a pointer making it optional.  In this
 * case, if the pointer is NULL, nothing is done.
 */
int aws_napi_attach_object_property_boolean(napi_value object, napi_env env, const char *key_name, bool value);

int aws_napi_attach_object_property_optional_boolean(
    napi_value object,
    napi_env env,
    const char *key_name,
    const bool *value);

int aws_napi_attach_object_property_u64(napi_value object, napi_env env, const char *key_name, uint64_t value);

int aws_napi_attach_object_property_optional_u64(
    napi_value object,
    napi_env env,
    const char *key_name,
    const uint64_t *value);

int aws_napi_attach_object_property_u32(napi_value object, napi_env env, const char *key_name, uint32_t value);

int aws_napi_attach_object_property_optional_u32(
    napi_value object,
    napi_env env,
    const char *key_name,
    const uint32_t *value);

int aws_napi_attach_object_property_i32(napi_value object, napi_env env, const char *key_name, int32_t value);

int aws_napi_attach_object_property_u16(napi_value object, napi_env env, const char *key_name, uint16_t value);

int aws_napi_attach_object_property_optional_u16(
    napi_value object,
    napi_env env,
    const char *key_name,
    const uint16_t *value);

int aws_napi_attach_object_property_string(
    napi_value object,
    napi_env env,
    const char *key_name,
    struct aws_byte_cursor value);

int aws_napi_attach_object_property_optional_string(
    napi_value object,
    napi_env env,
    const char *key_name,
    const struct aws_byte_cursor *value);

int aws_napi_attach_object_property_binary_as_finalizable_external(
    napi_value object,
    napi_env env,
    const char *key_name,
    struct aws_byte_buf *data_buffer);

/*
 * Helper functions for deconstructing JS objects into native data.
 */

enum aws_napi_get_named_property_result {
    AWS_NGNPR_VALID_VALUE,
    AWS_NGNPR_INVALID_VALUE,
    AWS_NGNPR_NO_VALUE,
};

/*
 * Gets the property on an object, if it exists, with the supplied name.  If 'type' is not napi_undefined, then
 * the type of the property must match the passed in value.
 */
enum aws_napi_get_named_property_result aws_napi_get_named_property(
    napi_env env,
    napi_value object,
    const char *name,
    napi_valuetype type,
    napi_value *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_boolean_as_uint8(
    napi_env env,
    napi_value object,
    const char *name,
    uint8_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_uint8(
    napi_env env,
    napi_value object,
    const char *name,
    uint8_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_int8(
    napi_env env,
    napi_value object,
    const char *name,
    int8_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_uint16(
    napi_env env,
    napi_value object,
    const char *name,
    uint16_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_int16(
    napi_env env,
    napi_value object,
    const char *name,
    int16_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_uint32(
    napi_env env,
    napi_value object,
    const char *name,
    uint32_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_int32(
    napi_env env,
    napi_value object,
    const char *name,
    int32_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_uint64(
    napi_env env,
    napi_value object,
    const char *name,
    uint64_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_int64(
    napi_env env,
    napi_value object,
    const char *name,
    int64_t *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_boolean(
    napi_env env,
    napi_value object,
    const char *name,
    bool *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_as_bytebuf(
    napi_env env,
    napi_value object,
    const char *name,
    napi_valuetype type,
    struct aws_byte_buf *result);

enum aws_napi_get_named_property_result aws_napi_get_named_property_buffer_length(
    napi_env env,
    napi_value object,
    const char *name,
    napi_valuetype type,
    size_t *length_out);

int aws_napi_get_property_array_size(
    napi_env env,
    napi_value object,
    const char *property_name,
    size_t *array_size_out);

napi_status aws_byte_buf_init_from_napi(struct aws_byte_buf *buf, napi_env env, napi_value node_str);
struct aws_string *aws_string_new_from_napi(napi_env env, napi_value node_str);
/** Copies data from cur into a new ArrayBuffer, then returns a DataView to the buffer. */
napi_status aws_napi_create_dataview_from_byte_cursor(
    napi_env env,
    const struct aws_byte_cursor *cur,
    napi_value *result);

bool aws_napi_is_null_or_undefined(napi_env env, napi_value value);

void aws_napi_throw_last_error(napi_env env);
void aws_napi_throw_last_error_with_context(napi_env env, const char *context);

struct uv_loop_s *aws_napi_get_node_uv_loop(void);
struct aws_event_loop *aws_napi_get_node_event_loop(void);
struct aws_event_loop_group *aws_napi_get_node_elg(void);
struct aws_client_bootstrap *aws_napi_get_default_client_bootstrap(void);

const char *aws_napi_status_to_str(napi_status status);

/*
 * Wrapper around napi_create_external_arraybuffer,
 * The function returns `napi_ok` if array buffer is created successfully in nodejs. Otherwise returns the error code.
 * The user is responsible to release/proceed the `external_data` if the creation failed.
 *
 * `aws_napi_create_external_arraybuffer` handles the creation of the arraybuffer from the `external_data`. As
 * some runtimes other than Node.js have dropped support for external buffers, the napi function call will fail in such
 * case. If the call failed, the function will directly create an arraybuffer in Node and copy the data of external
 * buffer into it. Once data copied, the `finalize_cb` will be immediately invoked to release the external data.
 *
 */
napi_status aws_napi_create_external_arraybuffer(
    napi_env env,
    void *external_data,
    size_t byte_length,
    napi_finalize finalize_cb,
    void *finalize_hint,
    napi_value *result);

/**
 * Gets the allocator used to allocate native resources in the node environment, should be used
 * by all binding code in this extension
 */
struct aws_allocator *aws_napi_get_allocator(void);

/**
 * Wrapper around napi_call_function that automatically substitutes undefined for a null this_ptr
 * and un-pins the function reference when the call completes. Also handles known recoverable
 * call failure cases before returning. Does not care about return value, since this is a non-blocking
 * call into node.
 *
 * @return napi_ok - call was successful
 *         napi_closing - function has been released, and is shutting down, execution is ok to continue though
 *         other napi_status values - unhandled, up to caller
 */
napi_status aws_napi_dispatch_threadsafe_function(
    napi_env env,
    napi_threadsafe_function tsfn,
    napi_value this_ptr,
    napi_value function,
    size_t argc,
    napi_value *argv);

/**
 * Wrapper around napi_create_threadsafe_function,
 * aws_napi_release_threadsafe_function needed to clean up the threadsafe function
 * Note: If you want to release a thread safe function from within that thread safe function's callback, call unref
 * instead, and the function will be finalized later by the environment.
 */
napi_status aws_napi_create_threadsafe_function(
    napi_env env,
    napi_value function,
    const char *name,
    napi_threadsafe_function_call_js call_js,
    void *context,
    napi_threadsafe_function *result);

/**
 * Wrapper around napi_acquire_threadsafe_function,
 * check the function before acquiring it.
 */
napi_status aws_napi_acquire_threadsafe_function(napi_threadsafe_function function);

/**
 * Wrapper around napi_release_threadsafe_function,
 * check the function before releasing it.
 */
napi_status aws_napi_release_threadsafe_function(
    napi_threadsafe_function function,
    napi_threadsafe_function_release_mode mode);

/**
 * Wrapper around napi_unref_threadsafe_function,
 * Incase release the threadsafe function from that function is needed, unref will let env go
 * and the function will be cleaned up as env clean itself up
 */
napi_status aws_napi_unref_threadsafe_function(napi_env env, napi_threadsafe_function function);

/**
 * Wrapper around napi_call_threadsafe_function that always queues (napi_tsfn_nonblocking)
 * and pins the function reference until the call completes
 */
napi_status aws_napi_queue_threadsafe_function(napi_threadsafe_function function, void *user_data);

/**
 * Disable the thread safe function operations. The function will prevent any access to threadsafe function
 * including acquire, release, function call and so on.
 */
napi_value aws_napi_disable_threadsafe_function(napi_env env, napi_callback_info info);

/*
 * One of these will be allocated each time the module init function is called
 * Any global state that isn't thread safe or requires clean up should be stored
 * on this so that it can be tracked and cleaned up
 */
struct aws_napi_context {
    napi_env env;
    struct aws_allocator *allocator;
    struct aws_napi_logger_ctx *logger;
};

#define _AWS_NAPI_ERROR_MSG(call, source) "N-API call failed: " call "\n    @ " source
#define _AWS_NAPI_PASTE(x) x
#define _AWS_NAPI_TOSTR(x) #x
#define _AWS_NAPI_TOSTRING(x) _AWS_NAPI_TOSTR(x)
#define _AWS_NAPI_SOURCE __FILE__ ":" _AWS_NAPI_TOSTRING(__LINE__)

#define AWS_NAPI_LOGF_ERROR(...)                                                                                       \
    do {                                                                                                               \
        fprintf(stderr, __VA_ARGS__);                                                                                  \
        fprintf(stderr, "\n");                                                                                         \
    } while (0)

#define AWS_NAPI_LOGF_FATAL(...)                                                                                       \
    do {                                                                                                               \
        fprintf(stderr, __VA_ARGS__);                                                                                  \
        fprintf(stderr, "\n");                                                                                         \
    } while (0)

/*
 * AWS_NAPI_CALL(env, napi_xxx(args...), { return NULL; }) will ensure that a failed result is logged as an error
 * immediately
 */
#define AWS_NAPI_CALL(env, call, on_fail)                                                                              \
    do {                                                                                                               \
        napi_status status = (call);                                                                                   \
        if (status != napi_ok) {                                                                                       \
            AWS_NAPI_LOGF_ERROR(                                                                                       \
                _AWS_NAPI_PASTE(_AWS_NAPI_ERROR_MSG(#call, _AWS_NAPI_SOURCE)) _AWS_NAPI_PASTE(": %s"),                 \
                aws_napi_status_to_str(status));                                                                       \
            on_fail;                                                                                                   \
        }                                                                                                              \
    } while (0)

/*
 * AWS_NAPI_ENSURE(env, napi_xxx(args...)) is for when logging is not available, or a failure should immediately
 * end the process. The file and line of the call will be reported.
 */
#define AWS_NAPI_ENSURE(env, call)                                                                                     \
    do {                                                                                                               \
        (void)env;                                                                                                     \
        napi_status status = (call);                                                                                   \
        if (status != napi_ok) {                                                                                       \
            AWS_NAPI_LOGF_FATAL(                                                                                       \
                _AWS_NAPI_PASTE(_AWS_NAPI_ERROR_MSG(#call, _AWS_NAPI_SOURCE)) _AWS_NAPI_PASTE(": %s"),                 \
                aws_napi_status_to_str(status));                                                                       \
            aws_fatal_assert(#call, __FILE__, __LINE__);                                                               \
        }                                                                                                              \
    } while (0)

#define AWS_CLEAN_THREADSAFE_FUNCTION(binding_name, function_name)                                                     \
    if (binding_name->function_name != NULL) {                                                                         \
        AWS_NAPI_ENSURE(NULL, aws_napi_release_threadsafe_function(binding_name->function_name, napi_tsfn_abort));     \
        binding_name->function_name = NULL;                                                                            \
    }

#endif /* AWS_CRT_NODEJS_MODULE_H */
