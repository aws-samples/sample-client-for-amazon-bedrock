import { AIMessage, AIMessageChunk, ChatMessage, ChatMessageChunk, FunctionMessageChunk, HumanMessage, HumanMessageChunk, SystemMessage, SystemMessageChunk, } from "@langchain/core/messages";
import { ChatGenerationChunk, } from "@langchain/core/outputs";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getPortkeySession } from "../llms/portkey.js";
function portkeyResponseToChatMessage(message) {
    switch (message.role) {
        case "user":
            return new HumanMessage(message.content || "");
        case "assistant":
            return new AIMessage(message.content || "");
        case "system":
            return new SystemMessage(message.content || "");
        default:
            return new ChatMessage(message.content || "", message.role ?? "unknown");
    }
}
function _convertDeltaToMessageChunk(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delta) {
    const { role } = delta;
    const content = delta.content ?? "";
    let additional_kwargs;
    if (delta.function_call) {
        additional_kwargs = {
            function_call: delta.function_call,
        };
    }
    else {
        additional_kwargs = {};
    }
    if (role === "user") {
        return new HumanMessageChunk({ content });
    }
    else if (role === "assistant") {
        return new AIMessageChunk({ content, additional_kwargs });
    }
    else if (role === "system") {
        return new SystemMessageChunk({ content });
    }
    else if (role === "function") {
        return new FunctionMessageChunk({
            content,
            additional_kwargs,
            name: delta.name,
        });
    }
    else {
        return new ChatMessageChunk({ content, role });
    }
}
export class PortkeyChat extends BaseChatModel {
    constructor(init) {
        super(init ?? {});
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "baseURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "mode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "llms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "session", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.apiKey = init?.apiKey;
        this.baseURL = init?.baseURL;
        this.mode = init?.mode;
        this.llms = init?.llms;
        this.session = getPortkeySession({
            apiKey: this.apiKey,
            baseURL: this.baseURL,
            llms: this.llms,
            mode: this.mode,
        });
    }
    _llmType() {
        return "portkey";
    }
    async _generate(messages, options, _) {
        const messagesList = messages.map((message) => {
            if (typeof message.content !== "string") {
                throw new Error("PortkeyChat does not support non-string message content.");
            }
            return {
                role: message._getType(),
                content: message.content,
            };
        });
        const response = await this.session.portkey.chatCompletions.create({
            messages: messagesList,
            ...options,
            stream: false,
        });
        const generations = [];
        for (const data of response.choices ?? []) {
            const text = data.message?.content ?? "";
            const generation = {
                text,
                message: portkeyResponseToChatMessage(data.message ?? {}),
            };
            if (data.finish_reason) {
                generation.generationInfo = { finish_reason: data.finish_reason };
            }
            generations.push(generation);
        }
        return {
            generations,
        };
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const messagesList = messages.map((message) => {
            if (typeof message.content !== "string") {
                throw new Error("PortkeyChat does not support non-string message content.");
            }
            return {
                role: message._getType(),
                content: message.content,
            };
        });
        const response = await this.session.portkey.chatCompletions.create({
            messages: messagesList,
            ...options,
            stream: true,
        });
        for await (const data of response) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const chunk = new ChatGenerationChunk({
                message: _convertDeltaToMessageChunk(choice.delta ?? {}),
                text: choice.message?.content ?? "",
                generationInfo: {
                    finishReason: choice.finish_reason,
                },
            });
            yield chunk;
            void runManager?.handleLLMNewToken(chunk.text ?? "");
        }
        if (options.signal?.aborted) {
            throw new Error("AbortError");
        }
    }
    _combineLLMOutput() {
        return {};
    }
}
