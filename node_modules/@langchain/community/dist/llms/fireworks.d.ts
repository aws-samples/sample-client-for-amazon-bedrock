import { type OpenAIClient, type OpenAICallOptions, type OpenAIInput, type OpenAICoreRequestOptions, OpenAI } from "@langchain/openai";
import type { BaseLLMParams } from "@langchain/core/language_models/llms";
type FireworksUnsupportedArgs = "frequencyPenalty" | "presencePenalty" | "bestOf" | "logitBias";
type FireworksUnsupportedCallOptions = "functions" | "function_call" | "tools";
export type FireworksCallOptions = Partial<Omit<OpenAICallOptions, FireworksUnsupportedCallOptions>>;
/**
 * Wrapper around Fireworks API for large language models
 *
 * Fireworks API is compatible to the OpenAI API with some limitations described in
 * https://readme.fireworks.ai/docs/openai-compatibility.
 *
 * To use, you should have the `openai` package installed and
 * the `FIREWORKS_API_KEY` environment variable set.
 */
export declare class Fireworks extends OpenAI<FireworksCallOptions> {
    static lc_name(): string;
    _llmType(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    fireworksApiKey?: string;
    constructor(fields?: Partial<Omit<OpenAIInput, "openAIApiKey" | FireworksUnsupportedArgs>> & BaseLLMParams & {
        fireworksApiKey?: string;
    });
    toJSON(): import("@langchain/core/load/serializable").Serialized;
    completionWithRetry(request: OpenAIClient.CompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Completion>>;
    completionWithRetry(request: OpenAIClient.CompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Completions.Completion>;
}
export {};
