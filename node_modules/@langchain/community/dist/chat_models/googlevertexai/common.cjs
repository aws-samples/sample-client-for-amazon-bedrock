"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChatGoogleVertexAI = exports.GoogleVertexAIChatMessage = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
/**
 * Represents a chat message in the Google Vertex AI chat model.
 */
class GoogleVertexAIChatMessage {
    constructor(fields) {
        Object.defineProperty(this, "author", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.author = fields.author;
        this.content = fields.content;
        this.name = fields.name;
    }
    /**
     * Extracts the role of a generic message and maps it to a Google Vertex
     * AI chat author.
     * @param message The chat message to extract the role from.
     * @returns The role of the message mapped to a Google Vertex AI chat author.
     */
    static extractGenericMessageCustomRole(message) {
        if (message.role !== "system" &&
            message.role !== "bot" &&
            message.role !== "user" &&
            message.role !== "context") {
            console.warn(`Unknown message role: ${message.role}`);
        }
        return message.role;
    }
    /**
     * Maps a message type to a Google Vertex AI chat author.
     * @param message The message to map.
     * @param model The model to use for mapping.
     * @returns The message type mapped to a Google Vertex AI chat author.
     */
    static mapMessageTypeToVertexChatAuthor(message, model) {
        const type = message._getType();
        switch (type) {
            case "ai":
                return model.startsWith("codechat-") ? "system" : "bot";
            case "human":
                return "user";
            case "system":
                throw new Error(`System messages are only supported as the first passed message for Google Vertex AI.`);
            case "generic": {
                if (!messages_1.ChatMessage.isInstance(message))
                    throw new Error("Invalid generic chat message");
                return GoogleVertexAIChatMessage.extractGenericMessageCustomRole(message);
            }
            default:
                throw new Error(`Unknown / unsupported message type: ${message}`);
        }
    }
    /**
     * Creates a new Google Vertex AI chat message from a base message.
     * @param message The base message to convert.
     * @param model The model to use for conversion.
     * @returns A new Google Vertex AI chat message.
     */
    static fromChatMessage(message, model) {
        if (typeof message.content !== "string") {
            throw new Error("ChatGoogleVertexAI does not support non-string message content.");
        }
        return new GoogleVertexAIChatMessage({
            author: GoogleVertexAIChatMessage.mapMessageTypeToVertexChatAuthor(message, model),
            content: message.content,
        });
    }
}
exports.GoogleVertexAIChatMessage = GoogleVertexAIChatMessage;
/**
 * Base class for Google Vertex AI chat models.
 * Implemented subclasses must provide a GoogleVertexAILLMConnection
 * with appropriate auth client.
 */
class BaseChatGoogleVertexAI extends chat_models_1.BaseChatModel {
    get lc_aliases() {
        return {
            model: "model_name",
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
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "chat-bison"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.2
        });
        Object.defineProperty(this, "maxOutputTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1024
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.8
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 40
        });
        Object.defineProperty(this, "examples", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streamedConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.model = fields?.model ?? this.model;
        this.temperature = fields?.temperature ?? this.temperature;
        this.maxOutputTokens = fields?.maxOutputTokens ?? this.maxOutputTokens;
        this.topP = fields?.topP ?? this.topP;
        this.topK = fields?.topK ?? this.topK;
        this.examples = fields?.examples ?? this.examples;
    }
    _combineLLMOutput() {
        // TODO: Combine the safetyAttributes
        return [];
    }
    async *_streamResponseChunks(_messages, _options, _runManager) {
        // Make the call as a streaming request
        const instance = this.createInstance(_messages);
        const parameters = this.formatParameters();
        const result = await this.streamedConnection.request([instance], parameters, _options);
        // Get the streaming parser of the response
        const stream = result.data;
        // Loop until the end of the stream
        // During the loop, yield each time we get a chunk from the streaming parser
        // that is either available or added to the queue
        while (!stream.streamDone) {
            const output = await stream.nextChunk();
            const chunk = output !== null
                ? BaseChatGoogleVertexAI.convertPredictionChunk(output)
                : new outputs_1.ChatGenerationChunk({
                    text: "",
                    message: new messages_1.AIMessageChunk(""),
                    generationInfo: { finishReason: "stop" },
                });
            yield chunk;
        }
    }
    async _generate(messages, options) {
        const instance = this.createInstance(messages);
        const parameters = this.formatParameters();
        const result = await this.connection.request([instance], parameters, options);
        const generations = result?.data?.predictions?.map((prediction) => BaseChatGoogleVertexAI.convertPrediction(prediction)) ?? [];
        return {
            generations,
        };
    }
    _llmType() {
        return "vertexai";
    }
    /**
     * Creates an instance of the Google Vertex AI chat model.
     * @param messages The messages for the model instance.
     * @returns A new instance of the Google Vertex AI chat model.
     */
    createInstance(messages) {
        let context = "";
        let conversationMessages = messages;
        if (messages[0]?._getType() === "system") {
            if (typeof messages[0].content !== "string") {
                throw new Error("ChatGoogleVertexAI does not support non-string message content.");
            }
            context = messages[0].content;
            conversationMessages = messages.slice(1);
        }
        // https://cloud.google.com/vertex-ai/docs/generative-ai/chat/test-chat-prompts
        if (conversationMessages.length % 2 === 0) {
            throw new Error(`Google Vertex AI requires an odd number of messages to generate a response.`);
        }
        const vertexChatMessages = conversationMessages.map((baseMessage, i) => {
            const currMessage = GoogleVertexAIChatMessage.fromChatMessage(baseMessage, this.model);
            const prevMessage = i > 0
                ? GoogleVertexAIChatMessage.fromChatMessage(conversationMessages[i - 1], this.model)
                : null;
            // https://cloud.google.com/vertex-ai/docs/generative-ai/chat/chat-prompts#messages
            if (prevMessage && currMessage.author === prevMessage.author) {
                throw new Error(`Google Vertex AI requires AI and human messages to alternate.`);
            }
            return currMessage;
        });
        const examples = this.examples.map((example) => ({
            input: GoogleVertexAIChatMessage.fromChatMessage(example.input, this.model),
            output: GoogleVertexAIChatMessage.fromChatMessage(example.output, this.model),
        }));
        const instance = {
            context,
            examples,
            messages: vertexChatMessages,
        };
        return instance;
    }
    formatParameters() {
        return {
            temperature: this.temperature,
            topK: this.topK,
            topP: this.topP,
            maxOutputTokens: this.maxOutputTokens,
        };
    }
    /**
     * Converts a prediction from the Google Vertex AI chat model to a chat
     * generation.
     * @param prediction The prediction to convert.
     * @returns The converted chat generation.
     */
    static convertPrediction(prediction) {
        const message = prediction?.candidates[0];
        return {
            text: message?.content,
            message: new messages_1.AIMessage(message.content),
            generationInfo: prediction,
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static convertPredictionChunk(output) {
        const generation = BaseChatGoogleVertexAI.convertPrediction(output.outputs[0]);
        return new outputs_1.ChatGenerationChunk({
            text: generation.text,
            message: new messages_1.AIMessageChunk(generation.message),
            generationInfo: generation.generationInfo,
        });
    }
}
exports.BaseChatGoogleVertexAI = BaseChatGoogleVertexAI;
