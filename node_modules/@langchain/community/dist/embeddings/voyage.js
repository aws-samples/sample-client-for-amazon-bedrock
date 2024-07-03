import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
/**
 * A class for generating embeddings using the Voyage AI API.
 */
export class VoyageEmbeddings extends Embeddings {
    /**
     * Constructor for the VoyageEmbeddings class.
     * @param fields - An optional object with properties to configure the instance.
     */
    constructor(fields) {
        const fieldsWithDefaults = { ...fields };
        super(fieldsWithDefaults);
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "voyage-01"
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 8
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "basePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.voyageai.com/v1"
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fieldsWithDefaults?.apiKey || getEnvironmentVariable("VOYAGEAI_API_KEY");
        if (!apiKey) {
            throw new Error("Voyage AI API key not found");
        }
        this.modelName = fieldsWithDefaults?.modelName ?? this.modelName;
        this.batchSize = fieldsWithDefaults?.batchSize ?? this.batchSize;
        this.apiKey = apiKey;
        this.apiUrl = `${this.basePath}/embeddings`;
    }
    /**
     * Generates embeddings for an array of texts.
     * @param texts - An array of strings to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    async embedDocuments(texts) {
        const batches = chunkArray(texts, this.batchSize);
        const batchRequests = batches.map((batch) => this.embeddingWithRetry({
            model: this.modelName,
            input: batch,
        }));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batch = batches[i];
            const { data: batchResponse } = batchResponses[i];
            for (let j = 0; j < batch.length; j += 1) {
                embeddings.push(batchResponse[j].embedding);
            }
        }
        return embeddings;
    }
    /**
     * Generates an embedding for a single text.
     * @param text - A string to generate an embedding for.
     * @returns A Promise that resolves to an array of numbers representing the embedding.
     */
    async embedQuery(text) {
        const { data } = await this.embeddingWithRetry({
            model: this.modelName,
            input: text,
        });
        return data[0].embedding;
    }
    /**
     * Makes a request to the Voyage AI API to generate embeddings for an array of texts.
     * @param request - An object with properties to configure the request.
     * @returns A Promise that resolves to the response from the Voyage AI API.
     */
    async embeddingWithRetry(request) {
        const makeCompletionRequest = async () => {
            const url = `${this.apiUrl}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                    ...this.headers,
                },
                body: JSON.stringify(request),
            });
            const json = await response.json();
            return json;
        };
        return this.caller.call(makeCompletionRequest);
    }
}
