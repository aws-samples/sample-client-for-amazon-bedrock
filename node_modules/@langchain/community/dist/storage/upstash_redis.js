import { Redis as UpstashRedis } from "@upstash/redis";
import { BaseStore } from "@langchain/core/stores";
/**
 * Class that extends the BaseStore class to interact with an Upstash Redis
 * database. It provides methods for getting, setting, and deleting data,
 * as well as yielding keys from the database.
 * @example
 * ```typescript
 * const store = new UpstashRedisStore({
 *   client: new Redis({
 *     url: "your-upstash-redis-url",
 *     token: "your-upstash-redis-token",
 *   }),
 * });
 * await store.mset([
 *   ["message:id:0", "encoded-ai-message"],
 *   ["message:id:1", "encoded-human-message"],
 * ]);
 * const retrievedMessages = await store.mget(["message:id:0", "message:id:1"]);
 * const yieldedKeys = [];
 * for await (const key of store.yieldKeys("message:id")) {
 *   yieldedKeys.push(key);
 * }
 * await store.mdelete(yieldedKeys);
 * ```
 */
export class UpstashRedisStore extends BaseStore {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "storage"]
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yieldKeysScanBatchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        Object.defineProperty(this, "sessionTTL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (fields.client) {
            this.client = fields.client;
        }
        else if (fields.config) {
            this.client = new UpstashRedis(fields.config);
        }
        else {
            throw new Error(`Upstash Redis store requires either a config object or a pre-configured client.`);
        }
        this.sessionTTL = fields.sessionTTL;
        this.yieldKeysScanBatchSize =
            fields.yieldKeysScanBatchSize ?? this.yieldKeysScanBatchSize;
        this.namespace = fields.namespace;
    }
    _getPrefixedKey(key) {
        if (this.namespace) {
            const delimiter = "/";
            return `${this.namespace}${delimiter}${key}`;
        }
        return key;
    }
    _getDeprefixedKey(key) {
        if (this.namespace) {
            const delimiter = "/";
            return key.slice(this.namespace.length + delimiter.length);
        }
        return key;
    }
    /**
     * Gets multiple keys from the Upstash Redis database.
     * @param keys Array of keys to be retrieved.
     * @returns An array of retrieved values.
     */
    async mget(keys) {
        const encoder = new TextEncoder();
        const prefixedKeys = keys.map(this._getPrefixedKey.bind(this));
        const retrievedValues = await this.client.mget(...prefixedKeys);
        return retrievedValues.map((value) => {
            if (!value) {
                return undefined;
            }
            else if (typeof value === "object") {
                return encoder.encode(JSON.stringify(value));
            }
            else {
                return encoder.encode(value);
            }
        });
    }
    /**
     * Sets multiple keys in the Upstash Redis database.
     * @param keyValuePairs Array of key-value pairs to be set.
     * @returns Promise that resolves when all keys have been set.
     */
    async mset(keyValuePairs) {
        const decoder = new TextDecoder();
        const encodedKeyValuePairs = keyValuePairs.map(([key, value]) => [
            this._getPrefixedKey(key),
            decoder.decode(value),
        ]);
        const pipeline = this.client.pipeline();
        for (const [key, value] of encodedKeyValuePairs) {
            if (this.sessionTTL) {
                pipeline.setex(key, this.sessionTTL, value);
            }
            else {
                pipeline.set(key, value);
            }
        }
        await pipeline.exec();
    }
    /**
     * Deletes multiple keys from the Upstash Redis database.
     * @param keys Array of keys to be deleted.
     * @returns Promise that resolves when all keys have been deleted.
     */
    async mdelete(keys) {
        await this.client.del(...keys.map(this._getPrefixedKey.bind(this)));
    }
    /**
     * Yields keys from the Upstash Redis database.
     * @param prefix Optional prefix to filter the keys. A wildcard (*) is always appended to the end.
     * @returns An AsyncGenerator that yields keys from the Upstash Redis database.
     */
    async *yieldKeys(prefix) {
        let pattern;
        if (prefix) {
            const wildcardPrefix = prefix.endsWith("*") ? prefix : `${prefix}*`;
            pattern = `${this._getPrefixedKey(wildcardPrefix)}*`;
        }
        else {
            pattern = this._getPrefixedKey("*");
        }
        let [cursor, batch] = await this.client.scan(0, {
            match: pattern,
            count: this.yieldKeysScanBatchSize,
        });
        for (const key of batch) {
            yield this._getDeprefixedKey(key);
        }
        while (cursor !== 0) {
            [cursor, batch] = await this.client.scan(cursor, {
                match: pattern,
                count: this.yieldKeysScanBatchSize,
            });
            for (const key of batch) {
                yield this._getDeprefixedKey(key);
            }
        }
    }
}
