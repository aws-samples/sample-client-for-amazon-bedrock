/**
 *
 * A module containing miscellaneous types for resource management
 *
 * @packageDocumentation
 * @module resource_safety
 * @mergeTarget
 */
/**
 * If you have a resource that you want typescript to enforce close is implemented
 * and/or you want to use the below 'using' function, then implement this interface.
 *
 * @category System
 */
export interface ResourceSafe {
    close(): void;
}
/**
 * Use this function to create a resource in an async context. This will make sure the
 * resources are cleaned up before returning.
 *
 * Example:
 * ```
 * await using(res = new SomeResource(), async (res) =>  {
 *     res.do_the_thing();
 * });
 * ```
 *
 * @category System
 */
export declare function using<T extends ResourceSafe>(resource: T, func: (resource: T) => void): Promise<void>;
