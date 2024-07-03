"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatAlibabaTongyi = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const env_1 = require("@langchain/core/utils/env");
/**
 * Function that extracts the custom role of a generic chat message.
 * @param message Chat message from which to extract the custom role.
 * @returns The custom role of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (["system", "assistant", "user"].includes(message.role) === false) {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
/**
 * Function that converts a base message to a Tongyi message role.
 * @param message Base message to convert.
 * @returns The Tongyi message role.
 */
function messageToTongyiRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            return "system";
        case "function":
            throw new Error("Function messages not supported");
        case "generic": {
            if (!messages_1.ChatMessage.isInstance(message))
                throw new Error("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
/**
 * Wrapper around Ali Tongyi large language models that use the Chat endpoint.
 *
 * To use you should have the `ALIBABA_API_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments AlibabaTongyiInput
 * @example
 * ```typescript
 * const qwen = new ChatAlibabaTongyi({
 *   alibabaApiKey: "YOUR-API-KEY",
 * });
 *
 * const qwen = new ChatAlibabaTongyi({
 *   modelName: "qwen-turbo",
 *   temperature: 1,
 *   alibabaApiKey: "YOUR-API-KEY",
 * });
 *
 * const messages = [new HumanMessage("Hello")];
 *
 * await qwen.call(messages);
 * ```
 */
class ChatAlibabaTongyi extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatAlibabaTongyi";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            alibabaApiKey: "ALIBABA_API_KEY",
        };
    }
    get lc_aliases() {
        return undefined;
    }
    constructor(fields = {}) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "alibabaApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "prefixMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "repetitionPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "seed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "enableSearch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.alibabaApiKey =
            fields?.alibabaApiKey ?? (0, env_1.getEnvironmentVariable)("ALIBABA_API_KEY");
        if (!this.alibabaApiKey) {
            throw new Error("Ali API key not found");
        }
        this.apiUrl =
            "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
        this.lc_serializable = true;
        this.streaming = fields.streaming ?? false;
        this.prefixMessages = fields.prefixMessages ?? [];
        this.temperature = fields.temperature;
        this.topP = fields.topP;
        this.topK = fields.topK;
        this.seed = fields.seed;
        this.maxTokens = fields.maxTokens;
        this.repetitionPenalty = fields.repetitionPenalty;
        this.enableSearch = fields.enableSearch;
        this.modelName = fields.modelName ?? "qwen-turbo";
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        const parameters = {
            stream: this.streaming,
            temperature: this.temperature,
            top_p: this.topP,
            top_k: this.topK,
            seed: this.seed,
            max_tokens: this.maxTokens,
            result_format: "text",
            enable_search: this.enableSearch,
        };
        if (this.streaming) {
            parameters.incremental_output = true;
        }
        else {
            parameters.repetition_penalty = this.repetitionPenalty;
        }
        return parameters;
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model: this.modelName,
            ...this.invocationParams(),
        };
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const parameters = this.invocationParams();
        const messagesMapped = messages.map((message) => ({
            role: messageToTongyiRole(message),
            content: message.content,
        }));
        const data = parameters.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                let resolved = false;
                this.completionWithRetry({
                    model: this.modelName,
                    parameters,
                    input: {
                        messages: messagesMapped,
                    },
                }, true, options?.signal, (event) => {
                    const data = JSON.parse(event.data);
                    if (data?.code) {
                        if (rejected) {
                            return;
                        }
                        rejected = true;
                        reject(new Error(data?.message));
                        return;
                    }
                    const { text, finish_reason } = data.output;
                    if (!response) {
                        response = data;
                    }
                    else {
                        response.output.text += text;
                        response.output.finish_reason = finish_reason;
                        response.usage = data.usage;
                    }
                    void runManager?.handleLLMNewToken(text ?? "");
                    if (finish_reason && finish_reason !== "null") {
                        if (resolved || rejected) {
                            return;
                        }
                        resolved = true;
                        resolve(response);
                    }
                }).catch((error) => {
                    if (!rejected) {
                        rejected = true;
                        reject(error);
                    }
                });
            })
            : await this.completionWithRetry({
                model: this.modelName,
                parameters,
                input: {
                    messages: messagesMapped,
                },
            }, false, options?.signal).then((data) => {
                if (data?.code) {
                    throw new Error(data?.message);
                }
                return data;
            });
        const { input_tokens = 0, output_tokens = 0, total_tokens = 0, } = data.usage;
        const { text } = data.output;
        return {
            generations: [
                {
                    text,
                    message: new messages_1.AIMessage(text),
                },
            ],
            llmOutput: {
                tokenUsage: {
                    promptTokens: input_tokens,
                    completionTokens: output_tokens,
                    totalTokens: total_tokens,
                },
            },
        };
    }
    /** @ignore */
    async completionWithRetry(request, stream, signal, onmessage) {
        const makeCompletionRequest = async () => {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    ...(stream ? { Accept: "text/event-stream" } : {}),
                    Authorization: `Bearer ${this.alibabaApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal,
            });
            if (!stream) {
                return response.json();
            }
            if (response.body) {
                // response will not be a stream if an error occurred
                if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
                    onmessage?.(new MessageEvent("message", {
                        data: await response.text(),
                    }));
                    return;
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let data = "";
                let continueReading = true;
                while (continueReading) {
                    const { done, value } = await reader.read();
                    if (done) {
                        continueReading = false;
                        break;
                    }
                    data += decoder.decode(value);
                    let continueProcessing = true;
                    while (continueProcessing) {
                        const newlineIndex = data.indexOf("\n");
                        if (newlineIndex === -1) {
                            continueProcessing = false;
                            break;
                        }
                        const line = data.slice(0, newlineIndex);
                        data = data.slice(newlineIndex + 1);
                        if (line.startsWith("data:")) {
                            const event = new MessageEvent("message", {
                                data: line.slice("data:".length).trim(),
                            });
                            onmessage?.(event);
                        }
                    }
                }
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    _llmType() {
        return "alibaba_tongyi";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
exports.ChatAlibabaTongyi = ChatAlibabaTongyi;
