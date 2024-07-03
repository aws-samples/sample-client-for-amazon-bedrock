import type { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage, ChatMessage } from "@langchain/core/messages";
import { ChatGeneration, ChatGenerationChunk, ChatResult, LLMResult } from "@langchain/core/outputs";
import { GoogleVertexAILLMConnection } from "../../utils/googlevertexai-connection.js";
import { GoogleVertexAIBaseLLMInput, GoogleVertexAIBasePrediction, GoogleVertexAIModelParams } from "../../types/googlevertexai-types.js";
/**
 * Represents a single "example" exchange that can be provided to
 * help illustrate what a model response should look like.
 */
export interface ChatExample {
    input: BaseMessage;
    output: BaseMessage;
}
/**
 * Represents a single example exchange in the Google Vertex AI chat
 * model.
 */
interface GoogleVertexAIChatExample {
    input: GoogleVertexAIChatMessage;
    output: GoogleVertexAIChatMessage;
}
/**
 * Represents the author of a chat message in the Google Vertex AI chat
 * model.
 */
export type GoogleVertexAIChatAuthor = "user" | "bot" | "system" | "context";
export type GoogleVertexAIChatMessageFields = {
    author?: GoogleVertexAIChatAuthor;
    content: string;
    name?: string;
};
/**
 * Represents a chat message in the Google Vertex AI chat model.
 */
export declare class GoogleVertexAIChatMessage {
    author?: GoogleVertexAIChatAuthor;
    content: string;
    name?: string;
    constructor(fields: GoogleVertexAIChatMessageFields);
    /**
     * Extracts the role of a generic message and maps it to a Google Vertex
     * AI chat author.
     * @param message The chat message to extract the role from.
     * @returns The role of the message mapped to a Google Vertex AI chat author.
     */
    static extractGenericMessageCustomRole(message: ChatMessage): GoogleVertexAIChatAuthor;
    /**
     * Maps a message type to a Google Vertex AI chat author.
     * @param message The message to map.
     * @param model The model to use for mapping.
     * @returns The message type mapped to a Google Vertex AI chat author.
     */
    static mapMessageTypeToVertexChatAuthor(message: BaseMessage, model: string): GoogleVertexAIChatAuthor;
    /**
     * Creates a new Google Vertex AI chat message from a base message.
     * @param message The base message to convert.
     * @param model The model to use for conversion.
     * @returns A new Google Vertex AI chat message.
     */
    static fromChatMessage(message: BaseMessage, model: string): GoogleVertexAIChatMessage;
}
/**
 * Represents an instance of the Google Vertex AI chat model.
 */
export interface GoogleVertexAIChatInstance {
    context?: string;
    examples?: GoogleVertexAIChatExample[];
    messages: GoogleVertexAIChatMessage[];
}
/**
 * Defines the prediction output of the Google Vertex AI chat model.
 */
export interface GoogleVertexAIChatPrediction extends GoogleVertexAIBasePrediction {
    candidates: GoogleVertexAIChatMessage[];
}
/**
 * Defines the input to the Google Vertex AI chat model.
 */
export interface GoogleVertexAIChatInput<AuthOptions> extends GoogleVertexAIBaseLLMInput<AuthOptions> {
    /** Instructions how the model should respond */
    context?: string;
    /** Help the model understand what an appropriate response is */
    examples?: ChatExample[];
}
/**
 * Base class for Google Vertex AI chat models.
 * Implemented subclasses must provide a GoogleVertexAILLMConnection
 * with appropriate auth client.
 */
export declare class BaseChatGoogleVertexAI<AuthOptions> extends BaseChatModel implements GoogleVertexAIChatInput<AuthOptions> {
    lc_serializable: boolean;
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    examples: ChatExample[];
    connection: GoogleVertexAILLMConnection<BaseLanguageModelCallOptions, GoogleVertexAIChatInstance, GoogleVertexAIChatPrediction, AuthOptions>;
    streamedConnection: GoogleVertexAILLMConnection<BaseLanguageModelCallOptions, GoogleVertexAIChatInstance, GoogleVertexAIChatPrediction, AuthOptions>;
    get lc_aliases(): Record<string, string>;
    constructor(fields?: GoogleVertexAIChatInput<AuthOptions>);
    _combineLLMOutput(): LLMResult["llmOutput"];
    _streamResponseChunks(_messages: BaseMessage[], _options: this["ParsedCallOptions"], _runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"]): Promise<ChatResult>;
    _llmType(): string;
    /**
     * Creates an instance of the Google Vertex AI chat model.
     * @param messages The messages for the model instance.
     * @returns A new instance of the Google Vertex AI chat model.
     */
    createInstance(messages: BaseMessage[]): GoogleVertexAIChatInstance;
    formatParameters(): GoogleVertexAIModelParams;
    /**
     * Converts a prediction from the Google Vertex AI chat model to a chat
     * generation.
     * @param prediction The prediction to convert.
     * @returns The converted chat generation.
     */
    static convertPrediction(prediction: GoogleVertexAIChatPrediction): ChatGeneration;
    static convertPredictionChunk(output: any): ChatGenerationChunk;
}
export {};
