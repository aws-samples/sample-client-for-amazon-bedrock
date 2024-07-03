"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatYandexGPT = void 0;
const messages_1 = require("@langchain/core/messages");
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const env_1 = require("@langchain/core/utils/env");
const apiUrl = "https://llm.api.cloud.yandex.net/llm/v1alpha/chat";
function _parseChatHistory(history) {
    const chatHistory = [];
    let instruction = "";
    for (const message of history) {
        if (typeof message.content !== "string") {
            throw new Error("ChatYandexGPT does not support non-string message content.");
        }
        if ("content" in message) {
            if (message._getType() === "human") {
                chatHistory.push({ role: "user", text: message.content });
            }
            else if (message._getType() === "ai") {
                chatHistory.push({ role: "assistant", text: message.content });
            }
            else if (message._getType() === "system") {
                instruction = message.content;
            }
        }
    }
    return [chatHistory, instruction];
}
/**
 * @deprecated Prefer @langchain/yandex
 * @example
 * ```typescript
 * const chat = new ChatYandexGPT({});
 * // The assistant is set to translate English to French.
 * const res = await chat.call([
 *   new SystemMessage(
 *     "You are a helpful assistant that translates English to French."
 *   ),
 *   new HumanMessage("I love programming."),
 * ]);
 * console.log(res);
 * ```
 */
class ChatYandexGPT extends chat_models_1.BaseChatModel {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iamToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.6
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1700
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "general"
        });
        const apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("YC_API_KEY");
        const iamToken = fields?.iamToken ?? (0, env_1.getEnvironmentVariable)("YC_IAM_TOKEN");
        if (apiKey === undefined && iamToken === undefined) {
            throw new Error("Please set the YC_API_KEY or YC_IAM_TOKEN environment variable or pass it to the constructor as the apiKey or iamToken field.");
        }
        this.apiKey = apiKey;
        this.iamToken = iamToken;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.temperature = fields?.temperature ?? this.temperature;
        this.model = fields?.model ?? this.model;
    }
    _llmType() {
        return "yandexgpt";
    }
    _combineLLMOutput() {
        return {};
    }
    /** @ignore */
    async _generate(messages, options, _) {
        const [messageHistory, instruction] = _parseChatHistory(messages);
        const headers = { "Content-Type": "application/json", Authorization: "" };
        if (this.apiKey !== undefined) {
            headers.Authorization = `Api-Key ${this.apiKey}`;
        }
        else {
            headers.Authorization = `Bearer ${this.iamToken}`;
        }
        const bodyData = {
            model: this.model,
            generationOptions: {
                temperature: this.temperature,
                maxTokens: this.maxTokens,
            },
            messages: messageHistory,
            instructionText: instruction,
        };
        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(bodyData),
            signal: options?.signal,
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${apiUrl} from YandexGPT: ${response.status}`);
        }
        const responseData = await response.json();
        const { result } = responseData;
        const { text } = result.message;
        const totalTokens = result.num_tokens;
        const generations = [
            { text, message: new messages_1.AIMessage(text) },
        ];
        return {
            generations,
            llmOutput: { totalTokens },
        };
    }
}
exports.ChatYandexGPT = ChatYandexGPT;
