import { NativeResource } from "./native_resource";
import { Hashable } from "../common/crypto";
export { Hashable } from "../common/crypto";
/**
 * Object that allows for continuous hashing of data.
 *
 * @internal
 */
declare abstract class Hash extends NativeResource {
    /**
     * Hash additional data.
     * @param data Additional data to hash
     */
    update(data: Hashable): void;
    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     */
    finalize(truncate_to?: number): DataView;
    constructor(hash_handle: any);
}
/**
 * Object that allows for continuous MD5 hashing of data.
 *
 * @category Crypto
 */
export declare class Md5Hash extends Hash {
    constructor();
}
/**
 * Computes an MD5 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
export declare function hash_md5(data: Hashable, truncate_to?: number): DataView;
/**
 * Object that allows for continuous SHA256 hashing of data.
 *
 * @category Crypto
 */
export declare class Sha256Hash extends Hash {
    constructor();
}
/**
 * Computes an SHA256 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
export declare function hash_sha256(data: Hashable, truncate_to?: number): DataView;
/**
 * Object that allows for continuous SHA1 hashing of data.
 *
 * @category Crypto
 */
export declare class Sha1Hash extends Hash {
    constructor();
}
/**
 * Computes an SHA1 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @category Crypto
 */
export declare function hash_sha1(data: Hashable, truncate_to?: number): DataView;
/**
 * Object that allows for continuous hashing of data with an hmac secret.
 *
 * @category Crypto
 */
declare abstract class Hmac extends NativeResource {
    /**
     * Hash additional data.
     *
     * @param data additional data to hash
     */
    update(data: Hashable): void;
    /**
     * Completes the hash computation and returns the final hmac digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     */
    finalize(truncate_to?: number): DataView;
    constructor(hash_handle: any);
}
/**
 * Object that allows for continuous SHA256 HMAC hashing of data.
 *
 * @category Crypto
 */
export declare class Sha256Hmac extends Hmac {
    constructor(secret: Hashable);
}
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
export declare function hmac_sha256(secret: Hashable, data: Hashable, truncate_to?: number): DataView;
