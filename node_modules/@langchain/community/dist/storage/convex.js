// eslint-disable-next-line import/no-extraneous-dependencies
import { makeFunctionReference, } from "convex/server";
import { BaseStore } from "@langchain/core/stores";
/**
 * Class that extends the BaseStore class to interact with a Convex
 * database. It provides methods for getting, setting, and deleting key value pairs,
 * as well as yielding keys from the database.
 */
export class ConvexKVStore extends BaseStore {
    constructor(config) {
        super(config);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "storage", "convex"]
        });
        Object.defineProperty(this, "ctx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keyField", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "valueField", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "upsert", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lookup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deleteMany", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.ctx = config.ctx;
        this.table = config.table ?? "cache";
        this.index = config.index ?? "byKey";
        this.keyField = config.keyField ?? "key";
        this.valueField = config.valueField ?? "value";
        this.upsert =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.upsert ?? makeFunctionReference("langchain/db:upsert");
        this.lookup =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.lookup ?? makeFunctionReference("langchain/db:lookup");
        this.deleteMany =
            config.deleteMany ??
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                makeFunctionReference("langchain/db:deleteMany");
    }
    /**
     * Gets multiple keys from the Convex database.
     * @param keys Array of keys to be retrieved.
     * @returns An array of retrieved values.
     */
    async mget(keys) {
        return (await Promise.all(keys.map(async (key) => {
            const found = (await this.ctx.runQuery(this.lookup, {
                table: this.table,
                index: this.index,
                keyField: this.keyField,
                key,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }));
            return found.length > 0 ? found[0][this.valueField] : undefined;
        })));
    }
    /**
     * Sets multiple keys in the Convex database.
     * @param keyValuePairs Array of key-value pairs to be set.
     * @returns Promise that resolves when all keys have been set.
     */
    async mset(keyValuePairs) {
        // TODO: Remove chunking when Convex handles the concurrent requests correctly
        const PAGE_SIZE = 16;
        for (let i = 0; i < keyValuePairs.length; i += PAGE_SIZE) {
            await Promise.all(keyValuePairs.slice(i, i + PAGE_SIZE).map(([key, value]) => this.ctx.runMutation(this.upsert, {
                table: this.table,
                index: this.index,
                keyField: this.keyField,
                key,
                document: { [this.keyField]: key, [this.valueField]: value },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })));
        }
    }
    /**
     * Deletes multiple keys from the Convex database.
     * @param keys Array of keys to be deleted.
     * @returns Promise that resolves when all keys have been deleted.
     */
    async mdelete(keys) {
        await Promise.all(keys.map((key) => this.ctx.runMutation(this.deleteMany, {
            table: this.table,
            index: this.index,
            keyField: this.keyField,
            key,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })));
    }
    /**
     * Yields keys from the Convex database.
     * @param prefix Optional prefix to filter the keys.
     * @returns An AsyncGenerator that yields keys from the Convex database.
     */
    // eslint-disable-next-line require-yield
    async *yieldKeys(_prefix) {
        throw new Error("yieldKeys not implemented yet for ConvexKVStore");
    }
}
