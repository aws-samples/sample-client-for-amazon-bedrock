"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstraDBVectorStore = void 0;
const uuid = __importStar(require("uuid"));
const astra_db_ts_1 = require("@datastax/astra-db-ts");
const async_caller_1 = require("@langchain/core/utils/async_caller");
const documents_1 = require("@langchain/core/documents");
const chunk_array_1 = require("@langchain/core/utils/chunk_array");
const math_1 = require("@langchain/core/utils/math");
const vectorstores_1 = require("@langchain/core/vectorstores");
class AstraDBVectorStore extends vectorstores_1.VectorStore {
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
        this.astraDBClient = new astra_db_ts_1.AstraDB(token, endpoint, namespace);
        this.collectionName = collection;
        this.collectionOptions = collectionOptions;
        this.idKey = idKey ?? "_id";
        this.contentKey = contentKey ?? "text";
        this.batchSize = batchSize && batchSize <= 20 ? batchSize : 20;
        this.caller = new async_caller_1.AsyncCaller(callerArgs);
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
        const chunkedDocs = (0, chunk_array_1.chunkArray)(docs, this.batchSize);
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
            const doc = new documents_1.Document({
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
        const mmrIndexes = (0, math_1.maximalMarginalRelevance)(queryEmbedding, embeddingList, options.lambda, options.k);
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
            const doc = new documents_1.Document({
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
exports.AstraDBVectorStore = AstraDBVectorStore;
