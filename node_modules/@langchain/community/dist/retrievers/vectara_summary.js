import { Document } from "@langchain/core/documents";
import { BaseRetriever, } from "@langchain/core/retrievers";
import { DEFAULT_FILTER, } from "../vectorstores/vectara.js";
export class VectaraSummaryRetriever extends BaseRetriever {
    static lc_name() {
        return "VectaraSummaryRetriever";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers"]
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_FILTER
        });
        Object.defineProperty(this, "vectara", {
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
        Object.defineProperty(this, "summaryConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.vectara = fields.vectara;
        this.topK = fields.topK ?? 10;
        this.filter = fields.filter ?? DEFAULT_FILTER;
        this.summaryConfig = fields.summaryConfig ?? {
            enabled: false,
            maxSummarizedResults: 0,
            responseLang: "eng",
        };
    }
    async _getRelevantDocuments(query, _callbacks) {
        const summaryResult = await this.vectara.vectaraQuery(query, this.topK, this.filter, this.summaryConfig ? this.summaryConfig : undefined);
        const docs = summaryResult.documents;
        if (this.summaryConfig.enabled) {
            docs.push(new Document({
                pageContent: summaryResult.summary,
                metadata: { summary: true },
            }));
        }
        return docs;
    }
}
