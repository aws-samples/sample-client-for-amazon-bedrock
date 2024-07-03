import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
/**
 * Interface for TogetherAIEmbeddingsParams parameters. Extends EmbeddingsParams and
 * defines additional parameters specific to the TogetherAIEmbeddings class.
 */
export interface TogetherAIEmbeddingsParams extends EmbeddingsParams {
    /**
     * The API key to use for the TogetherAI API.
     * @default {process.env.TOGETHER_AI_API_KEY}
     */
    apiKey?: string;
    /**
     * Model name to use
     * @default {"togethercomputer/m2-bert-80M-8k-retrieval"}
     */
    modelName?: string;
    /**
     * Timeout to use when making requests to TogetherAI.
     * @default {undefined}
     */
    timeout?: number;
    /**
     * The maximum number of documents to embed in a single request.
     * @default {512}
     */
    batchSize?: number;
    /**
     * Whether to strip new lines from the input text. May not be suitable
     * for all use cases.
     * @default {false}
     */
    stripNewLines?: boolean;
}
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
export declare class TogetherAIEmbeddings extends Embeddings implements TogetherAIEmbeddingsParams {
    modelName: string;
    apiKey: string;
    batchSize: number;
    stripNewLines: boolean;
    timeout?: number;
    private embeddingsAPIUrl;
    constructor(fields?: Partial<TogetherAIEmbeddingsParams>);
    private constructHeaders;
    private constructBody;
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the TogetherAI API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(texts: string[]): Promise<number[][]>;
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param {string} text Document to generate an embedding for.
     * @returns {Promise<number[]>} Promise that resolves to an embedding for the document.
     */
    embedQuery(text: string): Promise<number[]>;
    /**
     * Private method to make a request to the TogetherAI API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param {string} input The input text to embed.
     * @returns Promise that resolves to the response from the API.
     * @TODO Figure out return type and statically type it.
     */
    private embeddingWithRetry;
}
