/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as eventstream from './eventstream';

jest.setTimeout(10000);

let DEFAULT_HEADER_NAME: string = "MyHeader";

test('Eventstream header - new failure, empty name', async () => {
    expect(() => {eventstream.Header.newBoolean("", true);}).toThrow();
});

test('Eventstream header - new failure, too long name', async () => {
    expect(() => {eventstream.Header.newBoolean("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", true);}).toThrow();
});

function checkTypeCasts(header: eventstream.Header, type: eventstream.HeaderType) {

    expect(header.type).toEqual(type);

    if (type != eventstream.HeaderType.BooleanTrue && type != eventstream.HeaderType.BooleanFalse) {
        expect(() => {
            header.asBoolean();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.Byte) {
        expect(() => {
            header.asByte();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.Int16) {
        expect(() => {
            header.asInt16();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.Int32) {
        expect(() => {
            header.asInt32();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.Int64) {
        expect(() => {
            header.asInt64();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.Timestamp) {
        expect(() => {
            header.asTimestamp();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.String) {
        expect(() => {
            header.asString();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.ByteBuffer) {
        expect(() => {
            header.asByteBuffer();
        }).toThrow();
    }

    if (type != eventstream.HeaderType.UUID) {
        expect(() => {
            header.asUUID();
        }).toThrow();
    }
}

test('Eventstream header - new true boolean success', async () => {
    let header : eventstream.Header = eventstream.Header.newBoolean(DEFAULT_HEADER_NAME, true);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.BooleanTrue);

    expect(header.asBoolean()).toEqual(true);
});

test('Eventstream header - new false boolean success', async () => {
    let header : eventstream.Header = eventstream.Header.newBoolean(DEFAULT_HEADER_NAME, false);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.BooleanFalse);

    expect(header.asBoolean()).toEqual(false);
});

test('Eventstream header - new byte failure, out-of-bounds value', async () => {
    expect(() => {eventstream.Header.newByte(DEFAULT_HEADER_NAME, 128);}).toThrow();
});

test('Eventstream header - new byte failure, fractional value', async () => {
    expect(() => {eventstream.Header.newByte(DEFAULT_HEADER_NAME, .5);}).toThrow();
});

test('Eventstream header - new byte success', async () => {
    let header : eventstream.Header = eventstream.Header.newByte(DEFAULT_HEADER_NAME, 5);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Byte);

    expect(header.asByte()).toEqual(5);
});

test('Eventstream header - new int16 failure, out-of-bounds value', async () => {
    expect(() => {eventstream.Header.newInt16(DEFAULT_HEADER_NAME, 32768);}).toThrow();
});

test('Eventstream header - new int16 failure, fractional value', async () => {
    expect(() => {eventstream.Header.newInt16(DEFAULT_HEADER_NAME, 1024.2);}).toThrow();
});

test('Eventstream header - new int16 success', async () => {
    let header : eventstream.Header = eventstream.Header.newInt16(DEFAULT_HEADER_NAME, -255);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int16);

    expect(header.asInt16()).toEqual(-255);
});

test('Eventstream header - new int32 failure, out-of-bounds value', async () => {
    expect(() => {eventstream.Header.newInt32(DEFAULT_HEADER_NAME, Number.MAX_SAFE_INTEGER);}).toThrow();
});

test('Eventstream header - new int32 failure, fractional value', async () => {
    expect(() => {eventstream.Header.newInt32(DEFAULT_HEADER_NAME, -65536.82);}).toThrow();
});

test('Eventstream header - new int32 success', async () => {
    let large_int32 : number = (1 << 30) - 1;
    let header : eventstream.Header = eventstream.Header.newInt32(DEFAULT_HEADER_NAME, large_int32);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int32);

    expect(header.asInt32()).toEqual(large_int32);
});

test('Eventstream header - new int64 from bigint failure, out-of-bounds value', async () => {
    let too_big : bigint = BigInt("9223372036854775807000453053");

    expect(() => {eventstream.Header.newInt64FromBigint(DEFAULT_HEADER_NAME, too_big);}).toThrow();
});

test('Eventstream header - new int64 from bigint(9223372036854775807) success', async () => {
    let large_int64 : bigint = BigInt("9223372036854775807");
    let header : eventstream.Header = eventstream.Header.newInt64FromBigint(DEFAULT_HEADER_NAME, large_int64);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int64);

    expect(header.asInt64()).toEqual(large_int64);
});

test('Eventstream header - new int64 from bigint(-1) success', async () => {
    let int64 : bigint = BigInt("-1");
    let header : eventstream.Header = eventstream.Header.newInt64FromBigint(DEFAULT_HEADER_NAME, int64);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int64);

    expect(header.asInt64()).toEqual(int64);
});

test('Eventstream header - new int64 from number failure, fractional value', async () => {
    expect(() => {eventstream.Header.newInt64FromNumber(DEFAULT_HEADER_NAME, Number.MAX_VALUE);}).toThrow();
});

test('Eventstream header - new int64 from number(MAX_SAFE_INTEGER) success', async () => {
    let header : eventstream.Header = eventstream.Header.newInt64FromNumber(DEFAULT_HEADER_NAME, Number.MAX_SAFE_INTEGER);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int64);

    expect(header.asInt64()).toEqual(BigInt(Number.MAX_SAFE_INTEGER));
});

test('Eventstream header - new int64 from number(-1) success', async () => {
    let header : eventstream.Header = eventstream.Header.newInt64FromNumber(DEFAULT_HEADER_NAME, -1);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int64);

    expect(header.asInt64()).toEqual(BigInt(-1));
});

test('Eventstream header - new int64 from number(-65537) success', async () => {
    let header : eventstream.Header = eventstream.Header.newInt64FromNumber(DEFAULT_HEADER_NAME, -65537);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Int64);

    expect(header.asInt64()).toEqual(BigInt(-65537));
});

test('Eventstream header - new byte buffer success', async () => {
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");
    let header : eventstream.Header = eventstream.Header.newByteBuffer(DEFAULT_HEADER_NAME, testPayload);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.ByteBuffer);

    expect(header.asByteBuffer()).toEqual(Buffer.from("Derp", "utf-8"));
});

test('Eventstream header - new string success', async () => {
    let header : eventstream.Header = eventstream.Header.newString(DEFAULT_HEADER_NAME, "HelloWorld");
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.String);

    expect(header.asString()).toEqual("HelloWorld");
});

test('Eventstream header - new timestamp from epoch seconds failure, bad value', async () => {
    expect(() => {eventstream.Header.newTimeStampFromSecondsSinceEpoch(DEFAULT_HEADER_NAME, Number.MAX_VALUE);}).toThrow();
});

test('Eventstream header - new timestamp from epoch seconds success', async () => {
    let header : eventstream.Header = eventstream.Header.newTimeStampFromSecondsSinceEpoch(DEFAULT_HEADER_NAME, Number.MAX_SAFE_INTEGER);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Timestamp);

    expect(header.asTimestamp()).toEqual(Number.MAX_SAFE_INTEGER);
});

test('Eventstream header - new timestamp from date success', async () => {
    let someDate = new Date();
    let header : eventstream.Header = eventstream.Header.newTimeStampFromDate(DEFAULT_HEADER_NAME, someDate);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.Timestamp);

    expect(header.asTimestamp()).toEqual(someDate.getTime());
});

test('Eventstream header - new uuid failure, bad value', async () => {
    expect(() => {eventstream.Header.newUUID(DEFAULT_HEADER_NAME, Buffer.from("Derp", "utf-8"));}).toThrow();
});

test('Eventstream header - new uuid success', async () => {
    let uuidBuffer = new ArrayBuffer(16);
    let header : eventstream.Header = eventstream.Header.newUUID(DEFAULT_HEADER_NAME, uuidBuffer);
    expect(header.name).toEqual(DEFAULT_HEADER_NAME);

    checkTypeCasts(header, eventstream.HeaderType.UUID);

    expect(header.asUUID()).toEqual(new ArrayBuffer(16));
});
