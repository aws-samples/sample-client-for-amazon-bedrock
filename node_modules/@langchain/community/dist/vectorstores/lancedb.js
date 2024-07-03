import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
/**
 * A wrapper for an open-source database for vector-search with persistent
 * storage. It simplifies retrieval, filtering, and management of
 * embeddings.
 */
export class LanceDB extends VectorStore {
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "textKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.table = args.table;
        this.embeddings = embeddings;
        this.textKey = args.textKey || "text";
    }
    /**
     * Adds documents to the database.
     * @param documents The documents to be added.
     * @returns A Promise that resolves when the documents have been added.
     */
    async addDocuments(documents) {
        const texts = documents.map(({ pageContent }) => pageContent);
        return this.addVectors(await this.embeddings.embedDocuments(texts), documents);
    }
    _vectorstoreType() {
        return "lancedb";
    }
    /**
     * Adds vectors and their corresponding documents to the database.
     * @param vectors The vectors to be added.
     * @param documents The corresponding documents to be added.
     * @returns A Promise that resolves when the vectors and documents have been added.
     */
    async addVectors(vectors, documents) {
        if (vectors.length === 0) {
            return;
        }
        if (vectors.length !== documents.length) {
            throw new Error(`Vectors and documents must have the same length`);
        }
        const data = [];
        for (let i = 0; i < documents.length; i += 1) {
            const record = {
                vector: vectors[i],
                [this.textKey]: documents[i].pageContent,
            };
            Object.keys(documents[i].metadata).forEach((metaKey) => {
                record[metaKey] = documents[i].metadata[metaKey];
            });
            data.push(record);
        }
        await this.table.add(data);
    }
    /**
     * Performs a similarity search on the vectors in the database and returns
     * the documents and their scores.
     * @param query The query vector.
     * @param k The number of results to return.
     * @returns A Promise that resolves with an array of tuples, each containing a Document and its score.
     */
    async similaritySearchVectorWithScore(query, k) {
        const results = await this.table.search(query).limit(k).execute();
        const docsAndScore = [];
        results.forEach((item) => {
            const metadata = {};
            Object.keys(item).forEach((key) => {
                if (key !== "vector" && key !== "score" && key !== this.textKey) {
                    metadata[key] = item[key];
                }
            });
            docsAndScore.push([
                new Document({
                    pageContent: item[this.textKey],
                    metadata,
                }),
                item.score,
            ]);
        });
        return docsAndScore;
    }
    /**
     * Creates a new instance of LanceDB from texts.
     * @param texts The texts to be converted into documents.
     * @param metadatas The metadata for the texts.
     * @param embeddings The embeddings to be managed.
     * @param dbConfig The configuration for the LanceDB instance.
     * @returns A Promise that resolves with a new instance of LanceDB.
     */
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(newDoc);
        }
        return LanceDB.fromDocuments(docs, embeddings, dbConfig);
    }
    /**
     * Creates a new instance of LanceDB from documents.
     * @param docs The documents to be added to the database.
     * @param embeddings The embeddings to be managed.
     * @param dbConfig The configuration for the LanceDB instance.
     * @returns A Promise that resolves with a new instance of LanceDB.
     */
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.addDocuments(docs);
        return instance;
    }
}
