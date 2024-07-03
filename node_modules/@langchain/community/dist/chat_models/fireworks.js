import { ChatOpenAI, } from "@langchain/openai";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * Wrapper around Fireworks API for large language models fine-tuned for chat
 *
 * Fireworks API is compatible to the OpenAI API with some limitations described in
 * https://readme.fireworks.ai/docs/openai-compatibility.
 *
 * To use, you should have the `openai` package installed and
 * the `FIREWORKS_API_KEY` environment variable set.
 * @example
 * ```typescript
 * const model = new ChatFireworks({
 *   temperature: 0.9,
 *   fireworksApiKey: "YOUR-API-KEY",
 * });
 *
 * const response = await model.invoke("Hello, how are you?");
 * console.log(response);
 * ```
 */
export class ChatFireworks extends ChatOpenAI {
    static lc_name() {
        return "ChatFireworks";
    }
    _llmType() {
        return "fireworks";
    }
    get lc_secrets() {
        return {
            fireworksApiKey: "FIREWORKS_API_KEY",
        };
    }
    constructor(fields) {
        const fireworksApiKey = fields?.fireworksApiKey || getEnvironmentVariable("FIREWORKS_API_KEY");
        if (!fireworksApiKey) {
            throw new Error(`Fireworks API key not found. Please set the FIREWORKS_API_KEY environment variable or provide the key into "fireworksApiKey"`);
        }
        super({
            ...fields,
            modelName: fields?.modelName || "accounts/fireworks/models/llama-v2-13b-chat",
            openAIApiKey: fireworksApiKey,
            configuration: {
                baseURL: "https://api.fireworks.ai/inference/v1",
            },
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "fireworksApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.fireworksApiKey = fireworksApiKey;
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
     * Calls the Fireworks API with retry logic in case of failures.
     * @param request The request to send to the Fireworks API.
     * @param options Optional configuration for the API call.
     * @returns The response from the Fireworks API.
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
