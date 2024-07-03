import { Tool } from "@langchain/core/tools";
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
export class WikipediaQueryRun extends Tool {
    static lc_name() {
        return "WikipediaQueryRun";
    }
    constructor(params = {}) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "wikipedia-api"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A tool for interacting with and fetching data from the Wikipedia API."
        });
        Object.defineProperty(this, "topKResults", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "maxDocContentLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 4000
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://en.wikipedia.org/w/api.php"
        });
        this.topKResults = params.topKResults ?? this.topKResults;
        this.maxDocContentLength =
            params.maxDocContentLength ?? this.maxDocContentLength;
        this.baseUrl = params.baseUrl ?? this.baseUrl;
    }
    async _call(query) {
        const searchResults = await this._fetchSearchResults(query);
        const summaries = [];
        for (let i = 0; i < Math.min(this.topKResults, searchResults.query.search.length); i += 1) {
            const page = searchResults.query.search[i].title;
            const pageDetails = await this._fetchPage(page, true);
            if (pageDetails) {
                const summary = `Page: ${page}\nSummary: ${pageDetails.extract}`;
                summaries.push(summary);
            }
        }
        if (summaries.length === 0) {
            return "No good Wikipedia Search Result was found";
        }
        else {
            return summaries.join("\n\n").slice(0, this.maxDocContentLength);
        }
    }
    /**
     * Fetches the content of a specific Wikipedia page. It returns the
     * extracted content as a string.
     * @param page The specific Wikipedia page to fetch its content.
     * @param redirect A boolean value to indicate whether to redirect or not.
     * @returns The extracted content of the specific Wikipedia page as a string.
     */
    async content(page, redirect = true) {
        try {
            const result = await this._fetchPage(page, redirect);
            return result.extract;
        }
        catch (error) {
            throw new Error(`Failed to fetch content for page "${page}": ${error}`);
        }
    }
    /**
     * Builds a URL for the Wikipedia API using the provided parameters.
     * @param parameters The parameters to be used in building the URL.
     * @returns A string representing the built URL.
     */
    buildUrl(parameters) {
        const nonUndefinedParams = Object.entries(parameters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, `${value}`]);
        const searchParams = new URLSearchParams(nonUndefinedParams);
        return `${this.baseUrl}?${searchParams}`;
    }
    async _fetchSearchResults(query) {
        const searchParams = new URLSearchParams({
            action: "query",
            list: "search",
            srsearch: query,
            format: "json",
        });
        const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
        if (!response.ok)
            throw new Error("Network response was not ok");
        const data = await response.json();
        return data;
    }
    async _fetchPage(page, redirect) {
        const params = new URLSearchParams({
            action: "query",
            prop: "extracts",
            explaintext: "true",
            redirects: redirect ? "1" : "0",
            format: "json",
            titles: page,
        });
        const response = await fetch(`${this.baseUrl}?${params.toString()}`);
        if (!response.ok)
            throw new Error("Network response was not ok");
        const data = await response.json();
        const { pages } = data.query;
        const pageId = Object.keys(pages)[0];
        return pages[pageId];
    }
}
