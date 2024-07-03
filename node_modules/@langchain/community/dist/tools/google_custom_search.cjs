"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCustomSearch = void 0;
const env_1 = require("@langchain/core/utils/env");
const tools_1 = require("@langchain/core/tools");
/**
 * Class that uses the Google Search API to perform custom searches.
 * Requires environment variables `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` to
 * be set.
 */
class GoogleCustomSearch extends tools_1.Tool {
    static lc_name() {
        return "GoogleCustomSearch";
    }
    get lc_secrets() {
        return {
            apiKey: "GOOGLE_API_KEY",
        };
    }
    constructor(fields = {
        apiKey: (0, env_1.getEnvironmentVariable)("GOOGLE_API_KEY"),
        googleCSEId: (0, env_1.getEnvironmentVariable)("GOOGLE_CSE_ID"),
    }) {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "google-custom-search"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "googleCSEId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "a custom search engine. useful for when you need to answer questions about current events. input should be a search query. outputs a JSON array of results."
        });
        if (!fields.apiKey) {
            throw new Error(`Google API key not set. You can set it as "GOOGLE_API_KEY" in your environment variables.`);
        }
        if (!fields.googleCSEId) {
            throw new Error(`Google custom search engine id not set. You can set it as "GOOGLE_CSE_ID" in your environment variables.`);
        }
        this.apiKey = fields.apiKey;
        this.googleCSEId = fields.googleCSEId;
    }
    async _call(input) {
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.googleCSEId}&q=${encodeURIComponent(input)}`);
        if (!res.ok) {
            throw new Error(`Got ${res.status} error from Google custom search: ${res.statusText}`);
        }
        const json = await res.json();
        const results = json?.items?.map((item) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        })) ?? [];
        return JSON.stringify(results);
    }
}
exports.GoogleCustomSearch = GoogleCustomSearch;
