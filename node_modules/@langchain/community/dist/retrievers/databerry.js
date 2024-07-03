import { BaseRetriever, } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
/**
 * A specific implementation of a document retriever for the Databerry
 * API. It extends the BaseRetriever class, which is an abstract base
 * class for a document retrieval system in LangChain.
 */
/** @deprecated Use "langchain/retrievers/chaindesk" instead */
export class DataberryRetriever extends BaseRetriever {
    static lc_name() {
        return "DataberryRetriever";
    }
    get lc_secrets() {
        return { apiKey: "DATABERRY_API_KEY" };
    }
    get lc_aliases() {
        return { apiKey: "api_key" };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "databerry"]
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "datastoreUrl", {
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
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { datastoreUrl, apiKey, topK, ...rest } = fields;
        this.caller = new AsyncCaller(rest);
        this.datastoreUrl = datastoreUrl;
        this.apiKey = apiKey;
        this.topK = topK;
    }
    async _getRelevantDocuments(query) {
        const r = await this.caller.call(fetch, this.datastoreUrl, {
            method: "POST",
            body: JSON.stringify({
                query,
                ...(this.topK ? { topK: this.topK } : {}),
            }),
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        const { results } = (await r.json());
        return results.map(({ text, score, source, ...rest }) => new Document({
            pageContent: text,
            metadata: {
                score,
                source,
                ...rest,
            },
        }));
    }
}
