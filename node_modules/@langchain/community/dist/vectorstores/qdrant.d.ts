import { QdrantClient } from "@qdrant/js-client-rest";
import type { Schemas as QdrantSchemas } from "@qdrant/js-client-rest";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * Interface for the arguments that can be passed to the
 * `QdrantVectorStore` constructor. It includes options for specifying a
 * `QdrantClient` instance, the URL and API key for a Qdrant database, and
 * the name and configuration for a collection.
 */
export interface QdrantLibArgs {
    client?: QdrantClient;
    url?: string;
    apiKey?: string;
    collectionName?: string;
    collectionConfig?: QdrantSchemas["CreateCollection"];
    customPayload?: Record<string, any>[];
}
export type QdrantAddDocumentOptions = {
    customPayload: Record<string, any>[];
};
/**
 * Class that extends the `VectorStore` base class to interact with a
 * Qdrant database. It includes methods for adding documents and vectors
 * to the Qdrant database, searching for similar vectors, and ensuring the
 * existence of a collection in the database.
 */
export declare class QdrantVectorStore extends VectorStore {
    get lc_secrets(): {
        [key: string]: string;
    };
    client: QdrantClient;
    collectionName: string;
    collectionConfig?: QdrantSchemas["CreateCollection"];
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: QdrantLibArgs);
    /**
     * Method to add documents to the Qdrant database. It generates vectors
     * from the documents using the `Embeddings` instance and then adds the
     * vectors to the database.
     * @param documents Array of `Document` instances to be added to the Qdrant database.
     * @param documentOptions Optional `QdrantAddDocumentOptions` which has a list of JSON objects for extra querying
     * @returns Promise that resolves when the documents have been added to the database.
     */
    addDocuments(documents: Document[], documentOptions?: QdrantAddDocumentOptions): Promise<void>;
    /**
     * Method to add vectors to the Qdrant database. Each vector is associated
     * with a document, which is stored as the payload for a point in the
     * database.
     * @param vectors Array of vectors to be added to the Qdrant database.
     * @param documents Array of `Document` instances associated with the vectors.
     * @param documentOptions Optional `QdrantAddDocumentOptions` which has a list of JSON objects for extra querying
     * @returns Promise that resolves when the vectors have been added to the database.
     */
    addVectors(vectors: number[][], documents: Document[], documentOptions?: QdrantAddDocumentOptions): Promise<void>;
    /**
     * Method to search for vectors in the Qdrant database that are similar to
     * a given query vector. The search results include the score and payload
     * (metadata and content) for each similar vector.
     * @param query Query vector to search for similar vectors in the Qdrant database.
     * @param k Optional number of similar vectors to return. If not specified, all similar vectors are returned.
     * @param filter Optional filter to apply to the search results.
     * @returns Promise that resolves with an array of tuples, where each tuple includes a `Document` instance and a score for a similar vector.
     */
    similaritySearchVectorWithScore(query: number[], k?: number, filter?: QdrantSchemas["Filter"]): Promise<[Document, number][]>;
    /**
     * Method to ensure the existence of a collection in the Qdrant database.
     * If the collection does not exist, it is created.
     * @returns Promise that resolves when the existence of the collection has been ensured.
     */
    ensureCollection(): Promise<void>;
    /**
     * Static method to create a `QdrantVectorStore` instance from texts. Each
     * text is associated with metadata and converted to a `Document`
     * instance, which is then added to the Qdrant database.
     * @param texts Array of texts to be converted to `Document` instances and added to the Qdrant database.
     * @param metadatas Array or single object of metadata to be associated with the texts.
     * @param embeddings `Embeddings` instance used to generate vectors from the texts.
     * @param dbConfig `QdrantLibArgs` instance specifying the configuration for the Qdrant database.
     * @returns Promise that resolves with a new `QdrantVectorStore` instance.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: QdrantLibArgs): Promise<QdrantVectorStore>;
    /**
     * Static method to create a `QdrantVectorStore` instance from `Document`
     * instances. The documents are added to the Qdrant database.
     * @param docs Array of `Document` instances to be added to the Qdrant database.
     * @param embeddings `Embeddings` instance used to generate vectors from the documents.
     * @param dbConfig `QdrantLibArgs` instance specifying the configuration for the Qdrant database.
     * @returns Promise that resolves with a new `QdrantVectorStore` instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: QdrantLibArgs): Promise<QdrantVectorStore>;
    /**
     * Static method to create a `QdrantVectorStore` instance from an existing
     * collection in the Qdrant database.
     * @param embeddings `Embeddings` instance used to generate vectors from the documents in the collection.
     * @param dbConfig `QdrantLibArgs` instance specifying the configuration for the Qdrant database.
     * @returns Promise that resolves with a new `QdrantVectorStore` instance.
     */
    static fromExistingCollection(embeddings: EmbeddingsInterface, dbConfig: QdrantLibArgs): Promise<QdrantVectorStore>;
}
