"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChatIflytekXinghuo = void 0;
const messages_1 = require("@langchain/core/messages");
const env_1 = require("@langchain/core/utils/env");
const stream_1 = require("@langchain/core/utils/stream");
const chat_models_1 = require("@langchain/core/language_models/chat_models");
/**
 * Function that extracts the custom role of a generic chat message.
 * @param message Chat message from which to extract the custom role.
 * @returns The custom role of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (message.role !== "assistant" && message.role !== "user") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
/**
 * Function that converts a base message to a Xinghuo message role.
 * @param message Base message to convert.
 * @returns The Xinghuo message role.
 */
function messageToXinghuoRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            throw new Error("System messages should not be here");
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
 * Wrapper around IflytekXingHuo large language models that use the Chat endpoint.
 *
 * To use you should have the `IFLYTEK_API_KEY` and `IFLYTEK_API_SECRET` and `IFLYTEK_APPID`
 * environment variable set.
 *
 * @augments BaseChatModel
 * @augments IflytekXinghuoChatInput
 */
class BaseChatIflytekXinghuo extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatIflytekXinghuo";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            iflytekApiKey: "IFLYTEK_API_KEY",
            iflytekApiSecret: "IFLYTEK_API_SECRET",
        };
    }
    get lc_aliases() {
        return undefined;
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "v2.1"
        });
        Object.defineProperty(this, "iflytekAppid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iflytekApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iflytekApiSecret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userId", {
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
        Object.defineProperty(this, "domain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.5
        });
        Object.defineProperty(this, "max_tokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2048
        });
        Object.defineProperty(this, "top_k", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 4
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        const iflytekAppid = fields?.iflytekAppid ?? (0, env_1.getEnvironmentVariable)("IFLYTEK_APPID");
        if (!iflytekAppid) {
            throw new Error("Iflytek APPID not found");
        }
        else {
            this.iflytekAppid = iflytekAppid;
        }
        const iflytekApiKey = fields?.iflytekApiKey ?? (0, env_1.getEnvironmentVariable)("IFLYTEK_API_KEY");
        if (!iflytekApiKey) {
            throw new Error("Iflytek API key not found");
        }
        else {
            this.iflytekApiKey = iflytekApiKey;
        }
        const iflytekApiSecret = fields?.iflytekApiSecret ?? (0, env_1.getEnvironmentVariable)("IFLYTEK_API_SECRET");
        if (!iflytekApiSecret) {
            throw new Error("Iflytek API secret not found");
        }
        else {
            this.iflytekApiSecret = iflytekApiSecret;
        }
        this.userId = fields?.userId ?? this.userId;
        this.streaming = fields?.streaming ?? this.streaming;
        this.temperature = fields?.temperature ?? this.temperature;
        this.max_tokens = fields?.max_tokens ?? this.max_tokens;
        this.top_k = fields?.top_k ?? this.top_k;
        this.version = fields?.version ?? this.version;
        if (["v1.1", "v2.1", "v3.1"].includes(this.version)) {
            switch (this.version) {
                case "v1.1":
                    this.domain = "general";
                    break;
                case "v2.1":
                    this.domain = "generalv2";
                    break;
                case "v3.1":
                    this.domain = "generalv3";
                    break;
                default:
                    this.domain = "generalv2";
            }
            this.apiUrl = `wss://spark-api.xf-yun.com/${this.version}/chat`;
        }
        else {
            throw new Error(`Invalid model version: ${this.version}`);
        }
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            version: this.version,
            ...this.invocationParams(),
        };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            streaming: this.streaming,
            temperature: this.temperature,
            top_k: this.top_k,
        };
    }
    async completion(request, stream, signal) {
        const webSocketStream = await this.openWebSocketStream({
            signal,
        });
        const connection = await webSocketStream.connection;
        const header = {
            app_id: this.iflytekAppid,
            uid: this.userId,
        };
        const parameter = {
            chat: {
                domain: this.domain,
                temperature: request.temperature ?? this.temperature,
                max_tokens: request.max_tokens ?? this.max_tokens,
                top_k: request.top_k ?? this.top_k,
            },
        };
        const payload = {
            message: {
                text: request.messages,
            },
        };
        const message = JSON.stringify({
            header,
            parameter,
            payload,
        });
        const { writable, readable } = connection;
        const writer = writable.getWriter();
        await writer.write(message);
        const streams = stream_1.IterableReadableStream.fromReadableStream(readable);
        if (stream) {
            return streams;
        }
        else {
            let response = { result: "" };
            for await (const chunk of streams) {
                const data = JSON.parse(chunk);
                const { header, payload } = data;
                if (header.code === 0) {
                    if (header.status === 0) {
                        response.result = payload.choices?.text[0]?.content ?? "";
                    }
                    else if (header.status === 1) {
                        response.result += payload.choices?.text[0]?.content ?? "";
                    }
                    else if (header.status === 2) {
                        response = { ...response, usage: payload.usage?.text };
                        break;
                    }
                }
                else {
                    break;
                }
            }
            void streams.cancel();
            void webSocketStream.close();
            return response;
        }
    }
    async _generate(messages, options, runManager) {
        const tokenUsage = {};
        const params = this.invocationParams();
        const messagesMapped = messages.map((message) => {
            if (typeof message.content !== "string") {
                throw new Error("ChatIflytekXinghuo does not support non-string message content.");
            }
            return {
                role: messageToXinghuoRole(message),
                content: message.content,
            };
        });
        const data = params.streaming
            ? await (async () => {
                const streams = await this.completion({ messages: messagesMapped, ...params }, true, options.signal);
                let response = { result: "" };
                for await (const chunk of streams) {
                    const data = JSON.parse(chunk);
                    const { header, payload } = data;
                    if (header.code === 0) {
                        if (header.status === 0) {
                            response.result = payload.choices?.text[0]?.content ?? "";
                        }
                        else if (header.status === 1) {
                            response.result += payload.choices?.text[0]?.content ?? "";
                        }
                        else if (header.status === 2) {
                            response = { ...response, usage: payload.usage?.text };
                            break;
                        }
                        void runManager?.handleLLMNewToken(payload.choices?.text[0]?.content);
                    }
                    else {
                        break;
                    }
                }
                void streams.cancel();
                return response;
            })()
            : await this.completion({ messages: messagesMapped, ...params }, false, options.signal);
        const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage ?? {};
        if (completionTokens) {
            tokenUsage.completionTokens =
                (tokenUsage.completionTokens ?? 0) + completionTokens;
        }
        if (promptTokens) {
            tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens;
        }
        if (totalTokens) {
            tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
        }
        const generations = [];
        const text = data.result ?? "";
        generations.push({
            text,
            message: new messages_1.AIMessage(text),
        });
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    /** @ignore */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _combineLLMOutput() {
        return [];
    }
    _llmType() {
        return "iflytek_xinghuo";
    }
}
exports.BaseChatIflytekXinghuo = BaseChatIflytekXinghuo;
