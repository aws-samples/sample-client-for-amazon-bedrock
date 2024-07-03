import type { WeaviateClient, WhereFilter } from "weaviate-ts-client";
import { MaxMarginalRelevanceSearchOptions, VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
/**
 * @deprecated Prefer the `@langchain/weaviate` package.
 */
export declare const flattenObjectForWeaviate: (obj: Record<string, any>) => Record<string, any>;
/**
 * @deprecated Prefer the `@langchain/weaviate` package.
 *
 * Interface that defines the arguments required to create a new instance
 * of the `WeaviateStore` class. It includes the Weaviate client, the name
 * of the class in Weaviate, and optional keys for text and metadata.
 */
export interface WeaviateLibArgs {
    client: WeaviateClient;
    /**
     * The name of the class in Weaviate. Must start with a capital letter.
     */
    indexName: string;
    textKey?: string;
    metadataKeys?: string[];
    tenant?: string;
}
/**
 * @deprecated Prefer the `@langchain/weaviate` package.
 *
 * Interface that defines a filter for querying data from Weaviate. It
 * includes a distance and a `WhereFilter`.
 */
export interface WeaviateFilter {
    distance?: number;
    where: WhereFilter;
}
/**
 * @deprecated Prefer the `@langchain/weaviate` package.
 *
 * Class that extends the `VectorStore` base class. It provides methods to
 * interact with a Weaviate index, including adding vectors and documents,
 * deleting data, and performing similarity searches.
 */
export declare class WeaviateStore extends VectorStore {
    embeddings: EmbeddingsInterface;
    FilterType: WeaviateFilter;
    private client;
    private indexName;
    private textKey;
    private queryAttrs;
    private tenant?;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: WeaviateLibArgs);
    /**
     * Method to add vectors and corresponding documents to the Weaviate
     * index.
     * @param vectors Array of vectors to be added.
     * @param documents Array of documents corresponding to the vectors.
     * @param options Optional parameter that can include specific IDs for the documents.
     * @returns An array of document IDs.
     */
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * Method to add documents to the Weaviate index. It first generates
     * vectors for the documents using the embeddings, then adds the vectors
     * and documents to the index.
     * @param documents Array of documents to be added.
     * @param options Optional parameter that can include specific IDs for the documents.
     * @returns An array of document IDs.
     */
    addDocuments(documents: Document[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * Method to delete data from the Weaviate index. It can delete data based
     * on specific IDs or a filter.
     * @param params Object that includes either an array of IDs or a filter for the data to be deleted.
     * @returns Promise that resolves when the deletion is complete.
     */
    delete(params: {
        ids?: string[];
        filter?: WeaviateFilter;
    }): Promise<void>;
    /**
     * Method to perform a similarity search on the stored vectors in the
     * Weaviate index. It returns the top k most similar documents and their
     * similarity scores.
     * @param query The query vector.
     * @param k The number of most similar documents to return.
     * @param filter Optional filter to apply to the search.
     * @returns An array of tuples, where each tuple contains a document and its similarity score.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: WeaviateFilter): Promise<[Document, number][]>;
    /**
     * Method to perform a similarity search on the stored vectors in the
     * Weaviate index. It returns the top k most similar documents, their
     * similarity scores and embedding vectors.
     * @param query The query vector.
     * @param k The number of most similar documents to return.
     * @param filter Optional filter to apply to the search.
     * @returns An array of tuples, where each tuple contains a document, its similarity score and its embedding vector.
     */
    similaritySearchVectorWithScoreAndEmbedding(query: number[], k: number, filter?: WeaviateFilter): Promise<[Document, number, number[]][]>;
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
     * @returns {Promise<Document[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>, _callbacks?: undefined): Promise<Document[]>;
    /**
     * Static method to create a new `WeaviateStore` instance from a list of
     * texts. It first creates documents from the texts and metadata, then
     * adds the documents to the Weaviate index.
     * @param texts Array of texts.
     * @param metadatas Metadata for the texts. Can be a single object or an array of objects.
     * @param embeddings Embeddings to be used for the texts.
     * @param args Arguments required to create a new `WeaviateStore` instance.
     * @returns A new `WeaviateStore` instance.
     */
    static fromTexts(texts: string[], metadatas: object | object[], embeddings: EmbeddingsInterface, args: WeaviateLibArgs): Promise<WeaviateStore>;
    /**
     * Static method to create a new `WeaviateStore` instance from a list of
     * documents. It adds the documents to the Weaviate index.
     * @param docs Array of documents.
     * @param embeddings Embeddings to be used for the documents.
     * @param args Arguments required to create a new `WeaviateStore` instance.
     * @returns A new `WeaviateStore` instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, args: WeaviateLibArgs): Promise<WeaviateStore>;
    /**
     * Static method to create a new `WeaviateStore` instance from an existing
     * Weaviate index.
     * @param embeddings Embeddings to be used for the Weaviate index.
     * @param args Arguments required to create a new `WeaviateStore` instance.
     * @returns A new `WeaviateStore` instance.
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, args: WeaviateLibArgs): Promise<WeaviateStore>;
}
