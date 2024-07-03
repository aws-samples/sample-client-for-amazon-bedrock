/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * A module containing support for a variety of cryptographic operations.
 *
 * @packageDocumentation
 * @module crypto
 * @mergeTarget
 */

import * as Crypto from "crypto-js";
import { fromUtf8 } from "@aws-sdk/util-utf8-browser";
import { Hashable } from "../common/crypto";

export { Hashable } from "../common/crypto";

/**
 * Object that allows for continuous MD5 hashing of data.
 *
 * @category Crypto
 */
export class Md5Hash {
    private hash?: Crypto.WordArray;

    /**
     * Hashes additional data
     * @param data Additional data to hash
     */
    update(data: Hashable) {
        this.hash = Crypto.MD5(data.toString(), this.hash ? this.hash.toString() : undefined);
    }

    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     *
     * @returns the final hash digest
     */
    finalize(truncate_to?: number): DataView {
        const digest = this.hash ? this.hash.toString() : '';
        const truncated = digest.substring(0, truncate_to ? truncate_to : digest.length);
        const bytes = fromUtf8(truncated);
        return new DataView(bytes.buffer);
    }
}


/**
 * Computes an MD5 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
export function hash_md5(data: Hashable, truncate_to?: number): DataView {
    const md5 = new Md5Hash();
    md5.update(data);
    return md5.finalize(truncate_to);
}

/**
 * Object that allows for continuous SHA256 hashing of data.
 *
 * @category Crypto
 */
export class Sha256Hash {
    private hash?: Crypto.WordArray;

    /**
     * Hashes additional data
     * @param data Additional data to hash
     */
    update(data: Hashable) {
        this.hash = Crypto.SHA256(data.toString(), this.hash ? this.hash.toString() : undefined);
    }

    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     *
     * @returns the final hash digest
     */
    finalize(truncate_to?: number): DataView {
        const digest = this.hash ? this.hash.toString() : '';
        const truncated = digest.substring(0, truncate_to ? truncate_to : digest.length);
        const bytes = fromUtf8(truncated);
        return new DataView(bytes.buffer);
    }
}

/**
 * Computes an SHA256 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
export function hash_sha256(data: Hashable, truncate_to?: number): DataView {
    const digest = Crypto.SHA256(data.toString()).toString();
    const truncated = digest.substring(0, truncate_to ? truncate_to : digest.length);
    const bytes = fromUtf8(truncated);
    return new DataView(bytes.buffer);
}

/**
 * Object that allows for continuous SHA1 hashing of data.
 *
 * @category Crypto
 */
 export class Sha1Hash {
    private hash?: Crypto.WordArray;

    /**
     * Hashes additional data
     * @param data Additional data to hash
     */
    update(data: Hashable) {
        this.hash = Crypto.SHA1(data.toString(), this.hash ? this.hash.toString() : undefined);
    }

    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     *
     * @returns the final hash digest
     */
    finalize(truncate_to?: number): DataView {
        const digest = this.hash ? this.hash.toString() : '';
        const truncated = digest.substring(0, truncate_to ? truncate_to : digest.length);
        const bytes = fromUtf8(truncated);
        return new DataView(bytes.buffer);
    }
}

/**
 * Computes an SHA1 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
export function hash_sha1(data: Hashable, truncate_to?: number): DataView {
    const digest = Crypto.SHA1(data.toString()).toString();
    const truncated = digest.substring(0, truncate_to ? truncate_to : digest.length);
    const bytes = fromUtf8(truncated);
    return new DataView(bytes.buffer);
}

/**
 * Object that allows for continuous hashing of data with an hmac secret.
 *
 * @category Crypto
 */
export class Sha256Hmac {
    private hmac: any;

    /**
     * Constructor for the Sha256Hmac class type
     * @param secret secret key to seed the hmac process with
     */
    constructor(secret: Hashable) {
        // @ts-ignore types file doesn't have this signature of create()
        this.hmac = Crypto.algo.HMAC.create(Crypto.algo.SHA256, secret);
    }

    /**
     * Hashes additional data
     * @param data Additional data to hash
     */
    update(data: Hashable) {
        this.hmac.update(data.toString());
    }

    /**
     * Completes the hash computation and returns the final hmac digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     *
     * @returns the final hmac digest
     */
    finalize(truncate_to?: number): DataView {
        const digest = this.hmac.finalize();
        const truncated = digest.toString().substring(0, truncate_to ? truncate_to : digest.length);
        const bytes = fromUtf8(truncated);
        return new DataView(bytes.buffer);
    }
}

/**
 * Computes an SHA256 HMAC. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param secret The key to use for the HMAC process
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hmac digest
 *
 * @category Crypto
 */
export function hmac_sha256(secret: Hashable, data: Hashable, truncate_to?: number): DataView {
    const hmac = new Sha256Hmac(secret);
    hmac.update(data);
    return hmac.finalize(truncate_to);
}
