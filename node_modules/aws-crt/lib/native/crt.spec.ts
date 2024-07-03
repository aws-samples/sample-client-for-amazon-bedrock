/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

// Force memory tracing on for this suite
// Make sure env "AWS_SDK_MEMORY_TRACING=2"

import * as crt from './crt';

test('Native Memory', () => {
    let tracingLevel = 0;
    try {
        tracingLevel = parseInt(process.env['AWS_CRT_MEMORY_TRACING'] as string);
    } catch (err) { }
    if (tracingLevel > 0) {
        expect(crt.native_memory()).toBeGreaterThan(0);
    }
});

