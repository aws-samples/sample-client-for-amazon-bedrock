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
exports.AzureAISearchVectorStore = exports.AzureAISearchQueryType = void 0;
const uuid = __importStar(require("uuid"));
const search_documents_1 = require("@azure/search-documents");
const vectorstores_1 = require("@langchain/core/vectorstores");
const documents_1 = require("@langchain/core/documents");
const math_1 = require("@langchain/core/utils/math");
const env_1 = require("@langchain/core/utils/env");
/**
 * Azure AI Search query type.
 */
exports.AzureAISearchQueryType = {
    /** Vector search. */
    Similarity: "similarity",
    /** Hybrid full text and vector search. */
    SimilarityHybrid: "similarity_hybrid",
    /** Hybrid full text and vector search with semantic ranking. */
    SemanticHybrid: "semantic_hybrid",
};
const USER_AGENT_PREFIX = "langchainjs-azure-aisearch";
const DEFAULT_FIELD_ID = "id";
const DEFAULT_FIELD_CONTENT = "content";
const DEFAULT_FIELD_CONTENT_VECTOR = "content_vector";
const DEFAULT_FIELD_METADATA = "metadata";
const DEFAULT_FIELD_METADATA_SOURCE = "source";
const DEFAULT_FIELD_METADATA_ATTRS = "attributes";
/**
 * Azure AI Search vector store.
 * To use this, you should have:
 * - the `@azure/search-documents` NPM package installed
 * - an endpoint and key to the Azure AI Search instance
 *
 * If you directly provide a `SearchClient` instance, you need to ensure that
 * an index has been created. When using and endpoint and key, the index will
 * be created automatically if it does not exist.
 */
class AzureAISearchVectorStore extends vectorstores_1.VectorStore {
    get lc_secrets() {
        return {
            endpoint: "AZURE_AISEARCH_ENDPOINT",
            key: "AZURE_AISEARCH_KEY",
        };
    }
    _vectorstoreType() {
        return "azure_aisearch";
    }
    constructor(embeddings, config) {
        super(embeddings, config);
        Object.defineProperty(this, "initPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "indexName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const endpoint = config.endpoint ?? (0, env_1.getEnvironmentVariable)("AZURE_AISEARCH_ENDPOINT");
        const key = config.key ?? (0, env_1.getEnvironmentVariable)("AZURE_AISEARCH_KEY");
        if (!config.client && (!endpoint || !key)) {
            throw new Error("Azure AI Search client or endpoint and key must be set.");
        }
        this.indexName = config.indexName ?? "vectorsearch";
        if (!config.client) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const credential = new search_documents_1.AzureKeyCredential(key);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.client = new search_documents_1.SearchClient(endpoint, this.indexName, credential, {
                userAgentOptions: { userAgentPrefix: USER_AGENT_PREFIX },
            });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const indexClient = new search_documents_1.SearchIndexClient(endpoint, credential, {
                userAgentOptions: { userAgentPrefix: USER_AGENT_PREFIX },
            });
            // Start initialization, but don't wait for it to finish here
            this.initPromise = this.ensureIndexExists(indexClient).catch((error) => {
                console.error("Error during Azure AI Search index initialization:", error);
            });
        }
        else {
            this.client = config.client;
        }
        this.options = config.search;
        this.embeddings = embeddings;
    }
    /**
     * Removes specified documents from the AzureAISearchVectorStore using IDs or a filter.
     * @param params Object that includes either an array of IDs or a filter for the data to be deleted.
     * @returns A promise that resolves when the documents have been removed.
     */
    async delete(params) {
        if (!params.ids && !params.filter) {
            throw new Error(`Azure AI Search delete requires either "ids" or "filter" to be set in the params object`);
        }
        if (params.ids) {
            await this.deleteById(params.ids);
        }
        if (params.filter) {
            await this.deleteMany(params.filter);
        }
    }
    /**
     * Removes specified documents from the AzureAISearchVectorStore using a filter.
     * @param filter Filter options to find documents to delete.
     * @returns A promise that resolves when the documents have been removed.
     */
    async deleteMany(filter) {
        if (!filter.filterExpression) {
            throw new Error(`Azure AI Search deleteMany requires "filterExpression" to be set in the filter object`);
        }
        const { results } = await this.client.search("*", {
            filter: filter.filterExpression,
        });
        const docs = [];
        for await (const item of results) {
            docs.push(item.document);
        }
        const deleteResults = [];
        const bufferedClient = new search_documents_1.SearchIndexingBufferedSender(this.client, (entity) => entity.id);
        bufferedClient.on("batchSucceeded", (response) => {
            deleteResults.push(...response.results);
        });
        bufferedClient.on("batchFailed", (response) => {
            throw new Error(`Azure AI Search deleteDocuments batch failed: ${response}`);
        });
        await bufferedClient.deleteDocuments(docs);
        await bufferedClient.flush();
        await bufferedClient.dispose();
        return deleteResults;
    }
    /**
     * Removes specified documents from the AzureAISearchVectorStore.
     * @param ids IDs of the documents to be removed.
     * @returns A promise that resolves when the documents have been removed.
     */
    async deleteById(ids) {
        await this.initPromise;
        const docsIds = Array.isArray(ids) ? ids : [ids];
        const docs = docsIds.map((id) => ({ id }));
        const deleteResults = [];
        const bufferedClient = new search_documents_1.SearchIndexingBufferedSender(this.client, (entity) => entity.id);
        bufferedClient.on("batchSucceeded", (response) => {
            deleteResults.push(...response.results);
        });
        bufferedClient.on("batchFailed", (response) => {
            throw new Error(`Azure AI Search deleteDocuments batch failed: ${response}`);
        });
        await bufferedClient.deleteDocuments(docs);
        await bufferedClient.flush();
        await bufferedClient.dispose();
        return deleteResults;
    }
    /**
     * Adds documents to the AzureAISearchVectorStore.
     * @param documents The documents to add.
     * @param options Options for adding documents.
     * @returns A promise that resolves to the ids of the added documents.
     */
    async addDocuments(documents, options) {
        const texts = documents.map(({ pageContent }) => pageContent);
        const embeddings = await this.embeddings.embedDocuments(texts);
        const results = await this.addVectors(embeddings, documents, options);
        return results;
    }
    /**
     * Adds vectors to the AzureAISearchVectorStore.
     * @param vectors Vectors to be added.
     * @param documents Corresponding documents to be added.
     * @param options Options for adding documents.
     * @returns A promise that resolves to the ids of the added documents.
     */
    async addVectors(vectors, documents, options) {
        const ids = options?.ids ?? documents.map(() => uuid.v4());
        const entities = documents.map((doc, idx) => ({
            id: ids[idx],
            content: doc.pageContent,
            content_vector: vectors[idx],
            metadata: {
                source: doc.metadata?.source,
                attributes: doc.metadata?.attributes ?? [],
            },
        }));
        await this.initPromise;
        const bufferedClient = new search_documents_1.SearchIndexingBufferedSender(this.client, (entity) => entity.id);
        bufferedClient.on("batchFailed", (response) => {
            throw new Error(`Azure AI Search uploadDocuments batch failed: ${response}`);
        });
        await bufferedClient.uploadDocuments(entities);
        await bufferedClient.flush();
        await bufferedClient.dispose();
        return ids;
    }
    /**
     * Performs a similarity search using query type specified in configuration.
     * @param query Query text for the similarity search.
     * @param k=4 Number of nearest neighbors to return.
     * @param filter Optional filter options for the documents.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    async similaritySearch(query, k = 4, filter = undefined) {
        const results = await this.similaritySearchWithScore(query, k, filter);
        return results.map((result) => result[0]);
    }
    /**
     * Performs a similarity search using query type specified in configuration.
     * @param query Query text for the similarity search.
     * @param k=4 Number of nearest neighbors to return.
     * @param filter Optional filter options for the documents.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    async similaritySearchWithScore(query, k = 4, filter = undefined) {
        const searchType = this.options.type;
        if (searchType === exports.AzureAISearchQueryType.Similarity) {
            return this.similaritySearchVectorWithScore(await this.embeddings.embedQuery(query), k, filter);
        }
        else if (searchType === exports.AzureAISearchQueryType.SimilarityHybrid) {
            return this.hybridSearchVectorWithScore(query, await this.embeddings.embedQuery(query), k, filter);
        }
        else if (searchType === exports.AzureAISearchQueryType.SemanticHybrid) {
            return this.semanticHybridSearchVectorWithScore(query, await this.embeddings.embedQuery(query), k, filter);
        }
        throw new Error(`Unrecognized search type '${searchType}'`);
    }
    /**
     * Performs a hybrid search using query text.
     * @param query Query text for the similarity search.
     * @param queryVector Query vector for the similarity search.
     *    If not provided, the query text will be embedded.
     * @param k=4 Number of nearest neighbors to return.
     * @param filter Optional filter options for the documents.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    async hybridSearchVectorWithScore(query, queryVector, k = 4, filter = undefined) {
        const vector = queryVector ?? (await this.embeddings.embedQuery(query));
        await this.initPromise;
        const { results } = await this.client.search(query, {
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        vector,
                        kNearestNeighborsCount: k,
                        fields: [DEFAULT_FIELD_CONTENT_VECTOR],
                    },
                ],
                filterMode: filter?.vectorFilterMode,
            },
            filter: filter?.filterExpression,
            top: k,
        });
        const docsWithScore = [];
        for await (const item of results) {
            const document = new documents_1.Document({
                pageContent: item.document[DEFAULT_FIELD_CONTENT],
                metadata: {
                    ...item.document[DEFAULT_FIELD_METADATA],
                },
            });
            if (filter?.includeEmbeddings) {
                document.metadata.embedding =
                    item.document[DEFAULT_FIELD_CONTENT_VECTOR];
            }
            docsWithScore.push([document, item.score]);
        }
        return docsWithScore;
    }
    /**
     * Performs a hybrid search with semantic reranker using query text.
     * @param query Query text for the similarity search.
     * @param queryVector Query vector for the similarity search.
     *    If not provided, the query text will be embedded.
     * @param k=4 Number of nearest neighbors to return.
     * @param filter Optional filter options for the documents.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    async semanticHybridSearchVectorWithScore(query, queryVector, k = 4, filter = undefined) {
        const vector = queryVector ?? (await this.embeddings.embedQuery(query));
        await this.initPromise;
        const { results } = await this.client.search(query, {
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        vector,
                        kNearestNeighborsCount: k,
                        fields: [DEFAULT_FIELD_CONTENT_VECTOR],
                    },
                ],
                filterMode: filter?.vectorFilterMode,
            },
            filter: filter?.filterExpression,
            top: k,
            queryType: "semantic",
            semanticSearchOptions: {
                configurationName: "semantic-search-config",
            },
        });
        const docsWithScore = [];
        for await (const item of results) {
            const document = new documents_1.Document({
                pageContent: item.document[DEFAULT_FIELD_CONTENT],
                metadata: {
                    ...item.document[DEFAULT_FIELD_METADATA],
                },
            });
            if (filter?.includeEmbeddings) {
                document.metadata.embedding =
                    item.document[DEFAULT_FIELD_CONTENT_VECTOR];
            }
            docsWithScore.push([document, item.score]);
        }
        return docsWithScore;
    }
    /**
     * Performs a similarity search on the vectors stored in the collection.
     * @param queryVector Query vector for the similarity search.
     * @param k=4 Number of nearest neighbors to return.
     * @param filter Optional filter options for the documents.
     * @returns Promise that resolves to a list of documents and their corresponding similarity scores.
     */
    async similaritySearchVectorWithScore(query, k, filter) {
        await this.initPromise;
        const { results } = await this.client.search("*", {
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        vector: query,
                        kNearestNeighborsCount: k,
                        fields: [DEFAULT_FIELD_CONTENT_VECTOR],
                    },
                ],
                filterMode: filter?.vectorFilterMode,
            },
            filter: filter?.filterExpression,
        });
        const docsWithScore = [];
        for await (const item of results) {
            const document = new documents_1.Document({
                pageContent: item.document[DEFAULT_FIELD_CONTENT],
                metadata: {
                    ...item.document[DEFAULT_FIELD_METADATA],
                },
            });
            if (filter?.includeEmbeddings) {
                document.metadata.embedding =
                    item.document[DEFAULT_FIELD_CONTENT_VECTOR];
            }
            docsWithScore.push([document, item.score]);
        }
        return docsWithScore;
    }
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
    async maxMarginalRelevanceSearch(query, options) {
        const { k, fetchK = 20, lambda = 0.5 } = options;
        const includeEmbeddingsFlag = options.filter?.includeEmbeddings || false;
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const docs = await this.similaritySearchVectorWithScore(queryEmbedding, fetchK, {
            ...options.filter,
            includeEmbeddings: true,
        });
        const embeddingList = docs.map((doc) => doc[0].metadata.embedding);
        // Re-rank the results using MMR
        const mmrIndexes = (0, math_1.maximalMarginalRelevance)(queryEmbedding, embeddingList, lambda, k);
        return mmrIndexes.map((index) => {
            const doc = docs[index][0];
            // Remove embeddings if they were not requested originally
            if (!includeEmbeddingsFlag) {
                delete doc.metadata.embedding;
            }
            return doc;
        });
    }
    /**
     * Ensures that an index exists on the AzureAISearchVectorStore.
     * @param indexClient The Azure AI Search index client.
     * @returns A promise that resolves when the AzureAISearchVectorStore index has been initialized.
     * @protected
     */
    async ensureIndexExists(indexClient) {
        try {
            await indexClient.getIndex(this.indexName);
        }
        catch (e) {
            // Index does not exists, create it
            const searchIndex = await this.createSearchIndexDefinition(this.indexName);
            await indexClient.createIndex(searchIndex);
        }
    }
    /**
     * Prepares the search index definition for Azure AI Search.
     * @param indexName The name of the index.
     * @returns The SearchIndex object.
     * @protected
     */
    async createSearchIndexDefinition(indexName) {
        // Embed a test query to get the embedding dimensions
        const testEmbedding = await this.embeddings.embedQuery("test");
        const embeddingDimensions = testEmbedding.length;
        return {
            name: indexName,
            vectorSearch: {
                algorithms: [
                    {
                        name: "vector-search-algorithm",
                        kind: "hnsw",
                        parameters: {
                            m: 4,
                            efSearch: 500,
                            metric: "cosine",
                            efConstruction: 400,
                        },
                    },
                ],
                profiles: [
                    {
                        name: "vector-search-profile",
                        algorithmConfigurationName: "vector-search-algorithm",
                    },
                ],
            },
            semanticSearch: {
                defaultConfigurationName: "semantic-search-config",
                configurations: [
                    {
                        name: "semantic-search-config",
                        prioritizedFields: {
                            contentFields: [
                                {
                                    name: DEFAULT_FIELD_CONTENT,
                                },
                            ],
                            keywordsFields: [
                                {
                                    name: DEFAULT_FIELD_CONTENT,
                                },
                            ],
                        },
                    },
                ],
            },
            fields: [
                {
                    name: DEFAULT_FIELD_ID,
                    filterable: true,
                    key: true,
                    type: "Edm.String",
                },
                {
                    name: DEFAULT_FIELD_CONTENT,
                    searchable: true,
                    filterable: true,
                    type: "Edm.String",
                },
                {
                    name: DEFAULT_FIELD_CONTENT_VECTOR,
                    searchable: true,
                    type: "Collection(Edm.Single)",
                    vectorSearchDimensions: embeddingDimensions,
                    vectorSearchProfileName: "vector-search-profile",
                },
                {
                    name: DEFAULT_FIELD_METADATA,
                    type: "Edm.ComplexType",
                    fields: [
                        {
                            name: DEFAULT_FIELD_METADATA_SOURCE,
                            type: "Edm.String",
                            filterable: true,
                        },
                        {
                            name: DEFAULT_FIELD_METADATA_ATTRS,
                            type: "Collection(Edm.ComplexType)",
                            fields: [
                                {
                                    name: "key",
                                    type: "Edm.String",
                                    filterable: true,
                                },
                                {
                                    name: "value",
                                    type: "Edm.String",
                                    filterable: true,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }
    /**
     * Static method to create an instance of AzureAISearchVectorStore from a
     * list of texts. It first converts the texts to vectors and then adds
     * them to the collection.
     * @param texts List of texts to be converted to vectors.
     * @param metadatas Metadata for the texts.
     * @param embeddings Embeddings to be used for conversion.
     * @param config Database configuration for Azure AI Search.
     * @returns Promise that resolves to a new instance of AzureAISearchVectorStore.
     */
    static async fromTexts(texts, metadatas, embeddings, config) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new documents_1.Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(newDoc);
        }
        return AzureAISearchVectorStore.fromDocuments(docs, embeddings, config);
    }
    /**
     * Static method to create an instance of AzureAISearchVectorStore from a
     * list of documents. It first converts the documents to vectors and then
     * adds them to the database.
     * @param docs List of documents to be converted to vectors.
     * @param embeddings Embeddings to be used for conversion.
     * @param config Database configuration for Azure AI Search.
     * @returns Promise that resolves to a new instance of AzureAISearchVectorStore.
     */
    static async fromDocuments(docs, embeddings, config, options) {
        const instance = new this(embeddings, config);
        await instance.addDocuments(docs, options);
        return instance;
    }
}
exports.AzureAISearchVectorStore = AzureAISearchVectorStore;
