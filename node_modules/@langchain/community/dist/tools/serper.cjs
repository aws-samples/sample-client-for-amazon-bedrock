"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serper = void 0;
const env_1 = require("@langchain/core/utils/env");
const tools_1 = require("@langchain/core/tools");
/**
 * Wrapper around serper.
 *
 * You can create a free API key at https://serper.dev.
 *
 * To use, you should have the SERPER_API_KEY environment variable set.
 */
class Serper extends tools_1.Tool {
    static lc_name() {
        return "Serper";
    }
    /**
     * Converts the Serper instance to JSON. This method is not implemented
     * and will throw an error if called.
     * @returns Throws an error.
     */
    toJSON() {
        return this.toJSONNotImplemented();
    }
    constructor(apiKey = (0, env_1.getEnvironmentVariable)("SERPER_API_KEY"), params = {}) {
        super();
        Object.defineProperty(this, "key", {
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
            throw new Error("Serper API key not set. You can set it as SERPER_API_KEY in your .env file, or pass it to Serper.");
        }
        this.key = apiKey;
        this.params = params;
    }
    /** @ignore */
    async _call(input) {
        const options = {
            method: "POST",
            headers: {
                "X-API-KEY": this.key,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: input,
                ...this.params,
            }),
        };
        const res = await fetch("https://google.serper.dev/search", options);
        if (!res.ok) {
            throw new Error(`Got ${res.status} error from serper: ${res.statusText}`);
        }
        const json = await res.json();
        if (json.answerBox?.answer) {
            return json.answerBox.answer;
        }
        if (json.answerBox?.snippet) {
            return json.answerBox.snippet;
        }
        if (json.answerBox?.snippet_highlighted_words) {
            return json.answerBox.snippet_highlighted_words[0];
        }
        if (json.sportsResults?.game_spotlight) {
            return json.sportsResults.game_spotlight;
        }
        if (json.knowledgeGraph?.description) {
            return json.knowledgeGraph.description;
        }
        if (json.organic?.[0]?.snippet) {
            return json.organic[0].snippet;
        }
        return "No good search result found";
    }
}
exports.Serper = Serper;
