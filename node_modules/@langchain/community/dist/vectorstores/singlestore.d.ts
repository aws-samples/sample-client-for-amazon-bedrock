import type { Pool, PoolOptions } from "mysql2/promise";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
export type Metadata = Record<string, any>;
export type DistanceMetrics = "DOT_PRODUCT" | "EUCLIDEAN_DISTANCE";
export interface ConnectionOptions extends PoolOptions {
}
type ConnectionWithUri = {
    connectionOptions?: never;
    connectionURI: string;
};
type ConnectionWithOptions = {
    connectionURI?: never;
    connectionOptions: ConnectionOptions;
};
type ConnectionConfig = ConnectionWithUri | ConnectionWithOptions;
export type SingleStoreVectorStoreConfig = ConnectionConfig & {
    tableName?: string;
    contentColumnName?: string;
    vectorColumnName?: string;
    metadataColumnName?: string;
    distanceMetric?: DistanceMetrics;
};
/**
 * Class for interacting with SingleStoreDB, a high-performance
 * distributed SQL database. It provides vector storage and vector
 * functions.
 */
export declare class SingleStoreVectorStore extends VectorStore {
    connectionPool: Pool;
    tableName: string;
    contentColumnName: string;
    vectorColumnName: string;
    metadataColumnName: string;
    distanceMetric: DistanceMetrics;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, config: SingleStoreVectorStoreConfig);
    /**
     * Creates a new table in the SingleStoreDB database if it does not
     * already exist.
     */
    createTableIfNotExists(): Promise<void>;
    /**
     * Ends the connection to the SingleStoreDB database.
     */
    end(): Promise<void>;
    /**
     * Adds new documents to the SingleStoreDB database.
     * @param documents An array of Document objects.
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * Adds new vectors to the SingleStoreDB database.
     * @param vectors An array of vectors.
     * @param documents An array of Document objects.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Performs a similarity search on the vectors stored in the SingleStoreDB
     * database.
     * @param query An array of numbers representing the query vector.
     * @param k The number of nearest neighbors to return.
     * @param filter Optional metadata to filter the vectors by.
     * @returns Top matching vectors with score
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: Metadata): Promise<[Document, number][]>;
    /**
     * Creates a new instance of the SingleStoreVectorStore class from a list
     * of texts.
     * @param texts An array of strings.
     * @param metadatas An array of metadata objects.
     * @param embeddings An Embeddings object.
     * @param dbConfig A SingleStoreVectorStoreConfig object.
     * @returns A new SingleStoreVectorStore instance
     */
    static fromTexts(texts: string[], metadatas: object[], embeddings: EmbeddingsInterface, dbConfig: SingleStoreVectorStoreConfig): Promise<SingleStoreVectorStore>;
    /**
     * Creates a new instance of the SingleStoreVectorStore class from a list
     * of Document objects.
     * @param docs An array of Document objects.
     * @param embeddings An Embeddings object.
     * @param dbConfig A SingleStoreVectorStoreConfig object.
     * @returns A new SingleStoreVectorStore instance
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: SingleStoreVectorStoreConfig): Promise<SingleStoreVectorStore>;
}
export {};
