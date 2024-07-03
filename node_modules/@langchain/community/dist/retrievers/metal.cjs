"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetalRetriever = void 0;
const retrievers_1 = require("@langchain/core/retrievers");
const documents_1 = require("@langchain/core/documents");
/**
 * Class used to interact with the Metal service, a managed retrieval &
 * memory platform. It allows you to index your data into Metal and run
 * semantic search and retrieval on it. It extends the `BaseRetriever`
 * class and requires a `Metal` instance and a dictionary of parameters to
 * pass to the Metal API during its initialization.
 * @example
 * ```typescript
 * const retriever = new MetalRetriever({
 *   client: new Metal(
 *     process.env.METAL_API_KEY,
 *     process.env.METAL_CLIENT_ID,
 *     process.env.METAL_INDEX_ID,
 *   ),
 * });
 * const docs = await retriever.getRelevantDocuments("hello");
 * ```
 */
class MetalRetriever extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "MetalRetriever";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "metal"]
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = fields.client;
    }
    async _getRelevantDocuments(query) {
        const res = await this.client.search({ text: query });
        const items = ("data" in res ? res.data : res);
        return items.map(({ text, metadata }) => new documents_1.Document({
            pageContent: text,
            metadata: metadata,
        }));
    }
}
exports.MetalRetriever = MetalRetriever;
