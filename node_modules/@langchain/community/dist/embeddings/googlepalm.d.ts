import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
/**
 * Interface that extends EmbeddingsParams and defines additional
 * parameters specific to the GooglePaLMEmbeddings class.
 */
export interface GooglePaLMEmbeddingsParams extends EmbeddingsParams {
    /**
     * Model Name to use
     *
     * Note: The format must follow the pattern - `models/{model}`
     */
    modelName?: string;
    /**
     * Google Palm API key to use
     */
    apiKey?: string;
}
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
export declare class GooglePaLMEmbeddings extends Embeddings implements GooglePaLMEmbeddingsParams {
    apiKey?: string;
    modelName: string;
    private client;
    constructor(fields?: GooglePaLMEmbeddingsParams);
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
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embedText method for each document in the array.
     * @param documents Array of documents for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents: string[]): Promise<number[][]>;
}
