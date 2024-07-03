"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceInferenceEmbeddings = void 0;
const inference_1 = require("@huggingface/inference");
const embeddings_1 = require("@langchain/core/embeddings");
const env_1 = require("@langchain/core/utils/env");
/**
 * Class that extends the Embeddings class and provides methods for
 * generating embeddings using Hugging Face models through the
 * HuggingFaceInference API.
 */
class HuggingFaceInferenceEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "endpointUrl", {
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
        this.model = fields?.model ?? "BAAI/bge-base-en-v1.5";
        this.apiKey =
            fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("HUGGINGFACEHUB_API_KEY");
        this.endpointUrl = fields?.endpointUrl;
        this.client = this.endpointUrl
            ? new inference_1.HfInference(this.apiKey).endpoint(this.endpointUrl)
            : new inference_1.HfInference(this.apiKey);
    }
    async _embed(texts) {
        // replace newlines, which can negatively affect performance.
        const clean = texts.map((text) => text.replace(/\n/g, " "));
        return this.caller.call(() => this.client.featureExtraction({
            model: this.model,
            inputs: clean,
        }));
    }
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embed method
     * with the document as the input and returns the first embedding in the
     * resulting array.
     * @param document Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    embedQuery(document) {
        return this._embed([document]).then((embeddings) => embeddings[0]);
    }
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embed method with the documents as the input.
     * @param documents Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(documents) {
        return this._embed(documents);
    }
}
exports.HuggingFaceInferenceEmbeddings = HuggingFaceInferenceEmbeddings;
