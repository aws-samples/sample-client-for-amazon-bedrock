/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Library-specific error extension type
 *
 * @packageDocumentation
 * @module error
 * @mergeTarget
 */

import {ICrtError} from "../common/error";

export {ICrtError} from "../common/error";

/**
 * Represents an error thrown by the CRT browser shim
 *
 * @category System
 */
export class CrtError extends Error implements ICrtError {

    readonly error_name?: string;

    /**
     * @param error - The original error, provided for context. Could be any type, often from underlying libraries
     */
    constructor(readonly error: any) {
        super(error.toString());

        this.error_name = error.toString();
    }
}
