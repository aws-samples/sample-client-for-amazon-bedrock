/**
 * Library-specific error interface type
 *
 * @packageDocumentation
 * @module error
 */
/**
 * Node/browser-shared interface for an error thrown by the CRT. Implementations of the interface
 * extend the base Javascript Error.
 */
export interface ICrtError {
    readonly error_name?: string;
}
