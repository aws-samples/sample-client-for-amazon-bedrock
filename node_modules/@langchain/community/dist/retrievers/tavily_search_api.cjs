"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TavilySearchAPIRetriever = void 0;
const documents_1 = require("@langchain/core/documents");
const retrievers_1 = require("@langchain/core/retrievers");
const env_1 = require("@langchain/core/utils/env");
/**
 * A class for retrieving documents related to a given search term
 * using the Tavily Search API.
 */
class TavilySearchAPIRetriever extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "TavilySearchAPIRetriever";
    }
    get lc_namespace() {
        return ["langchain", "retrievers", "tavily_search_api"];
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "k", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 10
        });
        Object.defineProperty(this, "includeGeneratedAnswer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "includeRawContent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "includeImages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "searchDepth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "basic"
        });
        Object.defineProperty(this, "includeDomains", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "excludeDomains", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "kwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.k = fields?.k ?? this.k;
        this.includeGeneratedAnswer =
            fields?.includeGeneratedAnswer ?? this.includeGeneratedAnswer;
        this.includeRawContent =
            fields?.includeRawContent ?? this.includeRawContent;
        this.includeImages = fields?.includeImages ?? this.includeImages;
        this.searchDepth = fields?.searchDepth ?? this.searchDepth;
        this.includeDomains = fields?.includeDomains ?? this.includeDomains;
        this.excludeDomains = fields?.excludeDomains ?? this.excludeDomains;
        this.kwargs = fields?.kwargs ?? this.kwargs;
        this.apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("TAVILY_API_KEY");
        if (this.apiKey === undefined) {
            throw new Error(`No Tavily API key found. Either set an environment variable named "TAVILY_API_KEY" or pass an API key as "apiKey".`);
        }
    }
    async _getRelevantDocuments(query, _runManager) {
        const body = {
            query,
            include_answer: this.includeGeneratedAnswer,
            include_raw_content: this.includeRawContent,
            include_images: this.includeImages,
            max_results: this.k,
            search_depth: this.searchDepth,
            api_key: this.apiKey,
        };
        if (this.includeDomains) {
            body.include_domains = this.includeDomains;
        }
        if (this.excludeDomains) {
            body.exclude_domains = this.excludeDomains;
        }
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ ...body, ...this.kwargs }),
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(`Request failed with status code ${response.status}: ${json.error}`);
        }
        if (!Array.isArray(json.results)) {
            throw new Error(`Could not parse Tavily results. Please try again.`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = json.results.map((result) => {
            const pageContent = this.includeRawContent
                ? result.raw_content
                : result.content;
            const metadata = {
                title: result.title,
                source: result.url,
                ...Object.fromEntries(Object.entries(result).filter(([k]) => !["content", "title", "url", "raw_content"].includes(k))),
                images: json.images,
            };
            return new documents_1.Document({ pageContent, metadata });
        });
        if (this.includeGeneratedAnswer) {
            docs.push(new documents_1.Document({
                pageContent: json.answer,
                metadata: {
                    title: "Suggested Answer",
                    source: "https://tavily.com/",
                },
            }));
        }
        return docs;
    }
}
exports.TavilySearchAPIRetriever = TavilySearchAPIRetriever;
