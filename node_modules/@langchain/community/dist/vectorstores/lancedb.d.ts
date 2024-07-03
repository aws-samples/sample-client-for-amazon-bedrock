import { Table } from "vectordb";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * Defines the arguments for the LanceDB class constructor. It includes a
 * table and an optional textKey.
 */
export type LanceDBArgs = {
    table: Table;
    textKey?: string;
};
/**
 * A wrapper for an open-source database for vector-search with persistent
 * storage. It simplifies retrieval, filtering, and management of
 * embeddings.
 */
export declare class LanceDB extends VectorStore {
    private table;
    private textKey;
    constructor(embeddings: EmbeddingsInterface, args: LanceDBArgs);
    /**
     * Adds documents to the database.
     * @param documents The documents to be added.
     * @returns A Promise that resolves when the documents have been added.
     */
    addDocuments(documents: Document[]): Promise<void>;
    _vectorstoreType(): string;
    /**
     * Adds vectors and their corresponding documents to the database.
     * @param vectors The vectors to be added.
     * @param documents The corresponding documents to be added.
     * @returns A Promise that resolves when the vectors and documents have been added.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Performs a similarity search on the vectors in the database and returns
     * the documents and their scores.
     * @param query The query vector.
     * @param k The number of results to return.
     * @returns A Promise that resolves with an array of tuples, each containing a Document and its score.
     */
    similaritySearchVectorWithScore(query: number[], k: number): Promise<[Document, number][]>;
    /**
     * Creates a new instance of LanceDB from texts.
     * @param texts The texts to be converted into documents.
     * @param metadatas The metadata for the texts.
     * @param embeddings The embeddings to be managed.
     * @param dbConfig The configuration for the LanceDB instance.
     * @returns A Promise that resolves with a new instance of LanceDB.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: LanceDBArgs): Promise<LanceDB>;
    /**
     * Creates a new instance of LanceDB from documents.
     * @param docs The documents to be added to the database.
     * @param embeddings The embeddings to be managed.
     * @param dbConfig The configuration for the LanceDB instance.
     * @returns A Promise that resolves with a new instance of LanceDB.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: LanceDBArgs): Promise<LanceDB>;
}
