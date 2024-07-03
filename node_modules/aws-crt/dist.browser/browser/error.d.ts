/**
 * Library-specific error extension type
 *
 * @packageDocumentation
 * @module error
 * @mergeTarget
 */
import { ICrtError } from "../common/error";
export { ICrtError } from "../common/error";
/**
 * Represents an error thrown by the CRT browser shim
 *
 * @category System
 */
export declare class CrtError extends Error implements ICrtError {
    readonly error: any;
    readonly error_name?: string;
    /**
     * @param error - The original error, provided for context. Could be any type, often from underlying libraries
     */
    constructor(error: any);
}
