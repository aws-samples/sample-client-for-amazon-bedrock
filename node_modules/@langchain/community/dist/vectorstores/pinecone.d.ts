import { RecordMetadata, Index as PineconeIndex } from "@pinecone-database/pinecone";
import { MaxMarginalRelevanceSearchOptions, VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
/** @deprecated Install and import from @langchain/pinecone instead. */
type PineconeMetadata = Record<string, any>;
/** @deprecated Install and import from @langchain/pinecone instead. */
export interface PineconeLibArgs extends AsyncCallerParams {
    pineconeIndex: PineconeIndex;
    textKey?: string;
    namespace?: string;
    filter?: PineconeMetadata;
}
/**
 * @deprecated Install and import from @langchain/pinecone instead.
 * Type that defines the parameters for the delete operation in the
 * PineconeStore class. It includes ids, filter, deleteAll flag, and namespace.
 */
export type PineconeDeleteParams = {
    ids?: string[];
    deleteAll?: boolean;
    filter?: object;
    namespace?: string;
};
/**
 * @deprecated Install and import from @langchain/pinecone instead.
 * Class that extends the VectorStore class and provides methods to
 * interact with the Pinecone vector database.
 */
export declare class PineconeStore extends VectorStore {
    FilterType: PineconeMetadata;
    textKey: string;
    namespace?: string;
    pineconeIndex: PineconeIndex;
    filter?: PineconeMetadata;
    caller: AsyncCaller;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: PineconeLibArgs);
    /**
     * Method that adds documents to the Pinecone database.
     * @param documents Array of documents to add to the Pinecone database.
     * @param options Optional ids for the documents.
     * @returns Promise that resolves with the ids of the added documents.
     */
    addDocuments(documents: Document[], options?: {
        ids?: string[];
    } | string[]): Promise<string[]>;
    /**
     * Method that adds vectors to the Pinecone database.
     * @param vectors Array of vectors to add to the Pinecone database.
     * @param documents Array of documents associated with the vectors.
     * @param options Optional ids for the vectors.
     * @returns Promise that resolves with the ids of the added vectors.
     */
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[];
    } | string[]): Promise<string[]>;
    /**
     * Method that deletes vectors from the Pinecone database.
     * @param params Parameters for the delete operation.
     * @returns Promise that resolves when the delete operation is complete.
     */
    delete(params: PineconeDeleteParams): Promise<void>;
    protected _runPineconeQuery(query: number[], k: number, filter?: PineconeMetadata, options?: {
        includeValues: boolean;
    }): Promise<import("@pinecone-database/pinecone").QueryResponse<RecordMetadata>>;
    /**
     * Method that performs a similarity search in the Pinecone database and
     * returns the results along with their scores.
     * @param query Query vector for the similarity search.
     * @param k Number of top results to return.
     * @param filter Optional filter to apply to the search.
     * @returns Promise that resolves with an array of documents and their scores.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: PineconeMetadata): Promise<[Document, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK=20 - Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda=0.5 - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {PineconeMetadata} options.filter - Optional filter to apply to the search.
     *
     * @returns {Promise<Document[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Document[]>;
    /**
     * Static method that creates a new instance of the PineconeStore class
     * from texts.
     * @param texts Array of texts to add to the Pinecone database.
     * @param metadatas Metadata associated with the texts.
     * @param embeddings Embeddings to use for the texts.
     * @param dbConfig Configuration for the Pinecone database.
     * @returns Promise that resolves with a new instance of the PineconeStore class.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: {
        pineconeIndex: PineconeIndex;
        textKey?: string;
        namespace?: string | undefined;
    } | PineconeLibArgs): Promise<PineconeStore>;
    /**
     * Static method that creates a new instance of the PineconeStore class
     * from documents.
     * @param docs Array of documents to add to the Pinecone database.
     * @param embeddings Embeddings to use for the documents.
     * @param dbConfig Configuration for the Pinecone database.
     * @returns Promise that resolves with a new instance of the PineconeStore class.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: PineconeLibArgs): Promise<PineconeStore>;
    /**
     * Static method that creates a new instance of the PineconeStore class
     * from an existing index.
     * @param embeddings Embeddings to use for the documents.
     * @param dbConfig Configuration for the Pinecone database.
     * @returns Promise that resolves with a new instance of the PineconeStore class.
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, dbConfig: PineconeLibArgs): Promise<PineconeStore>;
}
export {};
