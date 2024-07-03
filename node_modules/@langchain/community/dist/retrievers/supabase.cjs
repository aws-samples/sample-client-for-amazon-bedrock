"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseHybridSearch = void 0;
const documents_1 = require("@langchain/core/documents");
const retrievers_1 = require("@langchain/core/retrievers");
/**
 * Class for performing hybrid search operations on a Supabase database.
 * It extends the `BaseRetriever` class and implements methods for
 * similarity search, keyword search, and hybrid search.
 */
class SupabaseHybridSearch extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "SupabaseHybridSearch";
    }
    constructor(embeddings, args) {
        super(args);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "supabase"]
        });
        Object.defineProperty(this, "similarityK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "query", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keywordK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "similarityQueryName", {
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
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keywordQueryName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "embeddings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.embeddings = embeddings;
        this.client = args.client;
        this.tableName = args.tableName || "documents";
        this.similarityQueryName = args.similarityQueryName || "match_documents";
        this.keywordQueryName = args.keywordQueryName || "kw_match_documents";
        this.similarityK = args.similarityK || 2;
        this.keywordK = args.keywordK || 2;
    }
    /**
     * Performs a similarity search on the Supabase database using the
     * provided query and returns the top 'k' similar documents.
     * @param query The query to use for the similarity search.
     * @param k The number of top similar documents to return.
     * @param _callbacks Optional callbacks to pass to the embedQuery method.
     * @returns A promise that resolves to an array of search results. Each result is a tuple containing a Document, its similarity score, and its ID.
     */
    async similaritySearch(query, k, _callbacks // implement passing to embedQuery later
    ) {
        const embeddedQuery = await this.embeddings.embedQuery(query);
        const matchDocumentsParams = {
            query_embedding: embeddedQuery,
            match_count: k,
        };
        if (Object.keys(this.metadata ?? {}).length > 0) {
            matchDocumentsParams.filter = this.metadata;
        }
        const { data: searches, error } = await this.client.rpc(this.similarityQueryName, matchDocumentsParams);
        if (error) {
            throw new Error(`Error searching for documents: ${error.code} ${error.message} ${error.details}`);
        }
        return searches.map((resp) => [
            new documents_1.Document({
                metadata: resp.metadata,
                pageContent: resp.content,
            }),
            resp.similarity,
            resp.id,
        ]);
    }
    /**
     * Performs a keyword search on the Supabase database using the provided
     * query and returns the top 'k' documents that match the keywords.
     * @param query The query to use for the keyword search.
     * @param k The number of top documents to return that match the keywords.
     * @returns A promise that resolves to an array of search results. Each result is a tuple containing a Document, its similarity score multiplied by 10, and its ID.
     */
    async keywordSearch(query, k) {
        const kwMatchDocumentsParams = {
            query_text: query,
            match_count: k,
        };
        const { data: searches, error } = await this.client.rpc(this.keywordQueryName, kwMatchDocumentsParams);
        if (error) {
            throw new Error(`Error searching for documents: ${error.code} ${error.message} ${error.details}`);
        }
        return searches.map((resp) => [
            new documents_1.Document({
                metadata: resp.metadata,
                pageContent: resp.content,
            }),
            resp.similarity * 10,
            resp.id,
        ]);
    }
    /**
     * Combines the results of the `similaritySearch` and `keywordSearch`
     * methods and returns the top 'k' documents based on a combination of
     * similarity and keyword matching.
     * @param query The query to use for the hybrid search.
     * @param similarityK The number of top similar documents to return.
     * @param keywordK The number of top documents to return that match the keywords.
     * @param callbacks Optional callbacks to pass to the similaritySearch method.
     * @returns A promise that resolves to an array of search results. Each result is a tuple containing a Document, its combined score, and its ID.
     */
    async hybridSearch(query, similarityK, keywordK, callbacks) {
        const similarity_search = this.similaritySearch(query, similarityK, callbacks);
        const keyword_search = this.keywordSearch(query, keywordK);
        return Promise.all([similarity_search, keyword_search])
            .then((results) => results.flat())
            .then((results) => {
            const picks = new Map();
            results.forEach((result) => {
                const id = result[2];
                const nextScore = result[1];
                const prevScore = picks.get(id)?.[1];
                if (prevScore === undefined || nextScore > prevScore) {
                    picks.set(id, result);
                }
            });
            return Array.from(picks.values());
        })
            .then((results) => results.sort((a, b) => b[1] - a[1]));
    }
    async _getRelevantDocuments(query, runManager) {
        const searchResults = await this.hybridSearch(query, this.similarityK, this.keywordK, runManager?.getChild("hybrid_search"));
        return searchResults.map(([doc]) => doc);
    }
}
exports.SupabaseHybridSearch = SupabaseHybridSearch;
