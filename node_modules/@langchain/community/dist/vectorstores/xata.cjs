"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XataVectorSearch = void 0;
const vectorstores_1 = require("@langchain/core/vectorstores");
const documents_1 = require("@langchain/core/documents");
/**
 * Class for interacting with a Xata database as a VectorStore. Provides
 * methods to add documents and vectors to the database, delete entries,
 * and perform similarity searches.
 */
class XataVectorSearch extends vectorstores_1.VectorStore {
    _vectorstoreType() {
        return "xata";
    }
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = args.client;
        this.table = args.table;
    }
    /**
     * Method to add documents to the Xata database. Maps the page content of
     * each document, embeds the documents using the embeddings, and adds the
     * vectors to the database.
     * @param documents Array of documents to be added.
     * @param options Optional object containing an array of ids.
     * @returns Promise resolving to an array of ids of the added documents.
     */
    async addDocuments(documents, options) {
        const texts = documents.map(({ pageContent }) => pageContent);
        return this.addVectors(await this.embeddings.embedDocuments(texts), documents, options);
    }
    /**
     * Method to add vectors to the Xata database. Maps each vector to a row
     * with the document's content, embedding, and metadata. Creates or
     * replaces these rows in the Xata database.
     * @param vectors Array of vectors to be added.
     * @param documents Array of documents corresponding to the vectors.
     * @param options Optional object containing an array of ids.
     * @returns Promise resolving to an array of ids of the added vectors.
     */
    async addVectors(vectors, documents, options) {
        const rows = vectors
            .map((embedding, idx) => ({
            content: documents[idx].pageContent,
            embedding,
            ...documents[idx].metadata,
        }))
            .map((row, idx) => {
            if (options?.ids) {
                return { id: options.ids[idx], ...row };
            }
            return row;
        });
        const res = await this.client.db[this.table].createOrReplace(rows);
        // Since we have an untyped BaseClient, it doesn't know the
        // actual return type of the overload.
        const results = res;
        const returnedIds = results.map((row) => row.id);
        return returnedIds;
    }
    /**
     * Method to delete entries from the Xata database. Deletes the entries
     * with the provided ids.
     * @param params Object containing an array of ids of the entries to be deleted.
     * @returns Promise resolving to void.
     */
    async delete(params) {
        const { ids } = params;
        await this.client.db[this.table].delete(ids);
    }
    /**
     * Method to perform a similarity search in the Xata database. Returns the
     * k most similar documents along with their scores.
     * @param query Query vector for the similarity search.
     * @param k Number of most similar documents to return.
     * @param filter Optional filter for the search.
     * @returns Promise resolving to an array of tuples, each containing a Document and its score.
     */
    async similaritySearchVectorWithScore(query, k, filter) {
        const { records } = await this.client.db[this.table].vectorSearch("embedding", query, {
            size: k,
            filter,
        });
        return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        records?.map((record) => [
            new documents_1.Document({
                pageContent: record.content,
                metadata: Object.fromEntries(Object.entries(record).filter(([key]) => key !== "content" &&
                    key !== "embedding" &&
                    key !== "xata" &&
                    key !== "id")),
            }),
            record.xata.score,
        ]) ?? []);
    }
}
exports.XataVectorSearch = XataVectorSearch;
