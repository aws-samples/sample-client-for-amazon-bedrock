"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePaLMEmbeddings = void 0;
const generativelanguage_1 = require("@google-ai/generativelanguage");
const google_auth_library_1 = require("google-auth-library");
const embeddings_1 = require("@langchain/core/embeddings");
const env_1 = require("@langchain/core/utils/env");
/**
 * Class that extends the Embeddings class and provides methods for
 * generating embeddings using the Google Palm API.
 *
 * @example
 * ```typescript
 * const model = new GooglePaLMEmbeddings({
 *   apiKey: "<YOUR API KEY>",
 *   modelName: "models/embedding-gecko-001",
 * });
 *
 * // Embed a single query
 * const res = await model.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 *
 * // Embed multiple documents
 * const documentRes = await model.embedDocuments(["Hello world", "Bye bye"]);
 * console.log({ documentRes });
 * ```
 */
class GooglePaLMEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "models/embedding-gecko-001"
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.modelName = fields?.modelName ?? this.modelName;
        this.apiKey =
            fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("GOOGLE_PALM_API_KEY");
        if (!this.apiKey) {
            throw new Error("Please set an API key for Google Palm 2 in the environment variable GOOGLE_PALM_API_KEY or in the `apiKey` field of the GooglePalm constructor");
        }
        this.client = new generativelanguage_1.TextServiceClient({
            authClient: new google_auth_library_1.GoogleAuth().fromAPIKey(this.apiKey),
        });
    }
    async _embedText(text) {
        // replace newlines, which can negatively affect performance.
        const cleanedText = text.replace(/\n/g, " ");
        const res = await this.client.embedText({
            model: this.modelName,
            text: cleanedText,
        });
        return res[0].embedding?.value ?? [];
    }
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embedText
     * method with the document as the input.
     * @param document Document for which to generate an embedding.
     * @returns Promise that resolves to an embedding for the input document.
     */
    embedQuery(document) {
        return this.caller.callWithOptions({}, this._embedText.bind(this), document);
    }
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embedText method for each document in the array.
     * @param documents Array of documents for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents) {
        return Promise.all(documents.map((document) => this._embedText(document)));
    }
}
exports.GooglePaLMEmbeddings = GooglePaLMEmbeddings;
