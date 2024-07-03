import { VectorizeIndex, VectorizeVectorMetadata } from "@cloudflare/workers-types";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, type AsyncCallerParams } from "@langchain/core/utils/async_caller";
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 */
export interface VectorizeLibArgs extends AsyncCallerParams {
    index: VectorizeIndex;
    textKey?: string;
}
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Type that defines the parameters for the delete operation in the
 * CloudflareVectorizeStore class. It includes ids, deleteAll flag, and namespace.
 */
export type VectorizeDeleteParams = {
    ids: string[];
};
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Class that extends the VectorStore class and provides methods to
 * interact with the Cloudflare Vectorize vector database.
 */
export declare class CloudflareVectorizeStore extends VectorStore {
    textKey: string;
    namespace?: string;
    index: VectorizeIndex;
    caller: AsyncCaller;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: VectorizeLibArgs);
    /**
     * Method that adds documents to the Vectorize database.
     * @param documents Array of documents to add.
     * @param options Optional ids for the documents.
     * @returns Promise that resolves with the ids of the added documents.
     */
    addDocuments(documents: Document[], options?: {
        ids?: string[];
    } | string[]): Promise<string[]>;
    /**
     * Method that adds vectors to the Vectorize database.
     * @param vectors Array of vectors to add.
     * @param documents Array of documents associated with the vectors.
     * @param options Optional ids for the vectors.
     * @returns Promise that resolves with the ids of the added vectors.
     */
    addVectors(vectors: number[][], documents: Document[], options?: {
        ids?: string[];
    } | string[]): Promise<string[]>;
    /**
     * Method that deletes vectors from the Vectorize database.
     * @param params Parameters for the delete operation.
     * @returns Promise that resolves when the delete operation is complete.
     */
    delete(params: VectorizeDeleteParams): Promise<void>;
    /**
     * Method that performs a similarity search in the Vectorize database and
     * returns the results along with their scores.
     * @param query Query vector for the similarity search.
     * @param k Number of top results to return.
     * @returns Promise that resolves with an array of documents and their scores.
     */
    similaritySearchVectorWithScore(query: number[], k: number): Promise<[Document, number][]>;
    /**
     * Static method that creates a new instance of the CloudflareVectorizeStore class
     * from texts.
     * @param texts Array of texts to add to the Vectorize database.
     * @param metadatas Metadata associated with the texts.
     * @param embeddings Embeddings to use for the texts.
     * @param dbConfig Configuration for the Vectorize database.
     * @param options Optional ids for the vectors.
     * @returns Promise that resolves with a new instance of the CloudflareVectorizeStore class.
     */
    static fromTexts(texts: string[], metadatas: Record<string, VectorizeVectorMetadata>[] | Record<string, VectorizeVectorMetadata>, embeddings: EmbeddingsInterface, dbConfig: VectorizeLibArgs): Promise<CloudflareVectorizeStore>;
    /**
     * Static method that creates a new instance of the CloudflareVectorizeStore class
     * from documents.
     * @param docs Array of documents to add to the Vectorize database.
     * @param embeddings Embeddings to use for the documents.
     * @param dbConfig Configuration for the Vectorize database.
     * @param options Optional ids for the vectors.
     * @returns Promise that resolves with a new instance of the CloudflareVectorizeStore class.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: VectorizeLibArgs): Promise<CloudflareVectorizeStore>;
    /**
     * Static method that creates a new instance of the CloudflareVectorizeStore class
     * from an existing index.
     * @param embeddings Embeddings to use for the documents.
     * @param dbConfig Configuration for the Vectorize database.
     * @returns Promise that resolves with a new instance of the CloudflareVectorizeStore class.
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, dbConfig: VectorizeLibArgs): Promise<CloudflareVectorizeStore>;
}
