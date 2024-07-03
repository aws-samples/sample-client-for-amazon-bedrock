"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmac_sha256 = exports.Sha256Hmac = exports.hash_sha1 = exports.Sha1Hash = exports.hash_sha256 = exports.Sha256Hash = exports.hash_md5 = exports.Md5Hash = void 0;
/**
 * A module containing support for a variety of cryptographic operations.
 *
 * @packageDocumentation
 * @module crypto
 * @mergeTarget
 */
const binding_1 = __importDefault(require("./binding"));
const native_resource_1 = require("./native_resource");
/**
 * Object that allows for continuous hashing of data.
 *
 * @internal
 */
class Hash extends native_resource_1.NativeResource {
    /**
     * Hash additional data.
     * @param data Additional data to hash
     */
    update(data) {
        binding_1.default.hash_update(this.native_handle(), data);
    }
    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     */
    finalize(truncate_to) {
        return binding_1.default.hash_digest(this.native_handle(), truncate_to);
    }
    constructor(hash_handle) {
        super(hash_handle);
    }
}
/**
 * Object that allows for continuous MD5 hashing of data.
 *
 * @category Crypto
 */
class Md5Hash extends Hash {
    constructor() {
        super(binding_1.default.hash_md5_new());
    }
}
exports.Md5Hash = Md5Hash;
/**
 * Computes an MD5 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
function hash_md5(data, truncate_to) {
    return binding_1.default.hash_md5_compute(data, truncate_to);
}
exports.hash_md5 = hash_md5;
/**
 * Object that allows for continuous SHA256 hashing of data.
 *
 * @category Crypto
 */
class Sha256Hash extends Hash {
    constructor() {
        super(binding_1.default.hash_sha256_new());
    }
}
exports.Sha256Hash = Sha256Hash;
/**
 * Computes an SHA256 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
function hash_sha256(data, truncate_to) {
    return binding_1.default.hash_sha256_compute(data, truncate_to);
}
exports.hash_sha256 = hash_sha256;
/**
 * Object that allows for continuous SHA1 hashing of data.
 *
 * @category Crypto
 */
class Sha1Hash extends Hash {
    constructor() {
        super(binding_1.default.hash_sha1_new());
    }
}
exports.Sha1Hash = Sha1Hash;
/**
 * Computes an SHA1 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
function hash_sha1(data, truncate_to) {
    return binding_1.default.hash_sha1_compute(data, truncate_to);
}
exports.hash_sha1 = hash_sha1;
/**
 * Object that allows for continuous hashing of data with an hmac secret.
 *
 * @category Crypto
 */
class Hmac extends native_resource_1.NativeResource {
    /**
     * Hash additional data.
     *
     * @param data additional data to hash
     */
    update(data) {
        binding_1.default.hmac_update(this.native_handle(), data);
    }
    /**
     * Completes the hash computation and returns the final hmac digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     */
    finalize(truncate_to) {
        return binding_1.default.hmac_digest(this.native_handle(), truncate_to);
    }
    constructor(hash_handle) {
        super(hash_handle);
    }
}
/**
 * Object that allows for continuous SHA256 HMAC hashing of data.
 *
 * @category Crypto
 */
class Sha256Hmac extends Hmac {
    constructor(secret) {
        super(binding_1.default.hmac_sha256_new(secret));
    }
}
exports.Sha256Hmac = Sha256Hmac;
/**
 * Computes an SHA256 HMAC. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param secret The key to use for the HMAC process
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
function hmac_sha256(secret, data, truncate_to) {
    return binding_1.default.hmac_sha256_compute(secret, data, truncate_to);
}
exports.hmac_sha256 = hmac_sha256;
//# sourceMappingURL=crypto.js.map