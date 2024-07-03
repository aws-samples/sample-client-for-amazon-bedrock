"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DadJokeAPI = void 0;
const tools_1 = require("@langchain/core/tools");
/**
 * The DadJokeAPI class is a tool for generating dad jokes based on a
 * specific topic. It fetches jokes from an external API and returns a
 * random joke from the results. If no jokes are found for the given
 * search term, it returns a message indicating that no jokes were found.
 */
class DadJokeAPI extends tools_1.Tool {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "dadjoke"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "a dad joke generator. get a dad joke about a specific topic. input should be a search term."
        });
    }
    static lc_name() {
        return "DadJokeAPI";
    }
    /** @ignore */
    async _call(input) {
        const headers = { Accept: "application/json" };
        const searchUrl = `https://icanhazdadjoke.com/search?term=${input}`;
        const response = await fetch(searchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        const jokes = data.results;
        if (jokes.length === 0) {
            return `No dad jokes found about ${input}`;
        }
        const randomIndex = Math.floor(Math.random() * jokes.length);
        const randomJoke = jokes[randomIndex].joke;
        return randomJoke;
    }
}
exports.DadJokeAPI = DadJokeAPI;
