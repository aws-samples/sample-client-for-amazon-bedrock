#ifndef AWS_CRT_NODEJS_IO_H
#define AWS_CRT_NODEJS_IO_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

#include <aws/io/channel_bootstrap.h>
#include <aws/io/host_resolver.h>

struct client_bootstrap_binding;

AWS_EXTERN_C_BEGIN

/**
 * Returns the string associated with the error code.
 */
napi_value aws_napi_error_code_to_string(napi_env env, napi_callback_info info);

/**
 * Returns the identifier/name associated with the error code.
 */
napi_value aws_napi_error_code_to_name(napi_env env, napi_callback_info info);

/**
 * Returns true if ALPN is available, false if it is not.
 */
napi_value aws_napi_is_alpn_available(napi_env env, napi_callback_info info);

/**
 * Create a new aws_client_bootstrap to be managed by an napi_external.
 */
napi_value aws_napi_io_client_bootstrap_new(napi_env env, napi_callback_info info);

/* extracts the underlying aws_client_bootstrap from an opaque binding, usually found in a node external */
struct aws_client_bootstrap *aws_napi_get_client_bootstrap(struct client_bootstrap_binding *binding);

/**
 * Create a new aws_tls_ctx to be managed by a napi_external.
 */
napi_value aws_napi_io_tls_ctx_new(napi_env env, napi_callback_info info);

/**
 * Create a new aws_tls_connection_options to be managed by a napi_external
 */
napi_value aws_napi_io_tls_connection_options_new(napi_env env, napi_callback_info info);

/**
 * Create a new aws_socket_options to be managed by a napi_external
 */
napi_value aws_napi_io_socket_options_new(napi_env env, napi_callback_info info);

/**
 * Initialize CRT logging
 */
napi_value aws_napi_io_logging_enable(napi_env env, napi_callback_info info);

/**
 * Create an input stream
 */
napi_value aws_napi_io_input_stream_new(napi_env, napi_callback_info info);

/**
 * Append a Buffer to an input stream
 */
napi_value aws_napi_io_input_stream_append(napi_env env, napi_callback_info info);

/**
 * Create a new aws_pkcs11_lib to be managed by a napi_external
 */
napi_value aws_napi_io_pkcs11_lib_new(napi_env, napi_callback_info info);

/**
 * Release the aws_pkcs11_lib immediately, without waiting for the GC.
 */
napi_value aws_napi_io_pkcs11_lib_close(napi_env, napi_callback_info info);

AWS_EXTERN_C_END

#endif /* AWS_CRT_NODEJS_IO_H */
