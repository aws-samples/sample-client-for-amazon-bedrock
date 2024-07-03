import { MilvusClient, ClientConfig } from "@zilliz/milvus2-sdk-node";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * Interface for the arguments required by the Milvus class constructor.
 */
export interface MilvusLibArgs {
    collectionName?: string;
    partitionName?: string;
    primaryField?: string;
    vectorField?: string;
    textField?: string;
    url?: string;
    ssl?: boolean;
    username?: string;
    password?: string;
    textFieldMaxLength?: number;
    clientConfig?: ClientConfig;
    autoId?: boolean;
}
/**
 * Type representing the type of index used in the Milvus database.
 */
type IndexType = "IVF_FLAT" | "IVF_SQ8" | "IVF_PQ" | "HNSW" | "RHNSW_FLAT" | "RHNSW_SQ" | "RHNSW_PQ" | "IVF_HNSW" | "ANNOY";
/**
 * Interface for the parameters required to create an index in the Milvus
 * database.
 */
interface IndexParam {
    params: {
        nprobe?: number;
        ef?: number;
        search_k?: number;
    };
}
/**
 * Class for interacting with a Milvus database. Extends the VectorStore
 * class.
 */
export declare class Milvus extends VectorStore {
    get lc_secrets(): {
        [key: string]: string;
    };
    FilterType: string;
    collectionName: string;
    partitionName?: string;
    numDimensions?: number;
    autoId?: boolean;
    primaryField: string;
    vectorField: string;
    textField: string;
    textFieldMaxLength: number;
    fields: string[];
    client: MilvusClient;
    indexParams: Record<IndexType, IndexParam>;
    indexCreateParams: {
        index_type: string;
        metric_type: string;
        params: string;
    };
    indexSearchParams: string;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: MilvusLibArgs);
    /**
     * Adds documents to the Milvus database.
     * @param documents Array of Document instances to be added to the database.
     * @returns Promise resolving to void.
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * Adds vectors to the Milvus database.
     * @param vectors Array of vectors to be added to the database.
     * @param documents Array of Document instances associated with the vectors.
     * @returns Promise resolving to void.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Searches for vectors in the Milvus database that are similar to a given
     * vector.
     * @param query Vector to compare with the vectors in the database.
     * @param k Number of similar vectors to return.
     * @param filter Optional filter to apply to the search.
     * @returns Promise resolving to an array of tuples, each containing a Document instance and a similarity score.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: string): Promise<[Document, number][]>;
    /**
     * Ensures that a collection exists in the Milvus database.
     * @param vectors Optional array of vectors to be used if a new collection needs to be created.
     * @param documents Optional array of Document instances to be used if a new collection needs to be created.
     * @returns Promise resolving to void.
     */
    ensureCollection(vectors?: number[][], documents?: Document[]): Promise<void>;
    /**
     * Ensures that a partition exists in the Milvus collection.
     * @returns Promise resolving to void.
     */
    ensurePartition(): Promise<void>;
    /**
     * Creates a collection in the Milvus database.
     * @param vectors Array of vectors to be added to the new collection.
     * @param documents Array of Document instances to be added to the new collection.
     * @returns Promise resolving to void.
     */
    createCollection(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Retrieves the fields of a collection in the Milvus database.
     * @returns Promise resolving to void.
     */
    grabCollectionFields(): Promise<void>;
    /**
     * Creates a Milvus instance from a set of texts and their associated
     * metadata.
     * @param texts Array of texts to be added to the database.
     * @param metadatas Array of metadata objects associated with the texts.
     * @param embeddings Embeddings instance used to generate vector embeddings for the texts.
     * @param dbConfig Optional configuration for the Milvus database.
     * @returns Promise resolving to a new Milvus instance.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig?: MilvusLibArgs): Promise<Milvus>;
    /**
     * Creates a Milvus instance from a set of Document instances.
     * @param docs Array of Document instances to be added to the database.
     * @param embeddings Embeddings instance used to generate vector embeddings for the documents.
     * @param dbConfig Optional configuration for the Milvus database.
     * @returns Promise resolving to a new Milvus instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig?: MilvusLibArgs): Promise<Milvus>;
    /**
     * Creates a Milvus instance from an existing collection in the Milvus
     * database.
     * @param embeddings Embeddings instance used to generate vector embeddings for the documents in the collection.
     * @param dbConfig Configuration for the Milvus database.
     * @returns Promise resolving to a new Milvus instance.
     */
    static fromExistingCollection(embeddings: EmbeddingsInterface, dbConfig: MilvusLibArgs): Promise<Milvus>;
    /**
     * Deletes data from the Milvus database.
     * @param params Object containing a filter to apply to the deletion.
     * @returns Promise resolving to void.
     */
    delete(params: {
        filter: string;
    }): Promise<void>;
}
export {};
