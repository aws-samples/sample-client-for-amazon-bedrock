/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as io from './io';
import { Pkcs11Lib } from './io';
import { CrtError } from './error';
import {cRuntime, CRuntimeType} from "./binding";

const conditional_test = (condition: any) => condition ? it : it.skip;

test('Error Resolve', () => {
    const err = new CrtError(0);
    expect(err.error_code).toBe(0);
    expect(err.error_name).toBe('AWS_ERROR_SUCCESS');
    expect(err.message).toBe('aws-c-common: AWS_ERROR_SUCCESS, Success.');
});

test('ALPN availability', () => {
    expect(io.is_alpn_available()).toBeDefined();
});

const PKCS11_LIB_PATH = process.env.AWS_TEST_PKCS11_LIB ?? "";
/**
 * Skip test if cruntime is Musl. Softhsm library crashes on Alpine if we don't use AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE.
 * Supporting AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE on Node-js is not trivial due to non-deterministic cleanup.
 * TODO: Support AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE in tests
 */
const pkcs11_test = conditional_test(cRuntime !== CRuntimeType.MUSL && PKCS11_LIB_PATH)

pkcs11_test('Pkcs11Lib sanity check', () => {
    // sanity check that we can load and unload a PKCS#11 library
    new Pkcs11Lib(PKCS11_LIB_PATH);
});

pkcs11_test('Pkcs11Lib exception', () => {
    // check that initialization errors get thrown
    expect(() => {
        new Pkcs11Lib("obviously-invalid-path.so", Pkcs11Lib.InitializeFinalizeBehavior.STRICT);
    }).toThrow(/AWS_IO_SHARED_LIBRARY_LOAD_FAILURE/);
});

