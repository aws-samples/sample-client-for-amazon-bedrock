import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * Interface representing the parameters for the SerpAPI loader. It
 * includes properties such as the search query and the API key.
 */
interface SerpAPIParameters {
    /**
     * Search Query
     */
    q: string;
    apiKey?: string;
}
/**
 * Class representing a document loader for loading search results from
 * the SerpAPI. It extends the BaseDocumentLoader class.
 * @example
 * ```typescript
 * const loader = new SerpAPILoader({ q: "{query}", apiKey: "{apiKey}" });
 * const docs = await loader.load();
 * ```
 */
export declare class SerpAPILoader extends BaseDocumentLoader {
    private apiKey;
    private searchQuery;
    constructor(params: SerpAPIParameters);
    /**
     * Builds the URL for the SerpAPI search request.
     * @returns The URL for the search request.
     */
    buildUrl(): string;
    /**
     * Extracts documents from the provided output.
     * @param output - The output to extract documents from.
     * @param responseType - The type of the response to extract documents from.
     * @returns An array of Documents.
     */
    private extractDocuments;
    /**
     * Processes the response data from the SerpAPI search request and converts it into an array of Documents.
     * @param data - The response data from the SerpAPI search request.
     * @returns An array of Documents.
     */
    processResponseData(data: Record<string, unknown>): Document[];
    /**
     * Fetches the data from the provided URL and returns it as a JSON object.
     * If an error occurs during the fetch operation, an exception is thrown with the error message.
     * @param url - The URL to fetch data from.
     * @returns A promise that resolves to the fetched data as a JSON object.
     * @throws An error if the fetch operation fails.
     */
    private fetchData;
    /**
     * Loads the search results from the SerpAPI.
     * @returns An array of Documents representing the search results.
     * @throws An error if the search results could not be loaded.
     */
    load(): Promise<Document[]>;
}
export {};
