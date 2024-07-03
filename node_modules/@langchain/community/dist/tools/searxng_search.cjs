"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearxngSearch = void 0;
const env_1 = require("@langchain/core/utils/env");
const tools_1 = require("@langchain/core/tools");
/**
 * SearxngSearch class represents a meta search engine tool.
 * Use this class when you need to answer questions about current events.
 * The input should be a search query, and the output is a JSON array of the query results.
 *
 * note: works best with *agentType*: `structured-chat-zero-shot-react-description`
 * https://github.com/searxng/searxng
 * @example
 * ```typescript
 * const executor = AgentExecutor.fromAgentAndTools({
 *   agent,
 *   tools: [
 *     new SearxngSearch({
 *       params: {
 *         format: "json",
 *         engines: "google",
 *       },
 *       headers: {},
 *     }),
 *   ],
 * });
 * const result = await executor.invoke({
 *   input: `What is Langchain? Describe in 50 words`,
 * });
 * ```
 */
class SearxngSearch extends tools_1.Tool {
    static lc_name() {
        return "SearxngSearch";
    }
    get lc_secrets() {
        return {
            apiBase: "SEARXNG_API_BASE",
        };
    }
    /**
     * Constructor for the SearxngSearch class
     * @param apiBase Base URL of the Searxng instance
     * @param params SearxNG parameters
     * @param headers Custom headers
     */
    constructor({ apiBase, params, headers, }) {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "searxng-search"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A meta search engine. Useful for when you need to answer questions about current events. Input should be a search query. Output is a JSON array of the query results"
        });
        Object.defineProperty(this, "apiBase", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                numResults: 10,
                pageNumber: 1,
                format: "json",
                imageProxy: true,
                safesearch: 0,
            }
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.apiBase = (0, env_1.getEnvironmentVariable)("SEARXNG_API_BASE") || apiBase;
        this.headers = { "content-type": "application/json", ...headers };
        if (!this.apiBase) {
            throw new Error(`SEARXNG_API_BASE not set. You can set it as "SEARXNG_API_BASE" in your environment variables.`);
        }
        if (params) {
            this.params = { ...this.params, ...params };
        }
    }
    /**
     * Builds the URL for the Searxng search.
     * @param path The path for the URL.
     * @param parameters The parameters for the URL.
     * @param baseUrl The base URL.
     * @returns The complete URL as a string.
     */
    buildUrl(path, parameters, baseUrl) {
        const nonUndefinedParams = Object.entries(parameters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value.toString()]); // Avoid string conversion
        const searchParams = new URLSearchParams(nonUndefinedParams);
        return `${baseUrl}/${path}?${searchParams}`;
    }
    async _call(input) {
        const queryParams = {
            q: input,
            ...this.params,
        };
        const url = this.buildUrl("search", queryParams, this.apiBase);
        const resp = await fetch(url, {
            method: "POST",
            headers: this.headers,
            signal: AbortSignal.timeout(5 * 1000), // 5 seconds
        });
        if (!resp.ok) {
            throw new Error(resp.statusText);
        }
        const res = await resp.json();
        if (!res.results.length &&
            !res.answers.length &&
            !res.infoboxes.length &&
            !res.suggestions.length) {
            return "No good results found.";
        }
        else if (res.results.length) {
            const response = [];
            res.results.forEach((r) => {
                response.push(JSON.stringify({
                    title: r.title || "",
                    link: r.url || "",
                    snippet: r.content || "",
                }));
            });
            return response.slice(0, this.params?.numResults).toString();
        }
        else if (res.answers.length) {
            return res.answers[0];
        }
        else if (res.infoboxes.length) {
            return res.infoboxes[0]?.content.replaceAll(/<[^>]+>/gi, "");
        }
        else if (res.suggestions.length) {
            let suggestions = "Suggestions: ";
            res.suggestions.forEach((s) => {
                suggestions += `${s}, `;
            });
            return suggestions;
        }
        else {
            return "No good results found.";
        }
    }
}
exports.SearxngSearch = SearxngSearch;
