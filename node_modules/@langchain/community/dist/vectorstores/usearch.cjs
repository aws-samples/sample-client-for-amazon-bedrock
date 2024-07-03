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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USearch = void 0;
const usearch_1 = __importDefault(require("usearch"));
const uuid = __importStar(require("uuid"));
const vectorstores_1 = require("@langchain/core/vectorstores");
const documents_1 = require("@langchain/core/documents");
const in_memory_js_1 = require("../stores/doc/in_memory.cjs");
/**
 * Class that extends `SaveableVectorStore` and provides methods for
 * adding documents and vectors to a `usearch` index, performing
 * similarity searches, and saving the index.
 */
class USearch extends vectorstores_1.SaveableVectorStore {
    _vectorstoreType() {
        return "usearch";
    }
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "_index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_mapping", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "docstore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "args", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.args = args;
        this._index = args.index;
        this._mapping = args.mapping ?? {};
        this.embeddings = embeddings;
        this.docstore = args?.docstore ?? new in_memory_js_1.SynchronousInMemoryDocstore();
    }
    /**
     * Method that adds documents to the `usearch` index. It generates
     * embeddings for the documents and adds them to the index.
     * @param documents An array of `Document` instances to be added to the index.
     * @returns A promise that resolves with an array of document IDs.
     */
    async addDocuments(documents) {
        const texts = documents.map(({ pageContent }) => pageContent);
        return this.addVectors(await this.embeddings.embedDocuments(texts), documents);
    }
    get index() {
        if (!this._index) {
            throw new Error("Vector store not initialised yet. Try calling `fromTexts` or `fromDocuments` first.");
        }
        return this._index;
    }
    set index(index) {
        this._index = index;
    }
    /**
     * Method that adds vectors to the `usearch` index. It also updates the
     * mapping between vector IDs and document IDs.
     * @param vectors An array of vectors to be added to the index.
     * @param documents An array of `Document` instances corresponding to the vectors.
     * @returns A promise that resolves with an array of document IDs.
     */
    async addVectors(vectors, documents) {
        if (vectors.length === 0) {
            return [];
        }
        if (vectors.length !== documents.length) {
            throw new Error(`Vectors and documents must have the same length`);
        }
        const dv = vectors[0].length;
        if (!this._index) {
            this._index = new usearch_1.default.Index({
                metric: "l2sq",
                connectivity: BigInt(16),
                dimensions: BigInt(dv),
            });
        }
        const d = this.index.dimensions();
        if (BigInt(dv) !== d) {
            throw new Error(`Vectors must have the same length as the number of dimensions (${d})`);
        }
        const docstoreSize = this.index.size();
        const documentIds = [];
        for (let i = 0; i < vectors.length; i += 1) {
            const documentId = uuid.v4();
            documentIds.push(documentId);
            const id = Number(docstoreSize) + i;
            this.index.add(BigInt(id), new Float32Array(vectors[i]));
            this._mapping[id] = documentId;
            this.docstore.add({ [documentId]: documents[i] });
        }
        return documentIds;
    }
    /**
     * Method that performs a similarity search in the `usearch` index. It
     * returns the `k` most similar documents to a given query vector, along
     * with their similarity scores.
     * @param query The query vector.
     * @param k The number of most similar documents to return.
     * @returns A promise that resolves with an array of tuples, each containing a `Document` and its similarity score.
     */
    async similaritySearchVectorWithScore(query, k) {
        const d = this.index.dimensions();
        if (BigInt(query.length) !== d) {
            throw new Error(`Query vector must have the same length as the number of dimensions (${d})`);
        }
        if (k > this.index.size()) {
            const total = this.index.size();
            console.warn(`k (${k}) is greater than the number of elements in the index (${total}), setting k to ${total}`);
            // eslint-disable-next-line no-param-reassign
            k = Number(total);
        }
        const result = this.index.search(new Float32Array(query), BigInt(k));
        const return_list = [];
        for (let i = 0; i < result.count; i += 1) {
            const uuid = this._mapping[Number(result.keys[i])];
            return_list.push([this.docstore.search(uuid), result.distances[i]]);
        }
        return return_list;
    }
    /**
     * Method that saves the `usearch` index and the document store to disk.
     * @param directory The directory where the index and document store should be saved.
     * @returns A promise that resolves when the save operation is complete.
     */
    async save(directory) {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        await fs.mkdir(directory, { recursive: true });
        await Promise.all([
            this.index.save(path.join(directory, "usearch.index")),
            await fs.writeFile(path.join(directory, "docstore.json"), JSON.stringify([
                Array.from(this.docstore._docs.entries()),
                this._mapping,
            ])),
        ]);
    }
    /**
     * Static method that creates a new `USearch` instance from a list of
     * texts. It generates embeddings for the texts and adds them to the
     * `usearch` index.
     * @param texts An array of texts to be added to the index.
     * @param metadatas Metadata associated with the texts.
     * @param embeddings An instance of `Embeddings` used to generate embeddings for the texts.
     * @param dbConfig Optional configuration for the document store.
     * @returns A promise that resolves with a new `USearch` instance.
     */
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new documents_1.Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(newDoc);
        }
        return this.fromDocuments(docs, embeddings, dbConfig);
    }
    /**
     * Static method that creates a new `USearch` instance from a list of
     * documents. It generates embeddings for the documents and adds them to
     * the `usearch` index.
     * @param docs An array of `Document` instances to be added to the index.
     * @param embeddings An instance of `Embeddings` used to generate embeddings for the documents.
     * @param dbConfig Optional configuration for the document store.
     * @returns A promise that resolves with a new `USearch` instance.
     */
    static async fromDocuments(docs, embeddings, dbConfig) {
        const args = {
            docstore: dbConfig?.docstore,
        };
        const instance = new this(embeddings, args);
        await instance.addDocuments(docs);
        return instance;
    }
}
exports.USearch = USearch;
