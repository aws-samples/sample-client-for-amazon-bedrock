import { BaseCache, getCacheKey, serializeGeneration, deserializeStoredGeneration, } from "@langchain/core/caches";
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Represents a specific implementation of a caching mechanism using Cloudflare KV
 * as the underlying storage system. It extends the `BaseCache` class and
 * overrides its methods to provide the Cloudflare KV-specific logic.
 * @example
 * ```typescript
 * // Example of using OpenAI with Cloudflare KV as cache in a Cloudflare Worker
 * const cache = new CloudflareKVCache(env.KV_NAMESPACE);
 * const model = new ChatAnthropic({
 *   cache,
 * });
 * const response = await model.invoke("How are you today?");
 * return new Response(JSON.stringify(response), {
 *   headers: { "content-type": "application/json" },
 * });
 *
 * ```
 */
export class CloudflareKVCache extends BaseCache {
    constructor(binding) {
        super();
        Object.defineProperty(this, "binding", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.binding = binding;
    }
    /**
     * Retrieves data from the cache. It constructs a cache key from the given
     * `prompt` and `llmKey`, and retrieves the corresponding value from the
     * Cloudflare KV namespace.
     * @param prompt The prompt used to construct the cache key.
     * @param llmKey The LLM key used to construct the cache key.
     * @returns An array of Generations if found, null otherwise.
     */
    async lookup(prompt, llmKey) {
        let idx = 0;
        let key = getCacheKey(prompt, llmKey, String(idx));
        let value = await this.binding.get(key);
        const generations = [];
        while (value) {
            generations.push(deserializeStoredGeneration(JSON.parse(value)));
            idx += 1;
            key = getCacheKey(prompt, llmKey, String(idx));
            value = await this.binding.get(key);
        }
        return generations.length > 0 ? generations : null;
    }
    /**
     * Updates the cache with new data. It constructs a cache key from the
     * given `prompt` and `llmKey`, and stores the `value` in the Cloudflare KV
     * namespace.
     * @param prompt The prompt used to construct the cache key.
     * @param llmKey The LLM key used to construct the cache key.
     * @param value The value to be stored in the cache.
     */
    async update(prompt, llmKey, value) {
        for (let i = 0; i < value.length; i += 1) {
            const key = getCacheKey(prompt, llmKey, String(i));
            await this.binding.put(key, JSON.stringify(serializeGeneration(value[i])));
        }
    }
}
