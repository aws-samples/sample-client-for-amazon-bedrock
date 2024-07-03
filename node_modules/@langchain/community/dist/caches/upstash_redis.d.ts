import { Redis, type RedisConfigNodejs } from "@upstash/redis";
import { Generation } from "@langchain/core/outputs";
import { BaseCache } from "@langchain/core/caches";
export type UpstashRedisCacheProps = {
    /**
     * The config to use to instantiate an Upstash Redis client.
     */
    config?: RedisConfigNodejs;
    /**
     * An existing Upstash Redis client.
     */
    client?: Redis;
};
/**
 * A cache that uses Upstash as the backing store.
 * See https://docs.upstash.com/redis.
 * @example
 * ```typescript
 * const cache = new UpstashRedisCache({
 *   config: {
 *     url: "UPSTASH_REDIS_REST_URL",
 *     token: "UPSTASH_REDIS_REST_TOKEN",
 *   },
 * });
 * // Initialize the OpenAI model with Upstash Redis cache for caching responses
 * const model = new ChatOpenAI({
 *   cache,
 * });
 * await model.invoke("How are you today?");
 * const cachedValues = await cache.lookup("How are you today?", "llmKey");
 * ```
 */
export declare class UpstashRedisCache extends BaseCache {
    private redisClient;
    constructor(props: UpstashRedisCacheProps);
    /**
     * Lookup LLM generations in cache by prompt and associated LLM key.
     */
    lookup(prompt: string, llmKey: string): Promise<Generation[] | null>;
    /**
     * Update the cache with the given generations.
     *
     * Note this overwrites any existing generations for the given prompt and LLM key.
     */
    update(prompt: string, llmKey: string, value: Generation[]): Promise<void>;
}
