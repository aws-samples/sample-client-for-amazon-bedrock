import { Anthropic, AI_PROMPT, HUMAN_PROMPT, ClientOptions } from "@anthropic-ai/sdk";
import type { CompletionCreateParams } from "@anthropic-ai/sdk/resources/completions";
import type { Stream } from "@anthropic-ai/sdk/streaming";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { type BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk, type ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { type BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
export { AI_PROMPT, HUMAN_PROMPT };
export declare const DEFAULT_STOP_SEQUENCES: string[];
/**
 * Input to AnthropicChat class.
 * @deprecated Install and import from the "@langchain/anthropic" integration package instead.
 */
export interface AnthropicInput {
    /** Amount of randomness injected into the response. Ranges
     * from 0 to 1. Use temp closer to 0 for analytical /
     * multiple choice, and temp closer to 1 for creative
     * and generative tasks.
     */
    temperature?: number;
    /** Only sample from the top K options for each subsequent
     * token. Used to remove "long tail" low probability
     * responses. Defaults to -1, which disables it.
     */
    topK?: number;
    /** Does nucleus sampling, in which we compute the
     * cumulative distribution over all the options for each
     * subsequent token in decreasing probability order and
     * cut it off once it reaches a particular probability
     * specified by top_p. Defaults to -1, which disables it.
     * Note that you should either alter temperature or top_p,
     * but not both.
     */
    topP?: number;
    /** A maximum number of tokens to generate before stopping. */
    maxTokensToSample: number;
    /** A list of strings upon which to stop generating.
     * You probably want `["\n\nHuman:"]`, as that's the cue for
     * the next turn in the dialog agent.
     */
    stopSequences?: string[];
    /** Whether to stream the results or not */
    streaming?: boolean;
    /** Anthropic API key */
    anthropicApiKey?: string;
    /** Anthropic API URL */
    anthropicApiUrl?: string;
    /** Model name to use */
    modelName: string;
    /** Overridable Anthropic ClientOptions */
    clientOptions: ClientOptions;
    /** Holds any additional parameters that are valid to pass to {@link
     * https://console.anthropic.com/docs/api/reference |
     * `anthropic.complete`} that are not explicitly specified on this class.
     */
    invocationKwargs?: Kwargs;
}
/**
 * A type representing additional parameters that can be passed to the
 * Anthropic API.
 */
type Kwargs = Record<string, any>;
/**
 * @deprecated Install and import from the "@langchain/anthropic" integration package instead.
 *
 * Wrapper around Anthropic large language models.
 *
 * To use you should have the `@anthropic-ai/sdk` package installed, with the
 * `ANTHROPIC_API_KEY` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://console.anthropic.com/docs/api/reference |
 * `anthropic.complete`} can be passed through {@link invocationKwargs},
 * even if not explicitly available on this class.
 * @example
 * ```typescript
 * const model = new ChatAnthropic({
 *   temperature: 0.9,
 *   anthropicApiKey: 'YOUR-API-KEY',
 * });
 * const res = await model.invoke({ input: 'Hello!' });
 * console.log(res);
 * ```
 */
export declare class ChatAnthropic<CallOptions extends BaseLanguageModelCallOptions = BaseLanguageModelCallOptions> extends BaseChatModel<CallOptions> implements AnthropicInput {
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): Record<string, string>;
    lc_serializable: boolean;
    anthropicApiKey?: string;
    apiUrl?: string;
    temperature: number;
    topK: number;
    topP: number;
    maxTokensToSample: number;
    modelName: string;
    invocationKwargs?: Kwargs;
    stopSequences?: string[];
    streaming: boolean;
    clientOptions: ClientOptions;
    protected batchClient: Anthropic;
    protected streamingClient: Anthropic;
    constructor(fields?: Partial<AnthropicInput> & BaseChatModelParams);
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options?: this["ParsedCallOptions"]): Omit<CompletionCreateParams, "prompt"> & Kwargs;
    /** @ignore */
    _identifyingParams(): {
        metadata?: Anthropic.Completions.CompletionCreateParams.Metadata | undefined;
        stream?: boolean | undefined;
        model: "claude-2" | (string & {}) | "claude-instant-1";
        temperature?: number | undefined;
        top_p?: number | undefined;
        max_tokens_to_sample: number;
        stop_sequences?: string[] | undefined;
        top_k?: number | undefined;
        model_name: string;
    };
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): {
        metadata?: Anthropic.Completions.CompletionCreateParams.Metadata | undefined;
        stream?: boolean | undefined;
        model: "claude-2" | (string & {}) | "claude-instant-1";
        temperature?: number | undefined;
        top_p?: number | undefined;
        max_tokens_to_sample: number;
        stop_sequences?: string[] | undefined;
        top_k?: number | undefined;
        model_name: string;
    };
    _streamResponseChunks(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    /**
     * Formats messages as a prompt for the model.
     * @param messages The base messages to format as a prompt.
     * @returns The formatted prompt.
     */
    protected formatMessagesAsPrompt(messages: BaseMessage[]): string;
    /** @ignore */
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    /**
     * Creates a streaming request with retry.
     * @param request The parameters for creating a completion.
     * @returns A streaming request.
     */
    protected createStreamWithRetry(request: CompletionCreateParams & Kwargs): Promise<Stream<Anthropic.Completions.Completion>>;
    /** @ignore */
    protected completionWithRetry(request: CompletionCreateParams & Kwargs, options: {
        signal?: AbortSignal;
    }): Promise<Anthropic.Completions.Completion>;
    _llmType(): string;
    /** @ignore */
    _combineLLMOutput(): never[];
}
