/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import {CrtError} from "./error";

/*
* Limits for header value validation
*/
export const MAX_INT8 : number = 127;
export const MIN_INT8 : number = -128;
export const MAX_INT16 : number = 32767;
export const MIN_INT16 : number = -32768;
export const MAX_INT32 : number = 2147483647;
export const MIN_INT32 : number = -2147483648;
export const MAX_INT64 : bigint = BigInt("9223372036854775807");
export const MIN_INT64 : bigint = BigInt("-9223372036854775808");

const MAX_UINT8_AS_BIGINT : bigint = BigInt("256");

/** @internal */
export function marshalInt64BigintAsBuffer(value: bigint) : Uint8Array {
    if (value < MIN_INT64 || value > MAX_INT64) {
        throw new CrtError("marshalInt64BigintAsBuffer expects a value that can fit in 8 bytes");
    }

    let buffer : Uint8Array = new Uint8Array(8);

    /* encode the integer as a twos-complement byte sequence */
    if (value < 0) {
        value = -value - BigInt(1);
        for (let i = 0; i < 8; ++i) {
            buffer[i] = 255 - Number(value % MAX_UINT8_AS_BIGINT);
            value /= MAX_UINT8_AS_BIGINT;
        }
    } else {
        for (let i = 0; i < 8; ++i) {
            buffer[i] = Number(value % MAX_UINT8_AS_BIGINT);
            value /= MAX_UINT8_AS_BIGINT;
        }
    }

    return buffer;
}

/** @internal */
export function unmarshalInt64BigintFromBuffer(buffer: ArrayBuffer) : bigint {
    let value : bigint = BigInt(0);

    let byteView = new Uint8Array(buffer);
    if (byteView.length != 8) {
        throw new CrtError("unmarshalInt64BigintFromBuffer expects a byte buffer of length 8");
    }

    let shift: bigint = BigInt(1);
    let isNegative = (byteView[7] & 0x80) != 0;

    /* encoding is two's-complement, so treat negative and non-negative differently */
    if (isNegative) {
        for (let i = 0; i < byteView.length; ++i) {
            let byteValue: bigint = BigInt(255 - byteView[i]);
            value += (byteValue * shift);
            shift *= MAX_UINT8_AS_BIGINT;
        }

        value += BigInt(1);
        value = -value;
    } else {
        for (let i = 0; i < byteView.length; ++i) {
            let byteValue: bigint = BigInt(byteView[i]);
            value += (byteValue * shift);
            shift *= MAX_UINT8_AS_BIGINT;
        }
    }

    return value;
}
