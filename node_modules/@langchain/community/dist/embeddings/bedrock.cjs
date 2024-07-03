"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockEmbeddings = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const embeddings_1 = require("@langchain/core/embeddings");
/**
 * Class that extends the Embeddings class and provides methods for
 * generating embeddings using the Bedrock API.
 * @example
 * ```typescript
 * const embeddings = new BedrockEmbeddings({
 *   region: "your-aws-region",
 *   credentials: {
 *     accessKeyId: "your-access-key-id",
 *     secretAccessKey: "your-secret-access-key",
 *   },
 *   model: "amazon.titan-embed-text-v1",
 * });
 *
 * // Embed a query and log the result
 * const res = await embeddings.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 * ```
 */
class BedrockEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "model", {
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
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 512
        });
        this.model = fields?.model ?? "amazon.titan-embed-text-v1";
        this.client =
            fields?.client ??
                new client_bedrock_runtime_1.BedrockRuntimeClient({
                    region: fields?.region,
                    credentials: fields?.credentials,
                });
    }
    /**
     * Protected method to make a request to the Bedrock API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param request Request to send to the Bedrock API.
     * @returns Promise that resolves to the response from the API.
     */
    async _embedText(text) {
        return this.caller.call(async () => {
            try {
                // replace newlines, which can negatively affect performance.
                const cleanedText = text.replace(/\n/g, " ");
                const res = await this.client.send(new client_bedrock_runtime_1.InvokeModelCommand({
                    modelId: this.model,
                    body: JSON.stringify({
                        inputText: cleanedText,
                    }),
                    contentType: "application/json",
                    accept: "application/json",
                }));
                const body = new TextDecoder().decode(res.body);
                return JSON.parse(body).embedding;
            }
            catch (e) {
                console.error({
                    error: e,
                });
                // eslint-disable-next-line no-instanceof/no-instanceof
                if (e instanceof Error) {
                    throw new Error(`An error occurred while embedding documents with Bedrock: ${e.message}`);
                }
                throw new Error("An error occurred while embedding documents with Bedrock");
            }
        });
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
     * Method to generate embeddings for an array of texts. Calls _embedText
     * method which batches and handles retry logic when calling the AWS Bedrock API.
     * @param documents Array of texts for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    async embedDocuments(documents) {
        return Promise.all(documents.map((document) => this._embedText(document)));
    }
}
exports.BedrockEmbeddings = BedrockEmbeddings;
