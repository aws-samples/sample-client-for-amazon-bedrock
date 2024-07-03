import { SimpleChatModel, } from "@langchain/core/language_models/chat_models";
import { AIMessageChunk, ChatMessage, } from "@langchain/core/messages";
import { ChatGenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { convertEventStreamToIterableReadableDataStream } from "../utils/event_source_parse.js";
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * A class that enables calls to the Cloudflare Workers AI API to access large language
 * models in a chat-like fashion. It extends the SimpleChatModel class and
 * implements the CloudflareWorkersAIInput interface.
 * @example
 * ```typescript
 * const model = new ChatCloudflareWorkersAI({
 *   model: "@cf/meta/llama-2-7b-chat-int8",
 *   cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
 *   cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN
 * });
 *
 * const response = await model.invoke([
 *   ["system", "You are a helpful assistant that translates English to German."],
 *   ["human", `Translate "I love programming".`]
 * ]);
 *
 * console.log(response);
 * ```
 */
export class ChatCloudflareWorkersAI extends SimpleChatModel {
    static lc_name() {
        return "ChatCloudflareWorkersAI";
    }
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
            value: "@cf/meta/llama-2-7b-chat-int8"
        });
        Object.defineProperty(this, "cloudflareAccountId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cloudflareApiToken", {
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
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.model = fields?.model ?? this.model;
        this.streaming = fields?.streaming ?? this.streaming;
        this.cloudflareAccountId =
            fields?.cloudflareAccountId ??
                getEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID");
        this.cloudflareApiToken =
            fields?.cloudflareApiToken ??
                getEnvironmentVariable("CLOUDFLARE_API_TOKEN");
        this.baseUrl =
            fields?.baseUrl ??
                `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/ai/run`;
        if (this.baseUrl.endsWith("/")) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }
    }
    get lc_secrets() {
        return {
            cloudflareApiToken: "CLOUDFLARE_API_TOKEN",
        };
    }
    _llmType() {
        return "cloudflare";
    }
    /** Get the identifying parameters for this LLM. */
    get identifyingParams() {
        return { model: this.model };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(_options) {
        return {
            model: this.model,
        };
    }
    _combineLLMOutput() {
        return {};
    }
    /**
     * Method to validate the environment.
     */
    validateEnvironment() {
        if (!this.cloudflareAccountId) {
            throw new Error(`No Cloudflare account ID found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_ACCOUNT_ID" in your environment variables.`);
        }
        if (!this.cloudflareApiToken) {
            throw new Error(`No Cloudflare API key found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_API_KEY" in your environment variables.`);
        }
    }
    async _request(messages, options, stream) {
        this.validateEnvironment();
        const url = `${this.baseUrl}/${this.model}`;
        const headers = {
            Authorization: `Bearer ${this.cloudflareApiToken}`,
            "Content-Type": "application/json",
        };
        const formattedMessages = this._formatMessages(messages);
        const data = { messages: formattedMessages, stream };
        return this.caller.call(async () => {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(data),
                signal: options.signal,
            });
            if (!response.ok) {
                const error = new Error(`Cloudflare LLM call failed with status code ${response.status}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error.response = response;
                throw error;
            }
            return response;
        });
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const response = await this._request(messages, options, true);
        if (!response.body) {
            throw new Error("Empty response from Cloudflare. Please try again.");
        }
        const stream = convertEventStreamToIterableReadableDataStream(response.body);
        for await (const chunk of stream) {
            if (chunk !== "[DONE]") {
                const parsedChunk = JSON.parse(chunk);
                const generationChunk = new ChatGenerationChunk({
                    message: new AIMessageChunk({ content: parsedChunk.response }),
                    text: parsedChunk.response,
                });
                yield generationChunk;
                // eslint-disable-next-line no-void
                void runManager?.handleLLMNewToken(generationChunk.text ?? "");
            }
        }
    }
    _formatMessages(messages) {
        const formattedMessages = messages.map((message) => {
            let role;
            if (message._getType() === "human") {
                role = "user";
            }
            else if (message._getType() === "ai") {
                role = "assistant";
            }
            else if (message._getType() === "system") {
                role = "system";
            }
            else if (ChatMessage.isInstance(message)) {
                role = message.role;
            }
            else {
                console.warn(`Unsupported message type passed to Cloudflare: "${message._getType()}"`);
                role = "user";
            }
            if (typeof message.content !== "string") {
                throw new Error("ChatCloudflareWorkersAI currently does not support non-string message content.");
            }
            return {
                role,
                content: message.content,
            };
        });
        return formattedMessages;
    }
    /** @ignore */
    async _call(messages, options, runManager) {
        if (!this.streaming) {
            const response = await this._request(messages, options);
            const responseData = await response.json();
            return responseData.result.response;
        }
        else {
            const stream = this._streamResponseChunks(messages, options, runManager);
            let finalResult;
            for await (const chunk of stream) {
                if (finalResult === undefined) {
                    finalResult = chunk;
                }
                else {
                    finalResult = finalResult.concat(chunk);
                }
            }
            const messageContent = finalResult?.message.content;
            if (messageContent && typeof messageContent !== "string") {
                throw new Error("Non-string output for ChatCloudflareWorkersAI is currently not supported.");
            }
            return messageContent ?? "";
        }
    }
}
