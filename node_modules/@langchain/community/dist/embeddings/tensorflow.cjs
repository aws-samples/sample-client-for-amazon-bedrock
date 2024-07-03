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
exports.TensorFlowEmbeddings = void 0;
const universal_sentence_encoder_1 = require("@tensorflow-models/universal-sentence-encoder");
const tf = __importStar(require("@tensorflow/tfjs-core"));
const embeddings_1 = require("@langchain/core/embeddings");
/**
 * Class that extends the Embeddings class and provides methods for
 * generating embeddings using the Universal Sentence Encoder model from
 * TensorFlow.js.
 * @example
 * ```typescript
 * const embeddings = new TensorFlowEmbeddings();
 * const store = new MemoryVectorStore(embeddings);
 *
 * const documents = [
 *   "A document",
 *   "Some other piece of text",
 *   "One more",
 *   "And another",
 * ];
 *
 * await store.addDocuments(
 *   documents.map((pageContent) => new Document({ pageContent }))
 * );
 * ```
 */
class TensorFlowEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "_cached", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        try {
            tf.backend();
        }
        catch (e) {
            throw new Error("No TensorFlow backend found, see instructions at ...");
        }
    }
    /**
     * Private method that loads the Universal Sentence Encoder model if it
     * hasn't been loaded already. It returns a promise that resolves to the
     * loaded model.
     * @returns Promise that resolves to the loaded Universal Sentence Encoder model.
     */
    async load() {
        if (this._cached === undefined) {
            this._cached = (0, universal_sentence_encoder_1.load)();
        }
        return this._cached;
    }
    _embed(texts) {
        return this.caller.call(async () => {
            const model = await this.load();
            return model.embed(texts);
        });
    }
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embed method
     * with the document as the input and processes the result to return a
     * single embedding.
     * @param document Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the input document.
     */
    embedQuery(document) {
        return this._embed([document])
            .then((embeddings) => embeddings.array())
            .then((embeddings) => embeddings[0]);
    }
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embed method with the documents as the input and processes the
     * result to return the embeddings.
     * @param documents Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents) {
        return this._embed(documents).then((embeddings) => embeddings.array());
    }
}
exports.TensorFlowEmbeddings = TensorFlowEmbeddings;
