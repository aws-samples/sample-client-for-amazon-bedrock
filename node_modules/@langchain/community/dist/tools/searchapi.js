import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Tool } from "@langchain/core/tools";
function isJSONObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
/**
 * SearchApi Class Definition.
 *
 * Provides a wrapper around the SearchApi.
 *
 * Ensure you've set the SEARCHAPI_API_KEY environment variable for authentication.
 * You can obtain a free API key from https://www.searchapi.io/.
 * @example
 * ```typescript
 * const searchApi = new SearchApi("your-api-key", {
 *   engine: "google_news",
 * });
 * const agent = RunnableSequence.from([
 *   ChatPromptTemplate.fromMessages([
 *     ["ai", "Answer the following questions using a bulleted list markdown format.""],
 *     ["human", "{input}"],
 *   ]),
 *   new ChatOpenAI({ temperature: 0 }),
 *   (input: BaseMessageChunk) => ({
 *     log: "test",
 *     returnValues: {
 *       output: input,
 *     },
 *   }),
 * ]);
 * const executor = AgentExecutor.fromAgentAndTools({
 *   agent,
 *   tools: [searchApi],
 * });
 * const res = await executor.invoke({
 *   input: "What's happening in Ukraine today?"",
 * });
 * console.log(res);
 * ```
 */
export class SearchApi extends Tool {
    static lc_name() {
        return "SearchApi";
    }
    /**
     * Converts the SearchApi instance to JSON. This method is not implemented
     * and will throw an error if called.
     * @returns Throws an error.
     */
    toJSON() {
        return this.toJSONNotImplemented();
    }
    constructor(apiKey = getEnvironmentVariable("SEARCHAPI_API_KEY"), params = {}) {
        super(...arguments);
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "search"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "a search engine. useful for when you need to answer questions about current events. input should be a search query."
        });
        if (!apiKey) {
            throw new Error("SearchApi requires an API key. Please set it as SEARCHAPI_API_KEY in your .env file, or pass it as a parameter to the SearchApi constructor.");
        }
        this.apiKey = apiKey;
        this.params = params;
    }
    /**
     * Builds a URL for the SearchApi request.
     * @param parameters The parameters for the request.
     * @returns A string representing the built URL.
     */
    buildUrl(searchQuery) {
        const preparedParams = Object.entries({
            engine: "google",
            api_key: this.apiKey,
            ...this.params,
            q: searchQuery,
        })
            .filter(([key, value]) => value !== undefined && value !== null && key !== "apiKey")
            .map(([key, value]) => [key, `${value}`]);
        const searchParams = new URLSearchParams(preparedParams);
        return `https://www.searchapi.io/api/v1/search?${searchParams}`;
    }
    /** @ignore */
    /**
     * Calls the SearchAPI.
     *
     * Accepts an input query and fetches the result from SearchApi.
     *
     * @param {string} input - Search query.
     * @returns {string} - Formatted search results or an error message.
     *
     * NOTE: This method is the core search handler and processes various types
     * of search results including Google organic results, videos, jobs, and images.
     */
    async _call(input) {
        const resp = await fetch(this.buildUrl(input));
        const json = await resp.json();
        if (json.error) {
            throw new Error(`Failed to load search results from SearchApi due to: ${json.error}`);
        }
        // Google Search results
        if (json.answer_box?.answer) {
            return json.answer_box.answer;
        }
        if (json.answer_box?.snippet) {
            return json.answer_box.snippet;
        }
        if (json.knowledge_graph?.description) {
            return json.knowledge_graph.description;
        }
        // Organic results (Google, Google News)
        if (json.organic_results) {
            const snippets = json.organic_results
                .filter((r) => r.snippet)
                .map((r) => r.snippet);
            return snippets.join("\n");
        }
        // Google Jobs results
        if (json.jobs) {
            const jobDescriptions = json.jobs
                .slice(0, 1)
                .filter((r) => r.description)
                .map((r) => r.description);
            return jobDescriptions.join("\n");
        }
        // Google Videos results
        if (json.videos) {
            const videoInfo = json.videos
                .filter((r) => r.title && r.link)
                .map((r) => `Title: "${r.title}" Link: ${r.link}`);
            return videoInfo.join("\n");
        }
        // Google Images results
        if (json.images) {
            const image_results = json.images.slice(0, 15);
            const imageInfo = image_results
                .filter((r) => r.title && r.original && isJSONObject(r.original) && r.original.link)
                .map((r) => `Title: "${r.title}" Link: ${r.original.link}`);
            return imageInfo.join("\n");
        }
        return "No good search result found";
    }
}
