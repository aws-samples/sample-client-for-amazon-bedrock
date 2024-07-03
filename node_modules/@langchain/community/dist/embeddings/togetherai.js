import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
/**
 * Class for generating embeddings using the TogetherAI API. Extends the
 * Embeddings class and implements TogetherAIEmbeddingsParams.
 * @example
 * ```typescript
 * const embeddings = new TogetherAIEmbeddings({
 *   apiKey: process.env.TOGETHER_AI_API_KEY, // Default value
 *   model: "togethercomputer/m2-bert-80M-8k-retrieval", // Default value
 * });
 * const res = await embeddings.embedQuery(
 *   "What would be a good company name a company that makes colorful socks?"
 * );
 * ```
 */
export class TogetherAIEmbeddings extends Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "togethercomputer/m2-bert-80M-8k-retrieval"
        });
        Object.defineProperty(this, "apiKey", {
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
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "embeddingsAPIUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.together.xyz/api/v1/embeddings"
        });
        const apiKey = fields?.apiKey ?? getEnvironmentVariable("TOGETHER_AI_API_KEY");
        if (!apiKey) {
            throw new Error("TOGETHER_AI_API_KEY not found.");
        }
        this.apiKey = apiKey;
        this.modelName = fields?.modelName ?? this.modelName;
        this.timeout = fields?.timeout;
        this.batchSize = fields?.batchSize ?? this.batchSize;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
    }
    constructHeaders() {
        return {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };
    }
    constructBody(input) {
        const body = {
            model: this?.modelName,
            input,
        };
        return body;
    }
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the TogetherAI API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    async embedDocuments(texts) {
        const batches = chunkArray(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
        let batchResponses = [];
        for await (const batch of batches) {
            const batchRequests = batch.map((item) => this.embeddingWithRetry(item));
            const response = await Promise.all(batchRequests);
            batchResponses = batchResponses.concat(response);
        }
        const embeddings = batchResponses.map((response) => response.data[0].embedding);
        return embeddings;
    }
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param {string} text Document to generate an embedding for.
     * @returns {Promise<number[]>} Promise that resolves to an embedding for the document.
     */
    async embedQuery(text) {
        const { data } = await this.embeddingWithRetry(this.stripNewLines ? text.replace(/\n/g, " ") : text);
        return data[0].embedding;
    }
    /**
     * Private method to make a request to the TogetherAI API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param {string} input The input text to embed.
     * @returns Promise that resolves to the response from the API.
     * @TODO Figure out return type and statically type it.
     */
    async embeddingWithRetry(input) {
        const body = JSON.stringify(this.constructBody(input));
        const headers = this.constructHeaders();
        return this.caller.call(async () => {
            const fetchResponse = await fetch(this.embeddingsAPIUrl, {
                method: "POST",
                headers,
                body,
            });
            if (fetchResponse.status === 200) {
                return fetchResponse.json();
            }
            throw new Error(`Error getting prompt completion from Together AI. ${JSON.stringify(await fetchResponse.json(), null, 2)}`);
        });
    }
}
