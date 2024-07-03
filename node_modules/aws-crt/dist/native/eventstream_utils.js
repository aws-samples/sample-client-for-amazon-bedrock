"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmarshalInt64BigintFromBuffer = exports.marshalInt64BigintAsBuffer = exports.MIN_INT64 = exports.MAX_INT64 = exports.MIN_INT32 = exports.MAX_INT32 = exports.MIN_INT16 = exports.MAX_INT16 = exports.MIN_INT8 = exports.MAX_INT8 = void 0;
const error_1 = require("./error");
/*
* Limits for header value validation
*/
exports.MAX_INT8 = 127;
exports.MIN_INT8 = -128;
exports.MAX_INT16 = 32767;
exports.MIN_INT16 = -32768;
exports.MAX_INT32 = 2147483647;
exports.MIN_INT32 = -2147483648;
exports.MAX_INT64 = BigInt("9223372036854775807");
exports.MIN_INT64 = BigInt("-9223372036854775808");
const MAX_UINT8_AS_BIGINT = BigInt("256");
/** @internal */
function marshalInt64BigintAsBuffer(value) {
    if (value < exports.MIN_INT64 || value > exports.MAX_INT64) {
        throw new error_1.CrtError("marshalInt64BigintAsBuffer expects a value that can fit in 8 bytes");
    }
    let buffer = new Uint8Array(8);
    /* encode the integer as a twos-complement byte sequence */
    if (value < 0) {
        value = -value - BigInt(1);
        for (let i = 0; i < 8; ++i) {
            buffer[i] = 255 - Number(value % MAX_UINT8_AS_BIGINT);
            value /= MAX_UINT8_AS_BIGINT;
        }
    }
    else {
        for (let i = 0; i < 8; ++i) {
            buffer[i] = Number(value % MAX_UINT8_AS_BIGINT);
            value /= MAX_UINT8_AS_BIGINT;
        }
    }
    return buffer;
}
exports.marshalInt64BigintAsBuffer = marshalInt64BigintAsBuffer;
/** @internal */
function unmarshalInt64BigintFromBuffer(buffer) {
    let value = BigInt(0);
    let byteView = new Uint8Array(buffer);
    if (byteView.length != 8) {
        throw new error_1.CrtError("unmarshalInt64BigintFromBuffer expects a byte buffer of length 8");
    }
    let shift = BigInt(1);
    let isNegative = (byteView[7] & 0x80) != 0;
    /* encoding is two's-complement, so treat negative and non-negative differently */
    if (isNegative) {
        for (let i = 0; i < byteView.length; ++i) {
            let byteValue = BigInt(255 - byteView[i]);
            value += (byteValue * shift);
            shift *= MAX_UINT8_AS_BIGINT;
        }
        value += BigInt(1);
        value = -value;
    }
    else {
        for (let i = 0; i < byteView.length; ++i) {
            let byteValue = BigInt(byteView[i]);
            value += (byteValue * shift);
            shift *= MAX_UINT8_AS_BIGINT;
        }
    }
    return value;
}
exports.unmarshalInt64BigintFromBuffer = unmarshalInt64BigintFromBuffer;
//# sourceMappingURL=eventstream_utils.js.map