"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTogetherAI = void 0;
const openai_1 = require("@langchain/openai");
const env_1 = require("@langchain/core/utils/env");
/**
 * Wrapper around TogetherAI API for large language models fine-tuned for chat
 *
 * TogetherAI API is compatible to the OpenAI API with some limitations. View the
 * full API ref at:
 * @link {https://docs.together.ai/reference/chat-completions}
 *
 * To use, you should have the `TOGETHER_AI_API_KEY` environment variable set.
 * @example
 * ```typescript
 * const model = new ChatTogetherAI({
 *   temperature: 0.9,
 *   togetherAIApiKey: process.env.TOGETHER_AI_API_KEY,
 * });
 *
 * const response = await model.invoke([new HumanMessage("Hello there!")]);
 * console.log(response);
 * ```
 */
class ChatTogetherAI extends openai_1.ChatOpenAI {
    static lc_name() {
        return "ChatTogetherAI";
    }
    _llmType() {
        return "togetherAI";
    }
    get lc_secrets() {
        return {
            togetherAIApiKey: "TOGETHER_AI_API_KEY",
        };
    }
    constructor(fields) {
        const togetherAIApiKey = fields?.togetherAIApiKey || (0, env_1.getEnvironmentVariable)("TOGETHER_AI_API_KEY");
        if (!togetherAIApiKey) {
            throw new Error(`TogetherAI API key not found. Please set the TOGETHER_AI_API_KEY environment variable or provide the key into "togetherAIApiKey"`);
        }
        super({
            ...fields,
            modelName: fields?.modelName || "mistralai/Mixtral-8x7B-Instruct-v0.1",
            openAIApiKey: togetherAIApiKey,
            configuration: {
                baseURL: "https://api.together.xyz/v1/",
            },
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
    }
    toJSON() {
        const result = super.toJSON();
        if ("kwargs" in result &&
            typeof result.kwargs === "object" &&
            result.kwargs != null) {
            delete result.kwargs.openai_api_key;
            delete result.kwargs.configuration;
        }
        return result;
    }
    /**
     * Calls the TogetherAI API with retry logic in case of failures.
     * @param request The request to send to the TogetherAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the TogetherAI API.
     */
    async completionWithRetry(request, options) {
        delete request.frequency_penalty;
        delete request.presence_penalty;
        delete request.logit_bias;
        delete request.functions;
        if (request.stream === true) {
            return super.completionWithRetry(request, options);
        }
        return super.completionWithRetry(request, options);
    }
}
exports.ChatTogetherAI = ChatTogetherAI;
