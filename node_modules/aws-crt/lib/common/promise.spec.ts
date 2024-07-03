/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as promise from "./promise";

jest.setTimeout(10000);

test('Lifted promise - resolve', async () => {
    let liftedPromise : promise.LiftedPromise<void> = promise.newLiftedPromise<void>();

    setImmediate(() => { liftedPromise.resolve();});

    await liftedPromise.promise;
});

test('Lifted promise - reject', async () => {
    let liftedPromise : promise.LiftedPromise<void> = promise.newLiftedPromise<void>();

    setImmediate(() => { liftedPromise.reject("Fail");});

    await expect(liftedPromise.promise).rejects.toMatch("Fail");
});

test('Lifted promise - body function execution', async () => {
    let liftedPromise : promise.LiftedPromise<void> = promise.newLiftedPromise<void>((resolve, reject) => {
        resolve();
    });

    await liftedPromise.promise;
});