#ifndef AWS_CRT_NODEJS_LOGGER_H
#define AWS_CRT_NODEJS_LOGGER_H
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "module.h"

struct aws_napi_logger_ctx;

/**
 * Gets the logger instance. There is only 1 per process, in accordance with how logging
 * works within the CRT. However, there is 1 context per invocation of the module init
 * function. In node versions < 12, this is always 1. In 12 and above, there can be worker
 * threads which initialize all modules into their memory space on creation.
 * Calls across env threads will not succeed, so for logging calls from within the node worker
 * threads, they must use logging callbacks bound to their env/thread.
 * Event loop threads, on the other hand, queue their logging against the main thread.
 * This is not ideal, but node closes and re-opens stderr and stdout the first time
 * console.log is called, so our logging gets broken. Can't beat 'em, have to join 'em.
 */
struct aws_logger *aws_napi_logger_get(void);

struct aws_napi_logger_ctx *aws_napi_logger_new(struct aws_allocator *allocator, napi_env env);
void aws_napi_logger_destroy(struct aws_napi_logger_ctx *logger);
void aws_napi_logger_set_level(enum aws_log_level level);

#endif /* AWS_CRT_NODEJS_LOGGER_H */
