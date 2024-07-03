/**
 *
 * A module containing miscellaneous platform-related queries
 *
 * @packageDocumentation
 * @module platform
 * @mergeTarget
 */
/**
 * Returns true if this script is running under nodejs
 *
 * @category System
 */
export declare function is_nodejs(): boolean;
/**
 * Returns true if this script is running in a browser
 *
 * @category System
 */
export declare function is_browser(): boolean;
/**
 * Returns the package information for aws-crt-nodejs
 *
 * @category System
 */
export declare function package_info(): any;
/**
 * Returns the AWS CRT version
 *
 * @category System
 */
export declare function crt_version(): any;
