import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { MaxMarginalRelevanceSearchOptions, VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
export type SupabaseMetadata = Record<string, any>;
export type SupabaseFilter = PostgrestFilterBuilder<any, any, any>;
export type SupabaseFilterRPCCall = (rpcCall: SupabaseFilter) => SupabaseFilter;
/**
 * Interface for the response returned when searching embeddings.
 */
interface SearchEmbeddingsResponse {
    id: number;
    content: string;
    metadata: object;
    embedding: number[];
    similarity: number;
}
/**
 * Interface for the arguments required to initialize a Supabase library.
 */
export interface SupabaseLibArgs {
    client: SupabaseClient;
    tableName?: string;
    queryName?: string;
    filter?: SupabaseMetadata | SupabaseFilterRPCCall;
    upsertBatchSize?: number;
}
/**
 * Class for interacting with a Supabase database to store and manage
 * vectors.
 */
export declare class SupabaseVectorStore extends VectorStore {
    FilterType: SupabaseMetadata | SupabaseFilterRPCCall;
    client: SupabaseClient;
    tableName: string;
    queryName: string;
    filter?: SupabaseMetadata | SupabaseFilterRPCCall;
    upsertBatchSize: number;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: SupabaseLibArgs);
    /**
     * Adds documents to the vector store.
     * @param documents The documents to add.
     * @param options Optional parameters for adding the documents.
     * @returns A promise that resolves when the documents have been added.
     */
    addDocuments(documents: Document[], options?: {
        ids?: string[] | number[];
    }): Promise<string[]>;
    /**
     * Adds vectors to the vector store.
     * @param vectors The vectors to add.
     * @param documents The documents associated with the vectors.
     * @param options Optional parameters for adding the vectors.
     * @returns A promise that resolves with the IDs of the added vectors when the vectors have been added.
     */
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[] | number[];
    }): Promise<string[]>;
    /**
     * Deletes vectors from the vector store.
     * @param params The parameters for deleting vectors.
     * @returns A promise that resolves when the vectors have been deleted.
     */
    delete(params: {
        ids: string[] | number[];
    }): Promise<void>;
    protected _searchSupabase(query: number[], k: number, filter?: this["FilterType"]): Promise<SearchEmbeddingsResponse[]>;
    /**
     * Performs a similarity search on the vector store.
     * @param query The query vector.
     * @param k The number of results to return.
     * @param filter Optional filter to apply to the search.
     * @returns A promise that resolves with the search results when the search is complete.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[Document, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK=20- Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda=0.5 - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {SupabaseLibArgs} options.filter - Optional filter to apply to the search.
     *
     * @returns {Promise<Document[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Document[]>;
    /**
     * Creates a new SupabaseVectorStore instance from an array of texts.
     * @param texts The texts to create documents from.
     * @param metadatas The metadata for the documents.
     * @param embeddings The embeddings to use.
     * @param dbConfig The configuration for the Supabase database.
     * @returns A promise that resolves with a new SupabaseVectorStore instance when the instance has been created.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: SupabaseLibArgs): Promise<SupabaseVectorStore>;
    /**
     * Creates a new SupabaseVectorStore instance from an array of documents.
     * @param docs The documents to create the instance from.
     * @param embeddings The embeddings to use.
     * @param dbConfig The configuration for the Supabase database.
     * @returns A promise that resolves with a new SupabaseVectorStore instance when the instance has been created.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: SupabaseLibArgs): Promise<SupabaseVectorStore>;
    /**
     * Creates a new SupabaseVectorStore instance from an existing index.
     * @param embeddings The embeddings to use.
     * @param dbConfig The configuration for the Supabase database.
     * @returns A promise that resolves with a new SupabaseVectorStore instance when the instance has been created.
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, dbConfig: SupabaseLibArgs): Promise<SupabaseVectorStore>;
}
export {};
