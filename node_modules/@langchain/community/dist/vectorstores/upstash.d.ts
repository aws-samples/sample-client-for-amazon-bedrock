import { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Index as UpstashIndex } from "@upstash/vector";
import { DocumentInterface } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
/**
 * This interface defines the arguments for the UpstashVectorStore class.
 */
export interface UpstashVectorLibArgs extends AsyncCallerParams {
    index: UpstashIndex;
}
export type UpstashMetadata = Record<string, any>;
export type UpstashQueryMetadata = UpstashMetadata & {
    _pageContentLC: any;
};
/**
 * Type that defines the parameters for the delete method.
 * It can either contain the target id(s) or the deleteAll config to reset all the vectors.
 */
export type UpstashDeleteParams = {
    ids: string | string[];
    deleteAll?: never;
} | {
    deleteAll: boolean;
    ids?: never;
};
/**
 * The main class that extends the 'VectorStore' class. It provides
 * methods for interacting with Upstash index, such as adding documents,
 * deleting documents, performing similarity search and more.
 */
export declare class UpstashVectorStore extends VectorStore {
    index: UpstashIndex;
    caller: AsyncCaller;
    embeddings: EmbeddingsInterface;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: UpstashVectorLibArgs);
    /**
     * This method adds documents to Upstash database. Documents are first converted to vectors
     * using the provided embeddings instance, and then upserted to the database.
     * @param documents Array of Document objects to be added to the database.
     * @param options Optional object containing array of ids for the documents.
     * @returns Promise that resolves with the ids of the provided documents when the upsert operation is done.
     */
    addDocuments(documents: DocumentInterface[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * This method adds the provided vectors to Upstash database.
     * @param vectors  Array of vectors to be added to the Upstash database.
     * @param documents Array of Document objects, each associated with a vector.
     * @param options Optional object containing the array of ids foor the vectors.
     * @returns Promise that resolves with the ids of the provided documents when the upsert operation is done.
     */
    addVectors(vectors: number[][], documents: DocumentInterface[], options?: {
        ids?: string[];
    }): Promise<string[]>;
    /**
     * This method deletes documents from the Upstash database. You can either
     * provide the target ids, or delete all vectors in the database.
     * @param params Object containing either array of ids of the documents or boolean deleteAll.
     * @returns Promise that resolves when the specified documents have been deleted from the database.
     */
    delete(params: UpstashDeleteParams): Promise<void>;
    protected _runUpstashQuery(query: number[], k: number, options?: {
        includeVectors: boolean;
    }): Promise<import("@upstash/vector").QueryResult<UpstashQueryMetadata>[]>;
    /**
     * This method performs a similarity search in the Upstash database
     * over the existing vectors.
     * @param query Query vector for the similarity search.
     * @param k The number of similar vectors to return as result.
     * @returns Promise that resolves with an array of tuples, each containing
     *  Document object and similarity score. The length of the result will be
     *  maximum of 'k' and vectors in the index.
     */
    similaritySearchVectorWithScore(query: number[], k: number): Promise<[DocumentInterface, number][]>;
    /**
     * This method creates a new UpstashVector instance from an array of texts.
     * The texts are initially converted to Document instances and added to Upstash
     * database.
     * @param texts The texts to create the documents from.
     * @param metadatas The metadata values associated with the texts.
     * @param embeddings Embedding interface of choice, to create the text embeddings.
     * @param dbConfig Object containing the Upstash database configs.
     * @returns Promise that resolves with a new UpstashVector instance.
     */
    static fromTexts(texts: string[], metadatas: UpstashMetadata | UpstashMetadata[], embeddings: EmbeddingsInterface, dbConfig: UpstashVectorLibArgs): Promise<UpstashVectorStore>;
    /**
     * This method creates a new UpstashVector instance from an array of Document instances.
     * @param docs The docs to be added to Upstash database.
     * @param embeddings Embedding interface of choice, to create the embeddings.
     * @param dbConfig Object containing the Upstash database configs.
     * @returns Promise that resolves with a new UpstashVector instance
     */
    static fromDocuments(docs: DocumentInterface[], embeddings: EmbeddingsInterface, dbConfig: UpstashVectorLibArgs): Promise<UpstashVectorStore>;
    /**
     * This method creates a new UpstashVector instance from an existing index.
     * @param embeddings Embedding interface of the choice, to create the embeddings.
     * @param dbConfig Object containing the Upstash database configs.
     * @returns
     */
    static fromExistingIndex(embeddings: EmbeddingsInterface, dbConfig: UpstashVectorLibArgs): Promise<UpstashVectorStore>;
}
