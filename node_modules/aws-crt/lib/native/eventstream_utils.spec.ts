/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as eventstream_utils from './eventstream_utils';

jest.setTimeout(10000);
function checkRoundTrip(value: bigint) {
    let encoded : Uint8Array = eventstream_utils.marshalInt64BigintAsBuffer(value);

    expect(eventstream_utils.unmarshalInt64BigintFromBuffer(encoded.buffer)).toEqual(value);
}
test('Eventstream int64 support success - marshal round trip', async () => {
    checkRoundTrip(BigInt(-1));
    checkRoundTrip(BigInt(0));
    checkRoundTrip(BigInt(65535));
    checkRoundTrip(BigInt(-123456789));
    checkRoundTrip(BigInt(987654321));
});

function doFailedRoundTrip(value: bigint) {
    let encoded : Uint8Array = eventstream_utils.marshalInt64BigintAsBuffer(value);

    eventstream_utils.unmarshalInt64BigintFromBuffer(encoded.buffer);
}
test('Eventstream int64 support failure - marshal round trip', async () => {
    expect(() => {doFailedRoundTrip(BigInt("9223372036854775808"));}).toThrow();
    expect(() => {doFailedRoundTrip(BigInt("-9223372036854775809"));}).toThrow();
    expect(() => {doFailedRoundTrip(BigInt("923456456456634547758085345"));}).toThrow();
});