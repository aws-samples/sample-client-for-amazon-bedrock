import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import type { MongoClient, Collection, Document as MongoDocument } from "mongodb";
import { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";
/** @deprecated use `MongoDBAtlasVectorSearch` instead. */
export type MongoLibArgs = {
    client: MongoClient;
    collection: Collection<MongoDocument>;
    indexName?: string;
};
/**
 * Type that defines an extension for MongoDB queries. It includes an
 * optional array of post-query pipeline steps.
 */
export type MongoVectorStoreQueryExtension = {
    postQueryPipelineSteps?: MongoDocument[];
};
/** @deprecated use `MongoDBAtlasVectorSearch` instead. */
export declare class MongoVectorStore extends VectorStore {
    FilterType: MongoVectorStoreQueryExtension;
    collection: Collection<MongoDocument>;
    client: MongoClient;
    indexName: string;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, args: MongoLibArgs);
    /**
     * Method that adds documents to the MongoDB collection. It first converts
     * the documents into vectors using the `embedDocuments` method of the
     * `embeddings` instance, and then adds these vectors to the collection.
     * @param documents Array of Document instances to be added to the MongoDB collection.
     * @returns Promise that resolves when the documents have been added to the collection.
     */
    addDocuments(documents: Document[]): Promise<void>;
    /**
     * Method that adds vectors to the MongoDB collection. It creates an array
     * of items, each containing the content, embedding, and metadata of a
     * document, and then inserts these items into the collection.
     * @param vectors Array of vectors to be added to the MongoDB collection.
     * @param documents Array of Document instances corresponding to the vectors.
     * @returns Promise that resolves when the vectors have been added to the collection.
     */
    addVectors(vectors: number[][], documents: Document[]): Promise<void>;
    /**
     * Method that performs a similarity search on vectors and returns the
     * documents and their similarity scores. It constructs a MongoDB
     * aggregation pipeline, applies any post-query pipeline steps if
     * provided, and then executes the pipeline to retrieve the results.
     * @param query Query vector for the similarity search.
     * @param k Number of nearest neighbors to return.
     * @param filter Optional filter for the query, which can include post-query pipeline steps.
     * @returns Promise that resolves to an array of tuples, each containing a Document instance and its similarity score.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: MongoVectorStoreQueryExtension): Promise<[Document, number][]>;
    /**
     * Static method that creates a `MongoVectorStore` instance from an array
     * of texts. It creates Document instances from the texts and their
     * corresponding metadata, and then calls the `fromDocuments` method to
     * create the `MongoVectorStore` instance.
     * @param texts Array of texts to be converted into Document instances.
     * @param metadatas Array or single object of metadata corresponding to the texts.
     * @param embeddings Embeddings instance used to convert the texts into vectors.
     * @param dbConfig Configuration for the MongoDB database.
     * @returns Promise that resolves to a new MongoVectorStore instance.
     */
    static fromTexts(texts: string[], metadatas: object[] | object, embeddings: EmbeddingsInterface, dbConfig: MongoLibArgs): Promise<MongoVectorStore>;
    /**
     * Static method that creates a `MongoVectorStore` instance from an array
     * of Document instances. It creates a new `MongoVectorStore` instance,
     * adds the documents to it, and then returns the instance.
     * @param docs Array of Document instances to be added to the `MongoVectorStore`.
     * @param embeddings Embeddings instance used to convert the documents into vectors.
     * @param dbConfig Configuration for the MongoDB database.
     * @returns Promise that resolves to a new MongoVectorStore instance.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: MongoLibArgs): Promise<MongoVectorStore>;
}
