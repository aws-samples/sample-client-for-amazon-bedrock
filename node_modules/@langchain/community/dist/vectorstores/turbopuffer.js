import { v4 as uuidv4 } from "uuid";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
import { chunkArray } from "@langchain/core/utils/chunk_array";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { VectorStore } from "@langchain/core/vectorstores";
export class TurbopufferVectorStore extends VectorStore {
    get lc_secrets() {
        return {
            apiKey: "TURBOPUFFER_API_KEY",
        };
    }
    get lc_aliases() {
        return {
            apiKey: "TURBOPUFFER_API_KEY",
        };
    }
    // Handle minification for tracing
    static lc_name() {
        return "TurbopufferVectorStore";
    }
    _vectorstoreType() {
        return "turbopuffer";
    }
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "distanceMetric", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "cosine_distance"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "default"
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.turbopuffer.com/v1"
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3000
        });
        const { apiKey: argsApiKey, namespace, distanceMetric, apiUrl, batchSize, ...asyncCallerArgs } = args;
        const apiKey = argsApiKey ?? getEnvironmentVariable("TURBOPUFFER_API_KEY");
        if (!apiKey) {
            throw new Error(`Turbopuffer API key not found.\nPlease pass it in as "apiKey" or set it as an environment variable called "TURBOPUFFER_API_KEY"`);
        }
        this.apiKey = apiKey;
        this.namespace = namespace ?? this.namespace;
        this.distanceMetric = distanceMetric ?? this.distanceMetric;
        this.apiUrl = apiUrl ?? this.apiUrl;
        this.batchSize = batchSize ?? this.batchSize;
        this.caller = new AsyncCaller({
            maxConcurrency: 6,
            maxRetries: 0,
            ...asyncCallerArgs,
        });
    }
    defaultHeaders() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
    }
    async callWithRetry(fetchUrl, stringifiedBody, method = "POST") {
        const json = await this.caller.call(async () => {
            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
            };
            if (stringifiedBody !== undefined) {
                headers["Content-Type"] = "application/json";
            }
            const response = await fetch(fetchUrl, {
                method,
                headers,
                body: stringifiedBody,
            });
            if (response.status !== 200) {
                const error = new Error(`Failed to call turbopuffer. Response status ${response.status}\nFull response: ${await response.text()}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error.response = response;
                throw error;
            }
            return response.json();
        });
        return json;
    }
    async addVectors(vectors, documents, options) {
        if (options?.ids && options.ids.length !== vectors.length) {
            throw new Error("Number of ids provided does not match number of vectors");
        }
        if (documents.length !== vectors.length) {
            throw new Error("Number of documents provided does not match number of vectors");
        }
        if (documents.length === 0) {
            throw new Error("No documents provided");
        }
        const batchedVectors = chunkArray(vectors, this.batchSize);
        const batchedDocuments = chunkArray(documents, this.batchSize);
        const batchedIds = options?.ids
            ? chunkArray(options.ids, this.batchSize)
            : batchedDocuments.map((docs) => docs.map((_) => uuidv4()));
        const batchRequests = batchedVectors.map(async (batchVectors, index) => {
            const batchDocs = batchedDocuments[index];
            const batchIds = batchedIds[index];
            if (batchIds.length !== batchVectors.length) {
                throw new Error("Number of ids provided does not match number of vectors");
            }
            const attributes = {
                __lc_page_content: batchDocs.map((doc) => doc.pageContent),
            };
            const usedMetadataFields = new Set(batchDocs.map((doc) => Object.keys(doc.metadata)).flat());
            for (const key of usedMetadataFields) {
                attributes[key] = batchDocs.map((doc) => {
                    if (doc.metadata[key] !== undefined) {
                        if (typeof doc.metadata[key] === "string") {
                            return doc.metadata[key];
                        }
                        else {
                            console.warn([
                                `[WARNING]: Dropping non-string metadata key "${key}" with value "${JSON.stringify(doc.metadata[key])}".`,
                                `turbopuffer currently supports only string metadata values.`,
                            ].join("\n"));
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                });
            }
            const data = {
                ids: batchIds,
                vectors: batchVectors,
                attributes,
            };
            return this.callWithRetry(`${this.apiUrl}/vectors/${this.namespace}`, JSON.stringify(data));
        });
        // Execute all batch requests in parallel
        await Promise.all(batchRequests);
        return batchedIds.flat();
    }
    async delete(params) {
        if (params.deleteIndex) {
            await this.callWithRetry(`${this.apiUrl}/vectors/${this.namespace}`, undefined, "DELETE");
        }
        else {
            throw new Error(`You must provide a "deleteIndex" flag.`);
        }
    }
    async addDocuments(documents, options) {
        const vectors = await this.embeddings.embedDocuments(documents.map((doc) => doc.pageContent));
        return this.addVectors(vectors, documents, options);
    }
    async queryVectors(query, k, includeVector, 
    // See https://Turbopuffer.com/docs/reference/query for more info
    filter) {
        const data = {
            vector: query,
            top_k: k,
            distance_metric: this.distanceMetric,
            filters: filter,
            include_attributes: true,
            include_vectors: includeVector,
        };
        return this.callWithRetry(`${this.apiUrl}/vectors/${this.namespace}/query`, JSON.stringify(data));
    }
    async similaritySearchVectorWithScore(query, k, filter) {
        const search = await this.queryVectors(query, k, false, filter);
        const result = search.map((res) => {
            const { __lc_page_content, ...metadata } = res.attributes;
            return [
                new Document({
                    pageContent: __lc_page_content,
                    metadata,
                }),
                res.dist,
            ];
        });
        return result;
    }
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.addDocuments(docs);
        return instance;
    }
}
