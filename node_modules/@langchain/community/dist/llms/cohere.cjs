"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cohere = void 0;
const env_1 = require("@langchain/core/utils/env");
const llms_1 = require("@langchain/core/language_models/llms");
/**
 * Class representing a Cohere Large Language Model (LLM). It interacts
 * with the Cohere API to generate text completions.
 * @example
 * ```typescript
 * const model = new Cohere({
 *   temperature: 0.7,
 *   maxTokens: 20,
 *   maxRetries: 5,
 * });
 *
 * const res = await model.invoke(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 * @deprecated Use `Cohere` from `@langchain/cohere` instead.
 */
class Cohere extends llms_1.LLM {
    static lc_name() {
        return "Cohere";
    }
    get lc_secrets() {
        return {
            apiKey: "COHERE_API_KEY",
        };
    }
    get lc_aliases() {
        return {
            apiKey: "cohere_api_key",
        };
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 250
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("COHERE_API_KEY");
        if (!apiKey) {
            throw new Error("Please set the COHERE_API_KEY environment variable or pass it to the constructor as the apiKey field.");
        }
        this.apiKey = apiKey;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.temperature = fields?.temperature ?? this.temperature;
        this.model = fields?.model ?? this.model;
    }
    _llmType() {
        return "cohere";
    }
    /** @ignore */
    async _call(prompt, options) {
        const { cohere } = await Cohere.imports();
        cohere.init(this.apiKey);
        // Hit the `generate` endpoint on the `large` model
        const generateResponse = await this.caller.callWithOptions({ signal: options.signal }, cohere.generate.bind(cohere), {
            prompt,
            model: this.model,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            end_sequences: options.stop,
        });
        try {
            return generateResponse.body.generations[0].text;
        }
        catch {
            console.log(generateResponse);
            throw new Error("Could not parse response.");
        }
    }
    /** @ignore */
    static async imports() {
        try {
            const { default: cohere } = await import("cohere-ai");
            return { cohere };
        }
        catch (e) {
            throw new Error("Please install cohere-ai as a dependency with, e.g. `yarn add cohere-ai`");
        }
    }
}
exports.Cohere = Cohere;
