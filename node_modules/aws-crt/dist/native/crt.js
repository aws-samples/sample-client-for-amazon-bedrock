"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.native_memory_dump = exports.native_memory = void 0;
/**
 *
 * A module containing some miscellaneous crt native memory queries
 *
 * @packageDocumentation
 * @module crt
 * @mergeTarget
 */
/**
 * Memory reporting is controlled by the AWS_CRT_MEMORY_TRACING environment
 * variable. Possible values are:
 * * 0 - No tracing
 * * 1 - Track active memory usage. Incurs a small performance penalty.
 * * 2 - Track active memory usage, and also track callstacks for every allocation.
 *   This incurs a performance penalty, depending on the cost of the platform's
 *   stack unwinding/backtrace API.
 * @category System
 */
const binding_1 = __importDefault(require("./binding"));
/**
 * If the ```AWS_CRT_MEMORY_TRACING``` is environment variable is set to 1 or 2,
 * will return the native memory usage in bytes. Otherwise, returns 0.
 * @returns The total allocated native memory, in bytes.
 *
 * @category System
 */
function native_memory() {
    return binding_1.default.native_memory();
}
exports.native_memory = native_memory;
/**
 * Dumps outstanding native memory allocations. If the ```AWS_CRT_MEMORY_TRACING```
 * environment variable is set to 1 or 2, will dump all active native memory to
 * the console log.
 *
 * @category System
 */
function native_memory_dump() {
    return binding_1.default.native_memory_dump();
}
exports.native_memory_dump = native_memory_dump;
//# sourceMappingURL=crt.js.map