import * as uuid from "uuid";
import { AstraDB } from "@datastax/astra-db-ts";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
import { Document } from "@langchain/core/documents";
import { chunkArray } from "@langchain/core/utils/chunk_array";
import { maximalMarginalRelevance } from "@langchain/core/utils/math";
import { VectorStore, } from "@langchain/core/vectorstores";
export class AstraDBVectorStore extends VectorStore {
    _vectorstoreType() {
        return "astradb";
    }
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "astraDBClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "collectionName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "collection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "collectionOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "idKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "contentKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // if undefined the entirety of the content aside from the id and embedding will be stored as content
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // insertMany has a limit of 20 documents
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { token, endpoint, collection, collectionOptions, namespace, idKey, contentKey, batchSize, ...callerArgs } = args;
        this.astraDBClient = new AstraDB(token, endpoint, namespace);
        this.collectionName = collection;
        this.collectionOptions = collectionOptions;
        this.idKey = idKey ?? "_id";
        this.contentKey = contentKey ?? "text";
        this.batchSize = batchSize && batchSize <= 20 ? batchSize : 20;
        this.caller = new AsyncCaller(callerArgs);
    }
    /**
     * Create a new collection in your Astra DB vector database and then connects to it.
     * If the collection already exists, it will connect to it as well.
     *
     * @returns Promise that resolves if connected to the collection.
     */
    async initialize() {
        await this.astraDBClient.createCollection(this.collectionName, this.collectionOptions);
        this.collection = await this.astraDBClient.collection(this.collectionName);
        console.debug("Connected to Astra DB collection");
    }
    /**
     * Method to save vectors to AstraDB.
     *
     * @param vectors Vectors to save.
     * @param documents The documents associated with the vectors.
     * @returns Promise that resolves when the vectors have been added.
     */
    async addVectors(vectors, documents, options) {
        if (!this.collection) {
            throw new Error("Must connect to a collection before adding vectors");
        }
        const docs = vectors.map((embedding, idx) => ({
            [this.idKey]: options?.[idx] ?? uuid.v4(),
            [this.contentKey]: documents[idx].pageContent,
            $vector: embedding,
            ...documents[idx].metadata,
        }));
        const chunkedDocs = chunkArray(docs, this.batchSize);
        const batchCalls = chunkedDocs.map((chunk) => this.caller.call(async () => this.collection?.insertMany(chunk)));
        await Promise.all(batchCalls);
    }
    /**
     * Method that adds documents to AstraDB.
     *
     * @param documents Array of documents to add to AstraDB.
     * @param options Optional ids for the documents.
     * @returns Promise that resolves the documents have been added.
     */
    async addDocuments(documents, options) {
        if (!this.collection) {
            throw new Error("Must connect to a collection before adding vectors");
        }
        return this.addVectors(await this.embeddings.embedDocuments(documents.map((d) => d.pageContent)), documents, options);
    }
    /**
     * Method that deletes documents from AstraDB.
     *
     * @param params AstraDeleteParameters for the delete.
     * @returns Promise that resolves when the documents have been deleted.
     */
    async delete(params) {
        if (!this.collection) {
            throw new Error("Must connect to a collection before deleting");
        }
        for (const id of params.ids) {
            console.debug(`Deleting document with id ${id}`);
            await this.collection.deleteOne({
                [this.idKey]: id,
            });
        }
    }
    /**
     * Method that performs a similarity search in AstraDB and returns and similarity scores.
     *
     * @param query Query vector for the similarity search.
     * @param k Number of top results to return.
     * @param filter Optional filter to apply to the search.
     * @returns Promise that resolves with an array of documents and their scores.
     */
    async similaritySearchVectorWithScore(query, k, filter) {
        if (!this.collection) {
            throw new Error("Must connect to a collection before adding vectors");
        }
        const cursor = await this.collection.find(filter ?? {}, {
            sort: { $vector: query },
            limit: k,
            includeSimilarity: true,
        });
        const results = [];
        await cursor.forEach(async (row) => {
            const { $similarity: similarity, [this.contentKey]: content, ...metadata } = row;
            const doc = new Document({
                pageContent: content,
                metadata,
            });
            results.push([doc, similarity]);
        });
        return results;
    }
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK - Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {CollectionFilter} options.filter - Optional filter
     *
     * @returns {Promise<Document[]>} - List of documents selected by maximal marginal relevance.
     */
    async maxMarginalRelevanceSearch(query, options) {
        if (!this.collection) {
            throw new Error("Must connect to a collection before adding vectors");
        }
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const cursor = await this.collection.find(options.filter ?? {}, {
            sort: { $vector: queryEmbedding },
            limit: options.k,
            includeSimilarity: true,
        });
        const results = (await cursor.toArray()) ?? [];
        const embeddingList = results.map((row) => row.$vector);
        const mmrIndexes = maximalMarginalRelevance(queryEmbedding, embeddingList, options.lambda, options.k);
        const topMmrMatches = mmrIndexes.map((idx) => results[idx]);
        const docs = [];
        topMmrMatches.forEach((match) => {
            const { [this.contentKey]: content, ...metadata } = match;
            const doc = {
                pageContent: content,
                metadata,
            };
            docs.push(doc);
        });
        return docs;
    }
    /**
     * Static method to create an instance of AstraDBVectorStore from texts.
     *
     * @param texts The texts to use.
     * @param metadatas The metadata associated with the texts.
     * @param embeddings The embeddings to use.
     * @param dbConfig The arguments for the AstraDBVectorStore.
     * @returns Promise that resolves with a new instance of AstraDBVectorStore.
     */
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const doc = new Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(doc);
        }
        return AstraDBVectorStore.fromDocuments(docs, embeddings, dbConfig);
    }
    /**
     * Static method to create an instance of AstraDBVectorStore from documents.
     *
     * @param docs The Documents to use.
     * @param embeddings The embeddings to use.
     * @param dbConfig The arguments for the AstraDBVectorStore.
     * @returns Promise that resolves with a new instance of AstraDBVectorStore.
     */
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.initialize();
        await instance.addDocuments(docs);
        return instance;
    }
    /**
     * Static method to create an instance of AstraDBVectorStore from an existing index.
     *
     * @param embeddings The embeddings to use.
     * @param dbConfig The arguments for the AstraDBVectorStore.
     * @returns Promise that resolves with a new instance of AstraDBVectorStore.
     */
    static async fromExistingIndex(embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.initialize();
        return instance;
    }
}
