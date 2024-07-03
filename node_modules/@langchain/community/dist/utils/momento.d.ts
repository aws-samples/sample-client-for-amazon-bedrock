import { ICacheClient } from "@gomomento/sdk-core";
/**
 * Utility function to ensure that a Momento cache exists.
 * If the cache does not exist, it is created.
 *
 * @param client The Momento cache client.
 * @param cacheName The name of the cache to ensure exists.
 */
export declare function ensureCacheExists(client: ICacheClient, cacheName: string): Promise<void>;
