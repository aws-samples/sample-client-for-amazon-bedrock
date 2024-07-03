"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const caches_1 = require("@langchain/core/caches");
/**
 * Cache LLM results using Redis.
 * @example
 * ```typescript
 * const model = new ChatOpenAI({
 *   cache: new RedisCache(new Redis(), { ttl: 60 }),
 * });
 *
 * // Invoke the model with a prompt
 * const response = await model.invoke("Do something random!");
 * console.log(response);
 *
 * // Remember to disconnect the Redis client when done
 * await redisClient.disconnect();
 * ```
 */
class RedisCache extends caches_1.BaseCache {
    constructor(redisClient, config) {
        super();
        Object.defineProperty(this, "redisClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ttl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.redisClient = redisClient;
        this.ttl = config?.ttl;
    }
    /**
     * Retrieves data from the Redis server using a prompt and an LLM key. If
     * the data is not found, it returns null.
     * @param prompt The prompt used to find the data.
     * @param llmKey The LLM key used to find the data.
     * @returns The corresponding data as an array of Generation objects, or null if not found.
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
     * Updates the data in the Redis server using a prompt and an LLM key.
     * @param prompt The prompt used to store the data.
     * @param llmKey The LLM key used to store the data.
     * @param value The data to be stored, represented as an array of Generation objects.
     */
    async update(prompt, llmKey, value) {
        for (let i = 0; i < value.length; i += 1) {
            const key = (0, caches_1.getCacheKey)(prompt, llmKey, String(i));
            if (this.ttl !== undefined) {
                await this.redisClient.set(key, JSON.stringify((0, caches_1.serializeGeneration)(value[i])), "EX", this.ttl);
            }
            else {
                await this.redisClient.set(key, JSON.stringify((0, caches_1.serializeGeneration)(value[i])));
            }
        }
    }
}
exports.RedisCache = RedisCache;
