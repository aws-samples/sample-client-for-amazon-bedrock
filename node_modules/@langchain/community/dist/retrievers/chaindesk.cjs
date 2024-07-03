"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChaindeskRetriever = void 0;
const retrievers_1 = require("@langchain/core/retrievers");
const documents_1 = require("@langchain/core/documents");
const async_caller_1 = require("@langchain/core/utils/async_caller");
/**
 * @example
 * ```typescript
 * const retriever = new ChaindeskRetriever({
 *   datastoreId: "DATASTORE_ID",
 *   apiKey: "CHAINDESK_API_KEY",
 *   topK: 8,
 * });
 * const docs = await retriever.getRelevantDocuments("hello");
 * ```
 */
class ChaindeskRetriever extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "ChaindeskRetriever";
    }
    constructor({ datastoreId, apiKey, topK, filter, ...rest }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "chaindesk"]
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "datastoreId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.caller = new async_caller_1.AsyncCaller(rest);
        this.datastoreId = datastoreId;
        this.apiKey = apiKey;
        this.topK = topK;
        this.filter = filter;
    }
    async getRelevantDocuments(query) {
        const r = await this.caller.call(fetch, `https://app.chaindesk.ai/api/datastores/${this.datastoreId}/query`, {
            method: "POST",
            body: JSON.stringify({
                query,
                ...(this.topK ? { topK: this.topK } : {}),
                ...(this.filter ? { filters: this.filter } : {}),
            }),
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        const { results } = (await r.json());
        return results.map(({ text, score, source, ...rest }) => new documents_1.Document({
            pageContent: text,
            metadata: {
                score,
                source,
                ...rest,
            },
        }));
    }
}
exports.ChaindeskRetriever = ChaindeskRetriever;
