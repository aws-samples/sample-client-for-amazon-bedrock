"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI21 = void 0;
const llms_1 = require("@langchain/core/language_models/llms");
const env_1 = require("@langchain/core/utils/env");
/**
 * Class representing the AI21 language model. It extends the LLM (Large
 * Language Model) class, providing a standard interface for interacting
 * with the AI21 language model.
 */
class AI21 extends llms_1.LLM {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "j2-jumbo-instruct"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.7
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1024
        });
        Object.defineProperty(this, "minTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: AI21.getDefaultAI21PenaltyData()
        });
        Object.defineProperty(this, "countPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: AI21.getDefaultAI21PenaltyData()
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: AI21.getDefaultAI21PenaltyData()
        });
        Object.defineProperty(this, "numResults", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logitBias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ai21ApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.model = fields?.model ?? this.model;
        this.temperature = fields?.temperature ?? this.temperature;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.minTokens = fields?.minTokens ?? this.minTokens;
        this.topP = fields?.topP ?? this.topP;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.countPenalty = fields?.countPenalty ?? this.countPenalty;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.numResults = fields?.numResults ?? this.numResults;
        this.logitBias = fields?.logitBias;
        this.ai21ApiKey =
            fields?.ai21ApiKey ?? (0, env_1.getEnvironmentVariable)("AI21_API_KEY");
        this.stop = fields?.stop;
        this.baseUrl = fields?.baseUrl;
    }
    /**
     * Method to validate the environment. It checks if the AI21 API key is
     * set. If not, it throws an error.
     */
    validateEnvironment() {
        if (!this.ai21ApiKey) {
            throw new Error(`No AI21 API key found. Please set it as "AI21_API_KEY" in your environment variables.`);
        }
    }
    /**
     * Static method to get the default penalty data for AI21.
     * @returns AI21PenaltyData
     */
    static getDefaultAI21PenaltyData() {
        return {
            scale: 0,
            applyToWhitespaces: true,
            applyToPunctuations: true,
            applyToNumbers: true,
            applyToStopwords: true,
            applyToEmojis: true,
        };
    }
    /** Get the type of LLM. */
    _llmType() {
        return "ai21";
    }
    /** Get the default parameters for calling AI21 API. */
    get defaultParams() {
        return {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            minTokens: this.minTokens,
            topP: this.topP,
            presencePenalty: this.presencePenalty,
            countPenalty: this.countPenalty,
            frequencyPenalty: this.frequencyPenalty,
            numResults: this.numResults,
            logitBias: this.logitBias,
        };
    }
    /** Get the identifying parameters for this LLM. */
    get identifyingParams() {
        return { ...this.defaultParams, model: this.model };
    }
    /** Call out to AI21's complete endpoint.
     Args:
         prompt: The prompt to pass into the model.
     stop: Optional list of stop words to use when generating.
  
         Returns:
     The string generated by the model.
  
     Example:
     let response = ai21._call("Tell me a joke.");
     */
    async _call(prompt, options) {
        let stop = options?.stop;
        this.validateEnvironment();
        if (this.stop && stop && this.stop.length > 0 && stop.length > 0) {
            throw new Error("`stop` found in both the input and default params.");
        }
        stop = this.stop ?? stop ?? [];
        const baseUrl = this.baseUrl ?? this.model === "j1-grande-instruct"
            ? "https://api.ai21.com/studio/v1/experimental"
            : "https://api.ai21.com/studio/v1";
        const url = `${baseUrl}/${this.model}/complete`;
        const headers = {
            Authorization: `Bearer ${this.ai21ApiKey}`,
            "Content-Type": "application/json",
        };
        const data = { prompt, stopSequences: stop, ...this.defaultParams };
        const responseData = await this.caller.callWithOptions({}, async () => {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(data),
                signal: options.signal,
            });
            if (!response.ok) {
                const error = new Error(`AI21 call failed with status code ${response.status}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error.response = response;
                throw error;
            }
            return response.json();
        });
        if (!responseData.completions ||
            responseData.completions.length === 0 ||
            !responseData.completions[0].data) {
            throw new Error("No completions found in response");
        }
        return responseData.completions[0].data.text ?? "";
    }
}
exports.AI21 = AI21;
