import { BaseRetriever, type BaseRetrieverInput } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
/**
 * Interface for the arguments required to create a new instance of
 * DataberryRetriever.
 */
export interface DataberryRetrieverArgs extends AsyncCallerParams, BaseRetrieverInput {
    datastoreUrl: string;
    topK?: number;
    apiKey?: string;
}
/**
 * A specific implementation of a document retriever for the Databerry
 * API. It extends the BaseRetriever class, which is an abstract base
 * class for a document retrieval system in LangChain.
 */
/** @deprecated Use "langchain/retrievers/chaindesk" instead */
export declare class DataberryRetriever extends BaseRetriever {
    static lc_name(): string;
    lc_namespace: string[];
    get lc_secrets(): {
        apiKey: string;
    };
    get lc_aliases(): {
        apiKey: string;
    };
    caller: AsyncCaller;
    datastoreUrl: string;
    topK?: number;
    apiKey?: string;
    constructor(fields: DataberryRetrieverArgs);
    _getRelevantDocuments(query: string): Promise<Document[]>;
}
