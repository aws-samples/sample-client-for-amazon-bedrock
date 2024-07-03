import type { BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { type OpenAIClient, type ChatOpenAICallOptions, type OpenAIChatInput, type OpenAICoreRequestOptions, ChatOpenAI } from "@langchain/openai";
type TogetherAIUnsupportedArgs = "frequencyPenalty" | "presencePenalty" | "logitBias" | "functions";
type TogetherAIUnsupportedCallOptions = "functions" | "function_call";
export interface ChatTogetherAICallOptions extends Omit<ChatOpenAICallOptions, TogetherAIUnsupportedCallOptions> {
    response_format: {
        type: "json_object";
        schema: Record<string, unknown>;
    };
}
export interface ChatTogetherAIInput extends Omit<OpenAIChatInput, "openAIApiKey" | TogetherAIUnsupportedArgs>, BaseChatModelParams {
    /**
     * The TogetherAI API key to use for requests.
     * @default process.env.TOGETHER_AI_API_KEY
     */
    togetherAIApiKey?: string;
}
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
export declare class ChatTogetherAI extends ChatOpenAI<ChatTogetherAICallOptions> {
    static lc_name(): string;
    _llmType(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    constructor(fields?: Partial<Omit<OpenAIChatInput, "openAIApiKey" | TogetherAIUnsupportedArgs>> & BaseChatModelParams & {
        togetherAIApiKey?: string;
    });
    toJSON(): import("@langchain/core/load/serializable").Serialized;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Chat.Completions.ChatCompletionChunk>>;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Chat.Completions.ChatCompletion>;
}
export {};
