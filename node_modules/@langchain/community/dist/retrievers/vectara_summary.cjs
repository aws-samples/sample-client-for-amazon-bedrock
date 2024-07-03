"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectaraSummaryRetriever = void 0;
const documents_1 = require("@langchain/core/documents");
const retrievers_1 = require("@langchain/core/retrievers");
const vectara_js_1 = require("../vectorstores/vectara.cjs");
class VectaraSummaryRetriever extends retrievers_1.BaseRetriever {
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
            value: vectara_js_1.DEFAULT_FILTER
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
        this.filter = fields.filter ?? vectara_js_1.DEFAULT_FILTER;
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
            docs.push(new documents_1.Document({
                pageContent: summaryResult.summary,
                metadata: { summary: true },
            }));
        }
        return docs;
    }
}
exports.VectaraSummaryRetriever = VectaraSummaryRetriever;
