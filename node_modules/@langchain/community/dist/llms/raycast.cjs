"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaycastAI = void 0;
const api_1 = require("@raycast/api");
const llms_1 = require("@langchain/core/language_models/llms");
const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
/**
 * The RaycastAI class, which extends the LLM class and implements the RaycastAIInput interface.
 */
class RaycastAI extends llms_1.LLM {
    /**
     * Creates a new instance of the RaycastAI class.
     * @param {RaycastAIInput} fields The input parameters for the RaycastAI class.
     * @throws {Error} If the Raycast AI environment is not accessible.
     */
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        /**
         * The model to use for generating text.
         */
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The creativity parameter, also known as the "temperature".
         */
        Object.defineProperty(this, "creativity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The rate limit for API calls, in requests per minute.
         */
        Object.defineProperty(this, "rateLimitPerMinute", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The timestamp of the last API call, used to enforce the rate limit.
         */
        Object.defineProperty(this, "lastCallTimestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        if (!api_1.environment.canAccess(api_1.AI)) {
            throw new Error("Raycast AI environment is not accessible.");
        }
        this.model = fields.model ?? "text-davinci-003";
        this.creativity = fields.creativity ?? 0.5;
        this.rateLimitPerMinute = fields.rateLimitPerMinute ?? 10;
    }
    /**
     * Returns the type of the LLM, which is "raycast_ai".
     * @return {string} The type of the LLM.
     * @ignore
     */
    _llmType() {
        return "raycast_ai";
    }
    /**
     * Calls AI.ask with the given prompt and returns the generated text.
     * @param {string} prompt The prompt to generate text from.
     * @return {Promise<string>} A Promise that resolves to the generated text.
     * @ignore
     */
    async _call(prompt, options) {
        const response = await this.caller.call(async () => {
            // Rate limit calls to Raycast AI
            const now = Date.now();
            const timeSinceLastCall = now - this.lastCallTimestamp;
            const timeToWait = (60 / this.rateLimitPerMinute) * 1000 - timeSinceLastCall;
            if (timeToWait > 0) {
                await wait(timeToWait);
            }
            return await api_1.AI.ask(prompt, {
                model: this.model,
                creativity: this.creativity,
                signal: options.signal,
            });
        });
        // Since Raycast AI returns the response directly, no need for output transformation
        return response;
    }
}
exports.RaycastAI = RaycastAI;
