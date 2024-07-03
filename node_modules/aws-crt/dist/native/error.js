"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrtError = void 0;
/**
 * Library-specific error extension type
 *
 * @packageDocumentation
 * @module error
 * @mergeTarget
 */
const binding_1 = __importDefault(require("./binding"));
/**
 * Represents an error encountered in native code. Can also be used to convert a numeric error code into
 * a human-readable string.
 *
 * @category System
 */
class CrtError extends Error {
    /** @var error - The original error. Most often an error_code, but possibly some other context */
    constructor(error) {
        super(extract_message(error));
        this.error = error;
        this.error_code = extract_code(error);
        this.error_name = extract_name(error);
    }
}
exports.CrtError = CrtError;
function extract_message(error) {
    if (typeof error === 'number') {
        return binding_1.default.error_code_to_string(error);
    }
    else if (error instanceof CrtError) {
        return error.message;
    }
    return error.toString();
}
function extract_code(error) {
    if (typeof error === 'number') {
        return error;
    }
    else if (error instanceof CrtError) {
        return error.error_code;
    }
    return undefined;
}
function extract_name(error) {
    if (typeof error === 'number') {
        return binding_1.default.error_code_to_name(error);
    }
    else if (error instanceof CrtError) {
        return error.error_name;
    }
    return undefined;
}
//# sourceMappingURL=error.js.map