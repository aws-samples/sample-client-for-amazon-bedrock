import type { EmbeddingsInterface } from "./embeddings.js";
import type { DocumentInterface } from "./documents/document.js";
import { BaseRetriever, BaseRetrieverInterface, type BaseRetrieverInput } from "./retrievers.js";
import { Serializable } from "./load/serializable.js";
import { CallbackManagerForRetrieverRun, Callbacks } from "./callbacks/manager.js";
/**
 * Type for options when adding a document to the VectorStore.
 */
type AddDocumentOptions = Record<string, any>;
/**
 * Type for options when performing a maximal marginal relevance search.
 */
export type MaxMarginalRelevanceSearchOptions<FilterType> = {
    k: number;
    fetchK?: number;
    lambda?: number;
    filter?: FilterType;
};
/**
 * Type for options when performing a maximal marginal relevance search
 * with the VectorStoreRetriever.
 */
export type VectorStoreRetrieverMMRSearchKwargs = {
    fetchK?: number;
    lambda?: number;
};
/**
 * Type for input when creating a VectorStoreRetriever instance.
 */
export type VectorStoreRetrieverInput<V extends VectorStoreInterface> = BaseRetrieverInput & ({
    vectorStore: V;
    k?: number;
    filter?: V["FilterType"];
    searchType?: "similarity";
} | {
    vectorStore: V;
    k?: number;
    filter?: V["FilterType"];
    searchType: "mmr";
    searchKwargs?: VectorStoreRetrieverMMRSearchKwargs;
});
export interface VectorStoreRetrieverInterface<V extends VectorStoreInterface = VectorStoreInterface> extends BaseRetrieverInterface {
    vectorStore: V;
    addDocuments(documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
}
/**
 * Class for performing document retrieval from a VectorStore. Can perform
 * similarity search or maximal marginal relevance search.
 */
export declare class VectorStoreRetriever<V extends VectorStoreInterface = VectorStoreInterface> extends BaseRetriever implements VectorStoreRetrieverInterface {
    static lc_name(): string;
    get lc_namespace(): string[];
    vectorStore: V;
    k: number;
    searchType: string;
    searchKwargs?: VectorStoreRetrieverMMRSearchKwargs;
    filter?: V["FilterType"];
    _vectorstoreType(): string;
    constructor(fields: VectorStoreRetrieverInput<V>);
    _getRelevantDocuments(query: string, runManager?: CallbackManagerForRetrieverRun): Promise<DocumentInterface[]>;
    addDocuments(documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
}
export interface VectorStoreInterface extends Serializable {
    FilterType: object | string;
    embeddings: EmbeddingsInterface;
    _vectorstoreType(): string;
    addVectors(vectors: number[][], documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
    addDocuments(documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
    delete(_params?: Record<string, any>): Promise<void>;
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[DocumentInterface, number][]>;
    similaritySearch(query: string, k?: number, filter?: this["FilterType"], callbacks?: Callbacks): Promise<DocumentInterface[]>;
    similaritySearchWithScore(query: string, k?: number, filter?: this["FilterType"], callbacks?: Callbacks): Promise<[DocumentInterface, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK - Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {this["FilterType"]} options.filter - Optional filter
     * @param _callbacks
     *
     * @returns {Promise<DocumentInterface[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch?(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>, callbacks: Callbacks | undefined): Promise<DocumentInterface[]>;
    asRetriever(kOrFields?: number | Partial<VectorStoreRetrieverInput<this>>, filter?: this["FilterType"], callbacks?: Callbacks, tags?: string[], metadata?: Record<string, unknown>, verbose?: boolean): VectorStoreRetriever<this>;
}
/**
 * Abstract class representing a store of vectors. Provides methods for
 * adding vectors and documents, deleting from the store, and searching
 * the store.
 */
export declare abstract class VectorStore extends Serializable implements VectorStoreInterface {
    FilterType: object | string;
    lc_namespace: string[];
    embeddings: EmbeddingsInterface;
    constructor(embeddings: EmbeddingsInterface, dbConfig: Record<string, any>);
    abstract _vectorstoreType(): string;
    abstract addVectors(vectors: number[][], documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
    abstract addDocuments(documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | void>;
    delete(_params?: Record<string, any>): Promise<void>;
    abstract similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[DocumentInterface, number][]>;
    similaritySearch(query: string, k?: number, filter?: this["FilterType"] | undefined, _callbacks?: Callbacks | undefined): Promise<DocumentInterface[]>;
    similaritySearchWithScore(query: string, k?: number, filter?: this["FilterType"] | undefined, _callbacks?: Callbacks | undefined): Promise<[DocumentInterface, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK - Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {this["FilterType"]} options.filter - Optional filter
     * @param _callbacks
     *
     * @returns {Promise<DocumentInterface[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch?(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>, _callbacks: Callbacks | undefined): Promise<DocumentInterface[]>;
    static fromTexts(_texts: string[], _metadatas: object[] | object, _embeddings: EmbeddingsInterface, _dbConfig: Record<string, any>): Promise<VectorStore>;
    static fromDocuments(_docs: DocumentInterface[], _embeddings: EmbeddingsInterface, _dbConfig: Record<string, any>): Promise<VectorStore>;
    asRetriever(kOrFields?: number | Partial<VectorStoreRetrieverInput<this>>, filter?: this["FilterType"], callbacks?: Callbacks, tags?: string[], metadata?: Record<string, unknown>, verbose?: boolean): VectorStoreRetriever<this>;
}
/**
 * Abstract class extending VectorStore with functionality for saving and
 * loading the vector store.
 */
export declare abstract class SaveableVectorStore extends VectorStore {
    abstract save(directory: string): Promise<void>;
    static load(_directory: string, _embeddings: EmbeddingsInterface): Promise<SaveableVectorStore>;
}
export {};
