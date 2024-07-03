import type { createCluster, createClient } from "redis";
import { VectorAlgorithms } from "redis";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Type for creating a schema vector field. It includes the algorithm,
 * distance metric, and initial capacity.
 */
export type CreateSchemaVectorField<T extends VectorAlgorithms, A extends Record<string, unknown>> = {
    ALGORITHM: T;
    DISTANCE_METRIC: "L2" | "IP" | "COSINE";
    INITIAL_CAP?: number;
} & A;
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Type for creating a flat schema vector field. It extends
 * CreateSchemaVectorField with a block size property.
 */
export type CreateSchemaFlatVectorField = CreateSchemaVectorField<VectorAlgorithms.FLAT, {
    BLOCK_SIZE?: number;
}>;
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Type for creating a HNSW schema vector field. It extends
 * CreateSchemaVectorField with M, EF_CONSTRUCTION, and EF_RUNTIME
 * properties.
 */
export type CreateSchemaHNSWVectorField = CreateSchemaVectorField<VectorAlgorithms.HNSW, {
    M?: number;
    EF_CONSTRUCTION?: number;
    EF_RUNTIME?: number;
}>;
type CreateIndexOptions = NonNullable<Parameters<ReturnType<typeof createClient>["ft"]["create"]>[3]>;
/** @deprecated Install and import from the "@langchain/redis" integration package instead. */
export type RedisSearchLanguages = `${NonNullable<CreateIndexOptions["LANGUAGE"]>}`;
/** @deprecated Install and import from the "@langchain/redis" integration package instead. */
export type RedisVectorStoreIndexOptions = Omit<CreateIndexOptions, "LANGUAGE"> & {
    LANGUAGE?: RedisSearchLanguages;
};
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Interface for the configuration of the RedisVectorStore. It includes
 * the Redis client, index name, index options, key prefix, content key,
 * metadata key, vector key, and filter.
 */
export interface RedisVectorStoreConfig {
    redisClient: ReturnType<typeof createClient> | ReturnType<typeof createCluster>;
    indexName: string;
    indexOptions?: CreateSchemaFlatVectorField | CreateSchemaHNSWVectorField;
    createIndexOptions?: Omit<RedisVectorStoreIndexOptions, "PREFIX">;
    keyPrefix?: string;
    contentKey?: string;
    metadataKey?: string;
    vectorKey?: string;
    filter?: RedisVectorStoreFilterType;
}
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Interface for the options when adding documents to the
 * RedisVectorStore. It includes keys and batch size.
 */
export interface RedisAddOptions {
    keys?: string[];
    batchSize?: number;
}
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Type for the filter used in the RedisVectorStore. It is an array of
 * strings.
 */
export type RedisVectorStoreFilterType = string[];
/**
 * @deprecated Install and import from the "@langchain/redis" integration package instead.
 * Class representing a RedisVectorStore. It extends the VectorStore class
 * and includes methods for adding documents and vectors, performing
 * similarity searches, managing the index, and more.
 */
export declare class RedisVectorStore extends VectorStore {
    FilterType: RedisVectorStoreFilterType;
    private redisClient;
    indexName: string;
    indexOptions: CreateSchemaFlatVectorField | CreateSchemaHNSWVectorField;
    createIndexOptions: CreateIndexOptions;
    keyPrefix: string;
    contentKey: string;
    metadataKey: string;
    vectorKey: string;
    filter?: RedisVectorStoreFilterType;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, _dbConfig: RedisVectorStoreConfig);
    /**
     * Method for adding documents to the RedisVectorStore. It first converts
     * the documents to texts and then adds them as vectors.
     * @param documents The documents to add.
     * @param options Optional parameters for adding the documents.
     * @returns A promise that resolves when the documents have been added.
     */
    addDocuments(documents: Document[], options?: RedisAddOptions): Promise<void>;
    /**
     * Method for adding vectors to the RedisVectorStore. It checks if the
     * index exists and creates it if it doesn't, then adds the vectors in
     * batches.
     * @param vectors The vectors to add.
     * @param documents The documents associated with the vectors.
     * @param keys Optional keys for the vectors.
     * @param batchSize The size of the batches in which to add the vectors. Defaults to 1000.
     * @returns A promise that resolves when the vectors have been added.
     */
    addVectors(vectors: number[][], documents: Document[], { keys, batchSize }?: RedisAddOptions): Promise<void>;
    /**
     * Method for performing a similarity search in the RedisVectorStore. It
     * returns the documents and their scores.
     * @param query The query vector.
     * @param k The number of nearest neighbors to return.
     * @param filter Optional filter to apply to the search.
     * @returns A promise that resolves to an array of documents and their scores.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: RedisVectorStoreFilterType): Promise<[Document, number][]>;
    /**
     * Static method for creating a new instance of RedisVectorStore from
     * texts. It creates documents from the texts and metadata, then adds them
     * to the RedisVectorStore.
     * @param texts The texts to add.
     * @param metadatas The metadata associated with the texts.
     * @param embeddings The embeddings to use.
     * @param dbConfig The configuration for the RedisVectorStore.
     * @returns A promise that resolves to a new instance of RedisVectorStore.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: RedisVectorStoreConfig): Promise<RedisVectorStore>;
    /**
     * Static method for creating a new instance of RedisVectorStore from
     * documents. It adds the documents to the RedisVectorStore.
     * @param docs The documents to add.
     * @param embeddings The embeddings to use.
     * @param dbConfig The configuration for the RedisVectorStore.
     * @returns A promise that resolves to a new instance of RedisVectorStore.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: RedisVectorStoreConfig): Promise<RedisVectorStore>;
    /**
     * Method for checking if an index exists in the RedisVectorStore.
     * @returns A promise that resolves to a boolean indicating whether the index exists.
     */
    checkIndexExists(): Promise<boolean>;
    /**
     * Method for creating an index in the RedisVectorStore. If the index
     * already exists, it does nothing.
     * @param dimensions The dimensions of the index
     * @returns A promise that resolves when the index has been created.
     */
    createIndex(dimensions?: number): Promise<void>;
    /**
     * Method for dropping an index from the RedisVectorStore.
     * @param deleteDocuments Optional boolean indicating whether to drop the associated documents.
     * @returns A promise that resolves to a boolean indicating whether the index was dropped.
     */
    dropIndex(deleteDocuments?: boolean): Promise<boolean>;
    /**
     * Deletes vectors from the vector store.
     * @param params The parameters for deleting vectors.
     * @returns A promise that resolves when the vectors have been deleted.
     */
    delete(params: {
        deleteAll: boolean;
    }): Promise<void>;
    private buildQuery;
    private prepareFilter;
    /**
     * Escapes all '-' characters.
     * RediSearch considers '-' as a negative operator, hence we need
     * to escape it
     * @see https://redis.io/docs/stack/search/reference/query_syntax
     *
     * @param str
     * @returns
     */
    private escapeSpecialChars;
    /**
     * Unescapes all '-' characters, returning the original string
     *
     * @param str
     * @returns
     */
    private unEscapeSpecialChars;
    /**
     * Converts the vector to the buffer Redis needs to
     * correctly store an embedding
     *
     * @param vector
     * @returns Buffer
     */
    private getFloat32Buffer;
}
export {};
