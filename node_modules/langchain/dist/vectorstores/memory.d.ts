import { similarity as ml_distance_similarity } from "ml-distance";
import { VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
/**
 * Interface representing a vector in memory. It includes the content
 * (text), the corresponding embedding (vector), and any associated
 * metadata.
 */
interface MemoryVector {
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
}
/**
 * Interface for the arguments that can be passed to the
 * `MemoryVectorStore` constructor. It includes an optional `similarity`
 * function.
 */
export interface MemoryVectorStoreArgs {
    similarity?: typeof ml_distance_similarity.cosine;
}
/**
 * Class that extends `VectorStore` to store vectors in memory. Provides
 * methods for adding documents, performing similarity searches, and
 * creating instances from texts, documents, or an existing index.
 */
export declare class MemoryVectorStore extends VectorStore {
    FilterType: (doc: Document) => boolean;
    memoryVectors: MemoryVector[];
    similarity: typeof ml_distance_similarity.cosine;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, { similarity, ...rest }?: MemoryVectorStoreArgs);
    /**
     * Method to add documents to the memory vector store. It extracts the
     * text from each document, generates embeddings for them, and adds the
     * resulting vectors to the store.
     * @param documents Array of `Document` instances to be added to the store.
     * @returns Promise that resolves when all documents have been added.
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * Method to add vectors to the memory vector store. It creates
     * `MemoryVector` instances for each vector and document pair and adds
     * them to the store.
     * @param vectors Array of vectors to be added to the store.
     * @param documents Array of `Document` instances corresponding to the vectors.
     * @returns Promise that resolves when all vectors have been added.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Method to perform a similarity search in the memory vector store. It
     * calculates the similarity between the query vector and each vector in
     * the store, sorts the results by similarity, and returns the top `k`
     * results along with their scores.
     * @param query Query vector to compare against the vectors in the store.
     * @param k Number of top results to return.
     * @param filter Optional filter function to apply to the vectors before performing the search.
     * @returns Promise that resolves with an array of tuples, each containing a `Document` and its similarity score.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[Document, number][]>;
    /**
     * Static method to create a `MemoryVectorStore` instance from an array of
     * texts. It creates a `Document` for each text and metadata pair, and
     * adds them to the store.
     * @param texts Array of texts to be added to the store.
     * @param metadatas Array or single object of metadata corresponding to the texts.
     * @param embeddings `Embeddings` instance used to generate embeddings for the texts.
     * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
     * @returns Promise that resolves with a new `MemoryVectorStore` instance.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig?: MemoryVectorStoreArgs): Promise<MemoryVectorStore>;
    /**
     * Static method to create a `MemoryVectorStore` instance from an array of
     * `Document` instances. It adds the documents to the store.
     * @param docs Array of `Document` instances to be added to the store.
     * @param embeddings `Embeddings` instance used to generate embeddings for the documents.
     * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
     * @returns Promise that resolves with a new `MemoryVectorStore` instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig?: MemoryVectorStoreArgs): Promise<MemoryVectorStore>;
    /**
     * Static method to create a `MemoryVectorStore` instance from an existing
     * index. It creates a new `MemoryVectorStore` instance without adding any
     * documents or vectors.
     * @param embeddings `Embeddings` instance used to generate embeddings for the documents.
     * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
     * @returns Promise that resolves with a new `MemoryVectorStore` instance.
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, dbConfig?: MemoryVectorStoreArgs): Promise<MemoryVectorStore>;
}
export {};
