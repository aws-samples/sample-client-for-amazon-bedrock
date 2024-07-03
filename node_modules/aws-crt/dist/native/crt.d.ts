/**
 * If the ```AWS_CRT_MEMORY_TRACING``` is environment variable is set to 1 or 2,
 * will return the native memory usage in bytes. Otherwise, returns 0.
 * @returns The total allocated native memory, in bytes.
 *
 * @category System
 */
export declare function native_memory(): number;
/**
 * Dumps outstanding native memory allocations. If the ```AWS_CRT_MEMORY_TRACING```
 * environment variable is set to 1 or 2, will dump all active native memory to
 * the console log.
 *
 * @category System
 */
export declare function native_memory_dump(): void;
