import { Tool } from "@langchain/core/tools";
/**
 * Interface for the parameters that can be passed to the
 * WikipediaQueryRun constructor.
 */
export interface WikipediaQueryRunParams {
    topKResults?: number;
    maxDocContentLength?: number;
    baseUrl?: string;
}
/**
 * Type alias for URL parameters. Represents a record where keys are
 * strings and values can be string, number, boolean, undefined, or null.
 */
type UrlParameters = Record<string, string | number | boolean | undefined | null>;
/**
 * Class for interacting with and fetching data from the Wikipedia API. It
 * extends the Tool class.
 * @example
 * ```typescript
 * const wikipediaQuery = new WikipediaQueryRun({
 *   topKResults: 3,
 *   maxDocContentLength: 4000,
 * });
 * const result = await wikipediaQuery.call("Langchain");
 * ```
 */
export declare class WikipediaQueryRun extends Tool {
    static lc_name(): string;
    name: string;
    description: string;
    protected topKResults: number;
    protected maxDocContentLength: number;
    protected baseUrl: string;
    constructor(params?: WikipediaQueryRunParams);
    _call(query: string): Promise<string>;
    /**
     * Fetches the content of a specific Wikipedia page. It returns the
     * extracted content as a string.
     * @param page The specific Wikipedia page to fetch its content.
     * @param redirect A boolean value to indicate whether to redirect or not.
     * @returns The extracted content of the specific Wikipedia page as a string.
     */
    content(page: string, redirect?: boolean): Promise<string>;
    /**
     * Builds a URL for the Wikipedia API using the provided parameters.
     * @param parameters The parameters to be used in building the URL.
     * @returns A string representing the built URL.
     */
    protected buildUrl<P extends UrlParameters>(parameters: P): string;
    private _fetchSearchResults;
    private _fetchPage;
}
export {};
