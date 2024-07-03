import { BaseStore } from "@langchain/core/stores";
import { CassandraClientArgs } from "../utils/cassandra.js";
/**
 * Configuration options for initializing a CassandraKVStore.
 * These options extend generic Cassandra client arguments with specific settings
 * for key-value store operations.
 *
 * @interface CassandraKVOptions
 * @extends CassandraClientArgs Custom arguments for the Cassandra client, such as connection settings.
 *
 * @property {string} keyspace The name of the Cassandra keyspace to be used by the key-value store.
 *                The keyspace must exist.
 *
 * @property {string} table The name of the table within the specified keyspace dedicated to storing
 *                key-value pairs. The table will be created if it does not exist.
 *
 * @property {string} [keyDelimiter="/"] An optional delimiter used to structure complex keys. Defaults to '/'.
 *                This delimiter is used for parsing complex keys (e.g., hierarchical keys) when performing
 *                operations that involve key prefixes or segmentation.
 */
export interface CassandraKVOptions extends CassandraClientArgs {
    keyspace: string;
    table: string;
    keyDelimiter?: string;
}
/**
 * A concrete implementation of BaseStore for interacting with a Cassandra database.
 * It provides methods to get, set, delete, and yield keys based on specified criteria.
 */
export declare class CassandraKVStore extends BaseStore<string, Uint8Array> {
    lc_namespace: string[];
    private cassandraTable;
    private options;
    private colKey;
    private colKeyMap;
    private colVal;
    private keyDelimiter;
    protected inClauseSize: number;
    protected yieldKeysFetchSize: number;
    constructor(options: CassandraKVOptions);
    /**
     * Retrieves the values associated with an array of keys from the Cassandra database.
     * It chunks requests for large numbers of keys to manage performance and Cassandra limitations.
     * @param keys An array of keys for which to retrieve values.
     * @returns A promise that resolves with an array of Uint8Array or undefined, corresponding to each key.
     */
    mget(keys: string[]): Promise<(Uint8Array | undefined)[]>;
    /**
     * Sets multiple key-value pairs in the Cassandra database.
     * Each key-value pair is processed to ensure compatibility with Cassandra's storage requirements.
     * @param keyValuePairs An array of key-value pairs to set in the database.
     * @returns A promise that resolves when all key-value pairs have been set.
     */
    mset(keyValuePairs: [string, Uint8Array][]): Promise<void>;
    /**
     * Deletes multiple keys and their associated values from the Cassandra database.
     * @param keys An array of keys to delete from the database.
     * @returns A promise that resolves when all specified keys have been deleted.
     */
    mdelete(keys: string[]): Promise<void>;
    /**
     * Yields keys from the Cassandra database optionally based on a prefix, based
     * on the store's keyDelimiter. This method pages through results efficiently
     * for large datasets.
     * @param prefix An optional prefix to filter the keys to be yielded.
     * @returns An async generator that yields keys from the database.
     */
    yieldKeys(prefix?: string): AsyncGenerator<string>;
    /**
     * Ensures the Cassandra table is initialized and ready for operations.
     * This method is called internally before database operations.
     * @returns A promise that resolves when the table is ensured to exist and be accessible.
     */
    private ensureTable;
    /**
     * Processes an array of keys in chunks, applying a given processing function to each chunk.
     * This method is designed to handle large sets of keys by breaking them down into smaller
     * manageable chunks, applying the processing function to each chunk sequentially. This approach
     * helps in managing resource utilization and adhering to database query limitations.
     *
     * The method is generic, allowing for flexible processing functions that can either perform actions
     * without returning a result (e.g., deletion operations) or return a result (e.g., data retrieval).
     * This design enables the method to be used across a variety of batch processing scenarios.
     *
     * @template T The type of elements in the result array when the processFunction returns data. This
     *             is used to type the resolution of the promise returned by processFunction. For void
     *             operations, T can be omitted or set to any empty interface or null type.
     * @param keys The complete array of keys to be processed. The method chunks this array
     *             based on the specified CHUNK_SIZE.
     * @param processFunction A function that will be applied to each chunk of keys. This function
     *                        should accept an array of strings (chunkKeys) and return a Promise
     *                        that resolves to either void (for operations that don't produce a result,
     *                        like deletion) or an array of type T (for operations that fetch data,
     *                        like retrieval). The array of type T should match the template parameter.
     * @param CHUNK_SIZE (optional) The maximum size of each chunk. If not specified, the class's
     *                   `inClauseSize` property is used as the default chunk size. This value determines
     *                   how many keys are included in each chunk and should be set based on the
     *                   operation's performance characteristics and any limitations of the underlying
     *                   storage system.
     *
     * @returns A Promise that resolves to void if the processing function returns void, or an array
     *          of type T if the processing function returns data. If the processing function returns
     *          data for each chunk, the results from all chunks are concatenated and returned as a
     *          single array. If the processing function does not return data, the method resolves to undefined,
     *          aligning with the void return expectation for non-data-returning operations.
     */
    private processInChunks;
}
