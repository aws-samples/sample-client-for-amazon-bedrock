import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
export type SearchType = "vector" | "hybrid";
export type DistanceStrategy = "euclidean" | "cosine";
interface Neo4jVectorStoreArgs {
    url: string;
    username: string;
    password: string;
    database?: string;
    preDeleteCollection?: boolean;
    textNodeProperty?: string;
    textNodeProperties?: string[];
    embeddingNodeProperty?: string;
    keywordIndexName?: string;
    indexName?: string;
    searchType?: SearchType;
    retrievalQuery?: string;
    nodeLabel?: string;
    createIdIndex?: boolean;
}
/**
 * @security *Security note*: Make sure that the database connection uses credentials
 * that are narrowly-scoped to only include necessary permissions.
 * Failure to do so may result in data corruption or loss, since the calling
 * code may attempt commands that would result in deletion, mutation
 * of data if appropriately prompted or reading sensitive data if such
 * data is present in the database.
 * The best way to guard against such negative outcomes is to (as appropriate)
 * limit the permissions granted to the credentials used with this tool.
 * For example, creating read only users for the database is a good way to
 * ensure that the calling code cannot mutate or delete data.
 *
 * @link See https://js.langchain.com/docs/security for more information.
 */
export declare class Neo4jVectorStore extends VectorStore {
    private driver;
    private database;
    private preDeleteCollection;
    private nodeLabel;
    private embeddingNodeProperty;
    private embeddingDimension;
    private textNodeProperty;
    private keywordIndexName;
    private indexName;
    private retrievalQuery;
    private searchType;
    private distanceStrategy;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs);
    static initialize(embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs): Promise<Neo4jVectorStore>;
    _initializeDriver({ url, username, password, database, }: Neo4jVectorStoreArgs): Promise<void>;
    _verifyConnectivity(): Promise<void>;
    close(): Promise<void>;
    _dropIndex(): Promise<void>;
    query(query: string, params?: any): Promise<any[]>;
    static fromTexts(texts: string[], metadatas: any, embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs): Promise<Neo4jVectorStore>;
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs): Promise<Neo4jVectorStore>;
    static fromExistingIndex(embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs): Promise<Neo4jVectorStore>;
    static fromExistingGraph(embeddings: EmbeddingsInterface, config: Neo4jVectorStoreArgs): Promise<Neo4jVectorStore>;
    createNewIndex(): Promise<void>;
    retrieveExistingIndex(): Promise<number | null>;
    retrieveExistingFtsIndex(textNodeProperties?: string[]): Promise<string | null>;
    createNewKeywordIndex(textNodeProperties?: string[]): Promise<void>;
    sortByIndexName(values: Array<{
        [key: string]: any;
    }>, indexName: string): Array<{
        [key: string]: any;
    }>;
    addVectors(vectors: number[][], documents: Document[], metadatas?: Record<string, any>[], ids?: string[]): Promise<string[]>;
    addDocuments(documents: Document[]): Promise<string[]>;
    similaritySearch(query: string, k?: number, params?: Record<string, any>): Promise<Document[]>;
    similaritySearchVectorWithScore(vector: number[], k: number, query: string, params?: Record<string, any>): Promise<[Document, number][]>;
}
export {};
