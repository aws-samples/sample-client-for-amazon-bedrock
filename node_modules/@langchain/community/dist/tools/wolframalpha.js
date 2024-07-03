import { Tool } from "@langchain/core/tools";
/**
 * @example
 * ```typescript
 * const tool = new WolframAlphaTool({
 *   appid: "YOUR_APP_ID",
 * });
 * const res = await tool.invoke("What is 2 * 2?");
 * ```
 */
export class WolframAlphaTool extends Tool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "appid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "wolfram_alpha"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A wrapper around Wolfram Alpha. Useful for when you need to answer questions about Math, Science, Technology, Culture, Society and Everyday Life. Input should be a search query.`
        });
        this.appid = fields.appid;
    }
    static lc_name() {
        return "WolframAlphaTool";
    }
    async _call(query) {
        const url = `https://www.wolframalpha.com/api/v1/llm-api?appid=${this.appid}&input=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        return res.text();
    }
}
