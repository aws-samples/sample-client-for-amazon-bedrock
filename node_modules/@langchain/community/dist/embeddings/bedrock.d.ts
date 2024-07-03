import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
import type { CredentialType } from "../utils/bedrock.js";
/**
 * Interface that extends EmbeddingsParams and defines additional
 * parameters specific to the BedrockEmbeddings class.
 */
export interface BedrockEmbeddingsParams extends EmbeddingsParams {
    /**
     * Model Name to use. Defaults to `amazon.titan-embed-text-v1` if not provided
     *
     */
    model?: string;
    /**
     * A client provided by the user that allows them to customze any
     * SDK configuration options.
     */
    client?: BedrockRuntimeClient;
    region?: string;
    credentials?: CredentialType;
}
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
export declare class BedrockEmbeddings extends Embeddings implements BedrockEmbeddingsParams {
    model: string;
    client: BedrockRuntimeClient;
    batchSize: number;
    constructor(fields?: BedrockEmbeddingsParams);
    /**
     * Protected method to make a request to the Bedrock API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param request Request to send to the Bedrock API.
     * @returns Promise that resolves to the response from the API.
     */
    protected _embedText(text: string): Promise<number[]>;
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embedText
     * method with the document as the input.
     * @param document Document for which to generate an embedding.
     * @returns Promise that resolves to an embedding for the input document.
     */
    embedQuery(document: string): Promise<number[]>;
    /**
     * Method to generate embeddings for an array of texts. Calls _embedText
     * method which batches and handles retry logic when calling the AWS Bedrock API.
     * @param documents Array of texts for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents: string[]): Promise<number[][]>;
}
