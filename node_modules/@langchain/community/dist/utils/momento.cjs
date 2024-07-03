"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCacheExists = void 0;
/* eslint-disable no-instanceof/no-instanceof */
const sdk_core_1 = require("@gomomento/sdk-core");
/**
 * Utility function to ensure that a Momento cache exists.
 * If the cache does not exist, it is created.
 *
 * @param client The Momento cache client.
 * @param cacheName The name of the cache to ensure exists.
 */
async function ensureCacheExists(client, cacheName) {
    const createResponse = await client.createCache(cacheName);
    if (createResponse instanceof sdk_core_1.CreateCache.Success ||
        createResponse instanceof sdk_core_1.CreateCache.AlreadyExists) {
        // pass
    }
    else if (createResponse instanceof sdk_core_1.CreateCache.Error) {
        throw createResponse.innerException();
    }
    else {
        throw new Error(`Unknown response type: ${createResponse.toString()}`);
    }
}
exports.ensureCacheExists = ensureCacheExists;
