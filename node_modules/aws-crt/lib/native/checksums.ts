/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing various checksum implementations intended for streaming payloads
 *
 * @packageDocumentation
 * @module checksums
 * @mergeTarget
 */

 import crt_native from './binding';
 import { Hashable } from "../common/crypto";


/**
 * Computes an crc32 checksum.
 *
 * @param data The data to checksum
 * @param previous previous crc32 checksum result. Used if you are buffering large input.
 *
 * @category Crypto
 */
export function crc32(data: Hashable, previous?: number): number {
    return crt_native.checksums_crc32(data, previous);
}

/**
 * Computes a crc32c checksum.
 *
 * @param data The data to checksum
 * @param previous previous crc32c checksum result. Used if you are buffering large input.
 *
 * @category Crypto
 */
 export function crc32c(data: Hashable, previous?: number): number {
    return crt_native.checksums_crc32c(data, previous);
}