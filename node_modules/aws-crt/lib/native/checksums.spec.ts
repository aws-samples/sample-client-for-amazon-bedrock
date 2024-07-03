/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

 import * as checksums from './checksums';

test('crc32_zeros_one_shot', () => {
    const arr = new Uint8Array(32);
    const output = checksums.crc32(arr);
    const expected = 0x190A55AD
    expect(output).toEqual(expected);
});

test('crc32_zeros_iterated', () => {
    let output = 0
    for (let i = 0; i < 32; i++) {
        output = checksums.crc32(new Uint8Array(1), output)
    }
    const expected = 0x190A55AD;
    expect(output).toEqual(expected);
});

test('crc32_values_one_shot', () => {
    const arr = Uint8Array.from(Array(32).keys());
    const output = checksums.crc32(arr);
    const expected = 0x91267E8A
    expect(output).toEqual(expected);
});

test('crc32_values_iterated', () => {
    let output = 0
    for (let i = 0; i < 32; i++) {
        output = checksums.crc32(Uint8Array.from([i]), output);
    }
    const expected = 0x91267E8A;
    expect(output).toEqual(expected);
});

test('crc32_large_buffer', () => {
    const arr = new Uint8Array(25 * 2**20);
    const output = checksums.crc32(arr);
    const expected = 0x72103906
    expect(output).toEqual(expected);
});

test('crc32c_zeros_one_shot', () => {
    const arr = new Uint8Array(32);
    const output = checksums.crc32c(arr);
    const expected = 0x8A9136AA
    expect(output).toEqual(expected);
});

test('crc32c_zeros_iterated', () => {
    let output = 0
    for (let i = 0; i < 32; i++) {
        output = checksums.crc32c(new Uint8Array(1), output)
    }
    const expected = 0x8A9136AA;
    expect(output).toEqual(expected);
});

test('crc32c_values_one_shot', () => {
    const arr = Uint8Array.from(Array(32).keys());
    const output = checksums.crc32c(arr);
    const expected = 0x46DD794E
    expect(output).toEqual(expected);
});

test('crc32c_values_iterated', () => {
    let output = 0
    for (let i = 0; i < 32; i++) {
        output = checksums.crc32c(Uint8Array.from([i]), output);
    }
    const expected = 0x46DD794E;
    expect(output).toEqual(expected);
});

test('crc32c_large_buffer', () => {
    const arr = new Uint8Array(25 * 2**20);
    const output = checksums.crc32c(arr);
    const expected = 0xfb5b991d
    expect(output).toEqual(expected);
});