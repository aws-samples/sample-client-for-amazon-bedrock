import { type DocumentInterface } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
import { VectorStore } from "@langchain/core/vectorstores";
export type TurbopufferDistanceMetric = "cosine_distance" | "euclidean_squared";
export type TurbopufferFilterType = Record<string, Array<[string, string[] | string]>>;
export interface TurbopufferParams extends AsyncCallerParams {
    apiKey?: string;
    namespace?: string;
    distanceMetric?: TurbopufferDistanceMetric;
    apiUrl?: string;
    batchSize?: number;
}
export interface TurbopufferQueryResult {
    dist: number;
    id: number;
    vector?: number[];
    attributes: Record<string, string>;
}
export declare class TurbopufferVectorStore extends VectorStore {
    FilterType: TurbopufferFilterType;
    get lc_secrets(): {
        [key: string]: string;
    };
    get lc_aliases(): {
        [key: string]: string;
    };
    static lc_name(): string;
    protected distanceMetric: TurbopufferDistanceMetric;
    protected apiKey: string;
    protected namespace: string;
    protected apiUrl: string;
    caller: AsyncCaller;
    batchSize: number;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: TurbopufferParams);
    defaultHeaders(): {
        Authorization: string;
        "Content-Type": string;
    };
    callWithRetry(fetchUrl: string, stringifiedBody: string | undefined, method?: string): Promise<any>;
    addVectors(vectors: number[][], documents: DocumentInterface[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    delete(params: {
        deleteIndex?: boolean;
    }): Promise<void>;
    addDocuments(documents: DocumentInterface[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    protected queryVectors(query: number[], k: number, includeVector?: boolean, filter?: this["FilterType"]): Promise<TurbopufferQueryResult[]>;
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[DocumentInterface, number][]>;
    static fromDocuments(docs: DocumentInterface[], embeddings: EmbeddingsInterface, dbConfig: TurbopufferParams): Promise<TurbopufferVectorStore>;
}
