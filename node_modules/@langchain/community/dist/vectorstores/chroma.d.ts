import type { ChromaClient as ChromaClientT, Collection } from "chromadb";
import type { CollectionMetadata, Where } from "chromadb/dist/main/types.js";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * Defines the arguments that can be passed to the `Chroma` class
 * constructor. It can either contain a `url` for the Chroma database, the
 * number of dimensions for the vectors (`numDimensions`), a
 * `collectionName` for the collection to be used in the database, and a
 * `filter` object; or it can contain an `index` which is an instance of
 * `ChromaClientT`, along with the `numDimensions`, `collectionName`, and
 * `filter`.
 */
export type ChromaLibArgs = {
    url?: string;
    numDimensions?: number;
    collectionName?: string;
    filter?: object;
    collectionMetadata?: CollectionMetadata;
} | {
    index?: ChromaClientT;
    numDimensions?: number;
    collectionName?: string;
    filter?: object;
    collectionMetadata?: CollectionMetadata;
};
/**
 * Defines the parameters for the `delete` method in the `Chroma` class.
 * It can either contain an array of `ids` of the documents to be deleted
 * or a `filter` object to specify the documents to be deleted.
 */
export interface ChromaDeleteParams<T> {
    ids?: string[];
    filter?: T;
}
/**
 * The main class that extends the `VectorStore` class. It provides
 * methods for interacting with the Chroma database, such as adding
 * documents, deleting documents, and searching for similar vectors.
 */
export declare class Chroma extends VectorStore {
    FilterType: Where;
    index?: ChromaClientT;
    collection?: Collection;
    collectionName: string;
    collectionMetadata?: CollectionMetadata;
    numDimensions?: number;
    url: string;
    filter?: object;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: ChromaLibArgs);
    /**
     * Adds documents to the Chroma database. The documents are first
     * converted to vectors using the `embeddings` instance, and then added to
     * the database.
     * @param documents An array of `Document` instances to be added to the database.
     * @param options Optional. An object containing an array of `ids` for the documents.
     * @returns A promise that resolves when the documents have been added to the database.
     */
    addDocuments(documents: Document[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * Ensures that a collection exists in the Chroma database. If the
     * collection does not exist, it is created.
     * @returns A promise that resolves with the `Collection` instance.
     */
    ensureCollection(): Promise<Collection>;
    /**
     * Adds vectors to the Chroma database. The vectors are associated with
     * the provided documents.
     * @param vectors An array of vectors to be added to the database.
     * @param documents An array of `Document` instances associated with the vectors.
     * @param options Optional. An object containing an array of `ids` for the vectors.
     * @returns A promise that resolves with an array of document IDs when the vectors have been added to the database.
     */
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * Deletes documents from the Chroma database. The documents to be deleted
     * can be specified by providing an array of `ids` or a `filter` object.
     * @param params An object containing either an array of `ids` of the documents to be deleted or a `filter` object to specify the documents to be deleted.
     * @returns A promise that resolves when the specified documents have been deleted from the database.
     */
    delete(params: ChromaDeleteParams<this["FilterType"]>): Promise<void>;
    /**
     * Searches for vectors in the Chroma database that are similar to the
     * provided query vector. The search can be filtered using the provided
     * `filter` object or the `filter` property of the `Chroma` instance.
     * @param query The query vector.
     * @param k The number of similar vectors to return.
     * @param filter Optional. A `filter` object to filter the search results.
     * @returns A promise that resolves with an array of tuples, each containing a `Document` instance and a similarity score.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[Document<Record<string, any>>, number][]>;
    /**
     * Creates a new `Chroma` instance from an array of text strings. The text
     * strings are converted to `Document` instances and added to the Chroma
     * database.
     * @param texts An array of text strings.
     * @param metadatas An array of metadata objects or a single metadata object. If an array is provided, it must have the same length as the `texts` array.
     * @param embeddings An `Embeddings` instance used to generate embeddings for the documents.
     * @param dbConfig A `ChromaLibArgs` object containing the configuration for the Chroma database.
     * @returns A promise that resolves with a new `Chroma` instance.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: ChromaLibArgs): Promise<Chroma>;
    /**
     * Creates a new `Chroma` instance from an array of `Document` instances.
     * The documents are added to the Chroma database.
     * @param docs An array of `Document` instances.
     * @param embeddings An `Embeddings` instance used to generate embeddings for the documents.
     * @param dbConfig A `ChromaLibArgs` object containing the configuration for the Chroma database.
     * @returns A promise that resolves with a new `Chroma` instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: ChromaLibArgs): Promise<Chroma>;
    /**
     * Creates a new `Chroma` instance from an existing collection in the
     * Chroma database.
     * @param embeddings An `Embeddings` instance used to generate embeddings for the documents.
     * @param dbConfig A `ChromaLibArgs` object containing the configuration for the Chroma database.
     * @returns A promise that resolves with a new `Chroma` instance.
     */
    static fromExistingCollection(embeddings: EmbeddingsInterface, dbConfig: ChromaLibArgs): Promise<Chroma>;
    /**
     * Imports the `ChromaClient` from the `chromadb` module.
     * @returns A promise that resolves with an object containing the `ChromaClient` constructor.
     */
    static imports(): Promise<{
        ChromaClient: typeof ChromaClientT;
    }>;
}
