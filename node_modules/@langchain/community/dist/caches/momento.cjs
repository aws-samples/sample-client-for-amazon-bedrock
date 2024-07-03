"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MomentoCache = void 0;
/* eslint-disable no-instanceof/no-instanceof */
const sdk_core_1 = require("@gomomento/sdk-core");
const caches_1 = require("@langchain/core/caches");
const momento_js_1 = require("../utils/momento.cjs");
/**
 * A cache that uses Momento as the backing store.
 * See https://gomomento.com.
 * @example
 * ```typescript
 * const cache = new MomentoCache({
 *   client: new CacheClient({
 *     configuration: Configurations.Laptop.v1(),
 *     credentialProvider: CredentialProvider.fromEnvironmentVariable({
 *       environmentVariableName: "MOMENTO_API_KEY",
 *     }),
 *     defaultTtlSeconds: 60 * 60 * 24, // Cache TTL set to 24 hours.
 *   }),
 *   cacheName: "langchain",
 * });
 * // Initialize the OpenAI model with Momento cache for caching responses
 * const model = new ChatOpenAI({
 *   cache,
 * });
 * await model.invoke("How are you today?");
 * const cachedValues = await cache.lookup("How are you today?", "llmKey");
 * ```
 */
class MomentoCache extends caches_1.BaseCache {
    constructor(props) {
        super();
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cacheName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ttlSeconds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = props.client;
        this.cacheName = props.cacheName;
        this.validateTtlSeconds(props.ttlSeconds);
        this.ttlSeconds = props.ttlSeconds;
    }
    /**
     * Create a new standard cache backed by Momento.
     *
     * @param {MomentoCacheProps} props The settings to instantiate the cache.
     * @param {ICacheClient} props.client The Momento cache client.
     * @param {string} props.cacheName The name of the cache to use to store the data.
     * @param {number} props.ttlSeconds The time to live for the cache items. If not specified,
     * the cache client default is used.
     * @param {boolean} props.ensureCacheExists If true, ensure that the cache exists before returning.
     * If false, the cache is not checked for existence. Defaults to true.
     * @throws {@link InvalidArgumentError} if {@link props.ttlSeconds} is not strictly positive.
     * @returns The Momento-backed cache.
     */
    static async fromProps(props) {
        const instance = new MomentoCache(props);
        if (props.ensureCacheExists || props.ensureCacheExists === undefined) {
            await (0, momento_js_1.ensureCacheExists)(props.client, props.cacheName);
        }
        return instance;
    }
    /**
     * Validate the user-specified TTL, if provided, is strictly positive.
     * @param ttlSeconds The TTL to validate.
     */
    validateTtlSeconds(ttlSeconds) {
        if (ttlSeconds !== undefined && ttlSeconds <= 0) {
            throw new sdk_core_1.InvalidArgumentError("ttlSeconds must be positive.");
        }
    }
    /**
     * Lookup LLM generations in cache by prompt and associated LLM key.
     * @param prompt The prompt to lookup.
     * @param llmKey The LLM key to lookup.
     * @returns The generations associated with the prompt and LLM key, or null if not found.
     */
    async lookup(prompt, llmKey) {
        const key = (0, caches_1.getCacheKey)(prompt, llmKey);
        const getResponse = await this.client.get(this.cacheName, key);
        if (getResponse instanceof sdk_core_1.CacheGet.Hit) {
            const value = getResponse.valueString();
            const parsedValue = JSON.parse(value);
            if (!Array.isArray(parsedValue)) {
                return null;
            }
            return JSON.parse(value).map(caches_1.deserializeStoredGeneration);
        }
        else if (getResponse instanceof sdk_core_1.CacheGet.Miss) {
            return null;
        }
        else if (getResponse instanceof sdk_core_1.CacheGet.Error) {
            throw getResponse.innerException();
        }
        else {
            throw new Error(`Unknown response type: ${getResponse.toString()}`);
        }
    }
    /**
     * Update the cache with the given generations.
     *
     * Note this overwrites any existing generations for the given prompt and LLM key.
     *
     * @param prompt The prompt to update.
     * @param llmKey The LLM key to update.
     * @param value The generations to store.
     */
    async update(prompt, llmKey, value) {
        const key = (0, caches_1.getCacheKey)(prompt, llmKey);
        const setResponse = await this.client.set(this.cacheName, key, JSON.stringify(value.map(caches_1.serializeGeneration)), { ttl: this.ttlSeconds });
        if (setResponse instanceof sdk_core_1.CacheSet.Success) {
            // pass
        }
        else if (setResponse instanceof sdk_core_1.CacheSet.Error) {
            throw setResponse.innerException();
        }
        else {
            throw new Error(`Unknown response type: ${setResponse.toString()}`);
        }
    }
}
exports.MomentoCache = MomentoCache;
