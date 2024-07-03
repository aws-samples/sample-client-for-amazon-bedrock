"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchApiLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const env_1 = require("@langchain/core/utils/env");
const base_js_1 = require("../base.cjs");
/**
 * Class representing a document loader for loading search results from
 * the SearchApi. It extends the BaseDocumentLoader class.
 * @example
 * ```typescript
 * const loader = new SearchApiLoader({
 *   q: "{query}",
 *   apiKey: "{apiKey}",
 *   engine: "google",
 * });
 * const docs = await loader.load();
 * ```
 */
class SearchApiLoader extends base_js_1.BaseDocumentLoader {
    constructor(params) {
        super();
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "parameters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { apiKey = (0, env_1.getEnvironmentVariable)("SEARCHAPI_API_KEY") } = params;
        if (typeof apiKey !== "string") {
            throw new Error("Invalid type for apiKey. Expected string.");
        }
        if (!apiKey) {
            throw new Error("SearchApi API key not set. You can set it as SEARCHAPI_API_KEY in your .env file, or pass it to SearchApi.");
        }
        this.apiKey = apiKey;
        this.parameters = { ...params };
    }
    /**
     * Builds the URL for the SearchApi search request.
     * @returns The URL for the search request.
     */
    buildUrl() {
        this.parameters = {
            engine: "google",
            api_key: this.apiKey,
            ...this.parameters,
        };
        const preparedParams = Object.entries(this.parameters)
            .filter(([key, value]) => value !== undefined && value !== null && key !== "apiKey")
            .map(([key, value]) => [key, `${value}`]);
        const searchParams = new URLSearchParams(preparedParams);
        return `https://www.searchapi.io/api/v1/search?${searchParams}`;
    }
    /**
     * Extracts documents from the provided output.
     * @param output - The output to extract documents from.
     * @param responseType - The type of the response to extract documents from.
     * @returns An array of Documents.
     */
    extractDocuments(output, responseType) {
        const documents = [];
        const results = Array.isArray(output) ? output : [output];
        if (responseType === "transcripts") {
            const pageContent = results.map((result) => result.text).join("\n");
            const metadata = {
                source: "SearchApi",
                responseType,
            };
            documents.push(new documents_1.Document({ pageContent, metadata }));
        }
        else {
            for (const result of results) {
                const pageContent = JSON.stringify(result);
                const metadata = {
                    source: "SearchApi",
                    responseType,
                };
                documents.push(new documents_1.Document({ pageContent, metadata }));
            }
        }
        return documents;
    }
    /**
     * Processes the response data from the SearchApi search request and converts it into an array of Documents.
     * @param data - The response data from the SearchApi search request.
     * @returns An array of Documents.
     */
    processResponseData(data) {
        const documents = [];
        const responseTypes = [
            "answer_box",
            "shopping_results",
            "knowledge_graph",
            "organic_results",
            "transcripts",
        ];
        for (const responseType of responseTypes) {
            if (responseType in data) {
                documents.push(...this.extractDocuments(data[responseType], responseType));
            }
        }
        return documents;
    }
    /**
     * Fetches the data from the provided URL and returns it as a JSON object.
     * If an error occurs during the fetch operation, an exception is thrown with the error message.
     * @param url - The URL to fetch data from.
     * @returns A promise that resolves to the fetched data as a JSON object.
     * @throws An error if the fetch operation fails.
     */
    async fetchData(url) {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            throw new Error(`Failed to load search results from SearchApi due to: ${data.error}`);
        }
        return data;
    }
    /**
     * Loads the search results from the SearchApi.
     * @returns An array of Documents representing the search results.
     * @throws An error if the search results could not be loaded.
     */
    async load() {
        const url = this.buildUrl();
        const data = await this.fetchData(url);
        try {
            return this.processResponseData(data);
        }
        catch (error) {
            console.error(error);
            throw new Error(`Failed to process search results from SearchApi: ${error}`);
        }
    }
}
exports.SearchApiLoader = SearchApiLoader;
