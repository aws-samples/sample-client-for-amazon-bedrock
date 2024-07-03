import { MongoClient } from "mongodb";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { MaxMarginalRelevanceSearchOptions, VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/** Cosmos DB Similarity type. */
export declare const AzureCosmosDBSimilarityType: {
    /** CosineSimilarity */
    readonly COS: "COS";
    /** Inner - product */
    readonly IP: "IP";
    /** Euclidian distance */
    readonly L2: "L2";
};
/** Cosmos DB Similarity type. */
export type AzureCosmosDBSimilarityType = (typeof AzureCosmosDBSimilarityType)[keyof typeof AzureCosmosDBSimilarityType];
/**
 * Configuration options for the `AzureCosmosDBVectorStore` constructor.
 */
export interface AzureCosmosDBConfig {
    readonly client?: MongoClient;
    readonly connectionString?: string;
    readonly databaseName?: string;
    readonly collectionName?: string;
    readonly indexName?: string;
    readonly textKey?: string;
    readonly embeddingKey?: string;
}
/**
 * Azure Cosmos DB for MongoDB vCore vector store.
 * To use this, you should have both:
 * - the `mongodb` NPM package installed
 * - a connection string associated with a MongoDB VCore Cluster
 *
 * You do not need to create a database or collection, it will be created
 * automatically.
 *
 * Though you do need to create an index on the collection, which can be done
 * using the `createIndex` method.
 */
export declare class AzureCosmosDBVectorStore extends VectorStore {
    get lc_secrets(): {
        [key: string]: string;
    };
    private readonly initPromise;
    private readonly client;
    private database;
    private collection;
    readonly indexName: string;
    readonly textKey: string;
    readonly embeddingKey: string;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, dbConfig: AzureCosmosDBConfig);
    /**
     * Checks if the specified index name during instance construction exists
     * on the collection.
     * @returns A promise that resolves to a boolean indicating if the index exists.
     */
    checkIndexExists(): Promise<boolean>;
    /**
     * Deletes the index specified during instance construction if it exists.
     * @returns A promise that resolves when the index has been deleted.
     */
    deleteIndex(): Promise<void>;
    /**
     * Creates an index on the collection with the specified index name during
     * instance construction.
     *
     * Setting the numLists parameter correctly is important for achieving good
     * accuracy and performance.
     * Since the vector store uses IVF as the indexing strategy, you should
     * create the index only after you have loaded a large enough sample
     * documents to ensure that the centroids for the respective buckets are
     * faily distributed.
     *
     * We recommend that numLists is set to documentCount/1000 for up to
     * 1 million documents and to sqrt(documentCount) for more than 1 million
     * documents.
     * As the number of items in your database grows, you should tune numLists
     * to be larger in order to achieve good latency performance for vector
     * search.
     *
     * If you're experimenting with a new scenario or creating a small demo,
     * you can start with numLists set to 1 to perform a brute-force search
     * across all vectors.
     * This should provide you with the most accurate results from the vector
     * search, however be aware that the search speed and latency will be slow.
     * After your initial setup, you should go ahead and tune the numLists
     * parameter using the above guidance.
     * @param numLists This integer is the number of clusters that the inverted
     *    file (IVF) index uses to group the vector data.
     *    We recommend that numLists is set to documentCount/1000 for up to
     *    1 million documents and to sqrt(documentCount) for more than 1 million
     *    documents.
     *    Using a numLists value of 1 is akin to performing brute-force search,
     *    which has limited performance
     * @param dimensions Number of dimensions for vector similarity.
     *    The maximum number of supported dimensions is 2000
     * @param similarity Similarity metric to use with the IVF index.
     *    Possible options are:
     *    - CosmosDBSimilarityType.COS (cosine distance)
     *    - CosmosDBSimilarityType.L2 (Euclidean distance)
     *    - CosmosDBSimilarityType.IP (inner product)
     * @returns A promise that resolves when the index has been created.
     */
    createIndex(numLists?: number, dimensions?: number, similarity?: AzureCosmosDBSimilarityType): Promise<void>;
    /**
     * Removes specified documents from the AzureCosmosDBVectorStore.
     * @param ids IDs of the documents to be removed. If no IDs are specified,
     *     all documents will be removed.
     * @returns A promise that resolves when the documents have been removed.
     */
    delete(ids?: string[]): Promise<void>;
    /**
     * Closes any newly instanciated Azure Cosmos DB client.
     * If the client was passed in the constructor, it will not be closed.
     * @returns A promise that resolves when any newly instanciated Azure
     *     Cosmos DB client been closed.
     */
    close(): Promise<void>;
    /**
     * Method for adding vectors to the AzureCosmosDBVectorStore.
     * @param vectors Vectors to be added.
     * @param documents Corresponding documents to be added.
     * @returns A promise that resolves when the vectors and documents have been added.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Method for adding documents to the AzureCosmosDBVectorStore. It first converts
     * the documents to texts and then adds them as vectors.
     * @param documents The documents to add.
     * @returns A promise that resolves when the documents have been added.
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * Method that performs a similarity search on the vectors stored in the
     * collection. It returns a list of documents and their corresponding
     * similarity scores.
     * @param queryVector Query vector for the similarity search.
     * @param k=4 Number of nearest neighbors to return.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    similaritySearchVectorWithScore(queryVector: number[], k?: number): Promise<[Document, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND
     * diversity among selected documents.
     * @param query Text to look up documents similar to.
     * @param options.k Number of documents to return.
     * @param options.fetchK=20 Number of documents to fetch before passing to
     *     the MMR algorithm.
     * @param options.lambda=0.5 Number between 0 and 1 that determines the
     *     degree of diversity among the results, where 0 corresponds to maximum
     *     diversity and 1 to minimum diversity.
     * @returns List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Document[]>;
    /**
     * Initializes the AzureCosmosDBVectorStore by connecting to the database.
     * @param client The MongoClient to use for connecting to the database.
     * @param databaseName The name of the database to use.
     * @param collectionName The name of the collection to use.
     * @returns A promise that resolves when the AzureCosmosDBVectorStore has been initialized.
     */
    private init;
    /**
     * Static method to create an instance of AzureCosmosDBVectorStore from a
     * list of texts. It first converts the texts to vectors and then adds
     * them to the collection.
     * @param texts List of texts to be converted to vectors.
     * @param metadatas Metadata for the texts.
     * @param embeddings Embeddings to be used for conversion.
     * @param dbConfig Database configuration for Azure Cosmos DB for MongoDB vCore.
     * @returns Promise that resolves to a new instance of AzureCosmosDBVectorStore.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: AzureCosmosDBConfig): Promise<AzureCosmosDBVectorStore>;
    /**
     * Static method to create an instance of AzureCosmosDBVectorStore from a
     * list of documents. It first converts the documents to vectors and then
     * adds them to the collection.
     * @param docs List of documents to be converted to vectors.
     * @param embeddings Embeddings to be used for conversion.
     * @param dbConfig Database configuration for Azure Cosmos DB for MongoDB vCore.
     * @returns Promise that resolves to a new instance of AzureCosmosDBVectorStore.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: AzureCosmosDBConfig): Promise<AzureCosmosDBVectorStore>;
}
