import { BaseRetriever, } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Dria } from "dria";
/**
 * Class for retrieving documents from knowledge uploaded to Dria.
 *
 * @example
 * ```typescript
 * // contract of TypeScript Handbook v4.9 uploaded to Dria
 * const contractId = "-B64DjhUtCwBdXSpsRytlRQCu-bie-vSTvTIT8Ap3g0";
 * const retriever = new DriaRetriever({ contractId });
 *
 * const docs = await retriever.getRelevantDocuments("What is a union type?");
 * console.log(docs);
 * ```
 */
export class DriaRetriever extends BaseRetriever {
    static lc_name() {
        return "DriaRetriever";
    }
    get lc_secrets() {
        return { apiKey: "DRIA_API_KEY" };
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
            value: ["langchain", "retrievers", "dria"]
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "driaClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "searchOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields.apiKey ?? getEnvironmentVariable("DRIA_API_KEY");
        if (!apiKey)
            throw new Error("Missing DRIA_API_KEY.");
        this.apiKey = apiKey;
        this.searchOptions = {
            topK: fields.topK,
            field: fields.field,
            rerank: fields.rerank,
            level: fields.level,
        };
        this.driaClient = new Dria({
            contractId: fields.contractId,
            apiKey: this.apiKey,
        });
    }
    /**
     * Currently connected knowledge on Dria.
     *
     * Retriever will use this contract ID while retrieving documents,
     * and will throw an error if `undefined`.
     *
     * In the case that this is `undefined`, the user is expected to
     * set contract ID manually, such as after creating a new knowledge & inserting
     * data there with the Dria client.
     */
    get contractId() {
        return this.driaClient.contractId;
    }
    set contractId(value) {
        this.driaClient.contractId = value;
    }
    /**
     * Retrieves documents from Dria with respect to the configured contract ID, based on
     * the given query string.
     *
     * @param query The query string
     * @returns  A promise that resolves to an array of documents, with page content as text,
     * along with `id` and the relevance `score` within the metadata.
     */
    async _getRelevantDocuments(query) {
        const docs = await this.driaClient.search(query, this.searchOptions);
        return docs.map((d) => new Document({
            // dria.search returns a string within the metadata as the content
            pageContent: d.metadata,
            metadata: {
                id: d.id,
                score: d.score,
            },
        }));
    }
}
