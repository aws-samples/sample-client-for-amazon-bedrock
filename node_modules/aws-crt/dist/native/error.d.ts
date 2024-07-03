import { ICrtError } from "../common/error";
export { ICrtError } from "../common/error";
/**
 * Represents an error encountered in native code. Can also be used to convert a numeric error code into
 * a human-readable string.
 *
 * @category System
 */
export declare class CrtError extends Error implements ICrtError {
    readonly error: any;
    /** The original integer error code from the CRT */
    readonly error_code?: number;
    /** The translated error name (e.g. AWS_ERROR_UNKNOWN) */
    readonly error_name?: string;
    /** @var error - The original error. Most often an error_code, but possibly some other context */
    constructor(error: any);
}
