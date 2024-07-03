import { Document } from "@langchain/core/documents";
import { BaseRetriever, type BaseRetrieverInput } from "@langchain/core/retrievers";
import { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
import { VectaraStore, type VectaraSummary, type VectaraFilter } from "../vectorstores/vectara.js";
export interface VectaraRetrieverInput extends BaseRetrieverInput {
    vectara: VectaraStore;
    filter?: VectaraFilter;
    topK?: number;
    summaryConfig?: VectaraSummary;
}
export declare class VectaraSummaryRetriever extends BaseRetriever {
    static lc_name(): string;
    lc_namespace: string[];
    private filter;
    private vectara;
    private topK;
    private summaryConfig;
    constructor(fields: VectaraRetrieverInput);
    _getRelevantDocuments(query: string, _callbacks?: CallbackManagerForRetrieverRun): Promise<Document[]>;
}
