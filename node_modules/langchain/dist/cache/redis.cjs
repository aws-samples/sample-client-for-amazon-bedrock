"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const caches_1 = require("@langchain/core/caches");
/**
 * @deprecated Import from "@langchain/redis" instead.
 * Represents a specific implementation of a caching mechanism using Redis
 * as the underlying storage system. It extends the `BaseCache` class and
 * overrides its methods to provide the Redis-specific logic.
 * @example
 * ```typescript
 * const model = new ChatOpenAI({
 * cache: new RedisCache(new Redis(), { ttl: 60 }),
 * });
 *
 * // Invoke the model to perform an action
 * const response = await model.invoke("Do something random!");
 * console.log(response);
 * ```
 */
class RedisCache extends caches_1.BaseCache {
    constructor(redisClient) {
        super();
        Object.defineProperty(this, "redisClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.redisClient = redisClient;
    }
    /**
     * Retrieves data from the cache. It constructs a cache key from the given
     * `prompt` and `llmKey`, and retrieves the corresponding value from the
     * Redis database.
     * @param prompt The prompt used to construct the cache key.
     * @param llmKey The LLM key used to construct the cache key.
     * @returns An array of Generations if found, null otherwise.
     */
    async lookup(prompt, llmKey) {
        let idx = 0;
        let key = (0, caches_1.getCacheKey)(prompt, llmKey, String(idx));
        let value = await this.redisClient.get(key);
        const generations = [];
        while (value) {
            const storedGeneration = JSON.parse(value);
            generations.push((0, caches_1.deserializeStoredGeneration)(storedGeneration));
            idx += 1;
            key = (0, caches_1.getCacheKey)(prompt, llmKey, String(idx));
            value = await this.redisClient.get(key);
        }
        return generations.length > 0 ? generations : null;
    }
    /**
     * Updates the cache with new data. It constructs a cache key from the
     * given `prompt` and `llmKey`, and stores the `value` in the Redis
     * database.
     * @param prompt The prompt used to construct the cache key.
     * @param llmKey The LLM key used to construct the cache key.
     * @param value The value to be stored in the cache.
     */
    async update(prompt, llmKey, value) {
        for (let i = 0; i < value.length; i += 1) {
            const key = (0, caches_1.getCacheKey)(prompt, llmKey, String(i));
            await this.redisClient.set(key, JSON.stringify((0, caches_1.serializeGeneration)(value[i])));
        }
    }
}
exports.RedisCache = RedisCache;
