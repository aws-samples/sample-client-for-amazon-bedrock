import type { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import { SimpleChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk } from "@langchain/core/outputs";
import type { StringWithAutocomplete } from "@langchain/core/utils/types";
import { type OllamaInput, type OllamaMessage } from "../utils/ollama.js";
export interface ChatOllamaInput extends OllamaInput {
}
export interface ChatOllamaCallOptions extends BaseLanguageModelCallOptions {
}
/**
 * A class that enables calls to the Ollama API to access large language
 * models in a chat-like fashion. It extends the SimpleChatModel class and
 * implements the OllamaInput interface.
 * @example
 * ```typescript
 * const prompt = ChatPromptTemplate.fromMessages([
 *   [
 *     "system",
 *     `You are an expert translator. Format all responses as JSON objects with two keys: "original" and "translated".`,
 *   ],
 *   ["human", `Translate "{input}" into {language}.`],
 * ]);
 *
 * const model = new ChatOllama({
 *   baseUrl: "http://api.example.com",
 *   model: "llama2",
 *   format: "json",
 * });
 *
 * const chain = prompt.pipe(model);
 *
 * const result = await chain.invoke({
 *   input: "I love programming",
 *   language: "German",
 * });
 *
 * ```
 */
export declare class ChatOllama extends SimpleChatModel<ChatOllamaCallOptions> implements ChatOllamaInput {
    static lc_name(): string;
    lc_serializable: boolean;
    model: string;
    baseUrl: string;
    keepAlive: string;
    embeddingOnly?: boolean;
    f16KV?: boolean;
    frequencyPenalty?: number;
    headers?: Record<string, string>;
    logitsAll?: boolean;
    lowVram?: boolean;
    mainGpu?: number;
    mirostat?: number;
    mirostatEta?: number;
    mirostatTau?: number;
    numBatch?: number;
    numCtx?: number;
    numGpu?: number;
    numGqa?: number;
    numKeep?: number;
    numPredict?: number;
    numThread?: number;
    penalizeNewline?: boolean;
    presencePenalty?: number;
    repeatLastN?: number;
    repeatPenalty?: number;
    ropeFrequencyBase?: number;
    ropeFrequencyScale?: number;
    temperature?: number;
    stop?: string[];
    tfsZ?: number;
    topK?: number;
    topP?: number;
    typicalP?: number;
    useMLock?: boolean;
    useMMap?: boolean;
    vocabOnly?: boolean;
    format?: StringWithAutocomplete<"json">;
    constructor(fields: OllamaInput & BaseChatModelParams);
    _llmType(): string;
    /**
     * A method that returns the parameters for an Ollama API call. It
     * includes model and options parameters.
     * @param options Optional parsed call options.
     * @returns An object containing the parameters for an Ollama API call.
     */
    invocationParams(options?: this["ParsedCallOptions"]): {
        model: string;
        format: StringWithAutocomplete<"json"> | undefined;
        keep_alive: string;
        options: {
            embedding_only: boolean | undefined;
            f16_kv: boolean | undefined;
            frequency_penalty: number | undefined;
            logits_all: boolean | undefined;
            low_vram: boolean | undefined;
            main_gpu: number | undefined;
            mirostat: number | undefined;
            mirostat_eta: number | undefined;
            mirostat_tau: number | undefined;
            num_batch: number | undefined;
            num_ctx: number | undefined;
            num_gpu: number | undefined;
            num_gqa: number | undefined;
            num_keep: number | undefined;
            num_predict: number | undefined;
            num_thread: number | undefined;
            penalize_newline: boolean | undefined;
            presence_penalty: number | undefined;
            repeat_last_n: number | undefined;
            repeat_penalty: number | undefined;
            rope_frequency_base: number | undefined;
            rope_frequency_scale: number | undefined;
            temperature: number | undefined;
            stop: string[] | undefined;
            tfs_z: number | undefined;
            top_k: number | undefined;
            top_p: number | undefined;
            typical_p: number | undefined;
            use_mlock: boolean | undefined;
            use_mmap: boolean | undefined;
            vocab_only: boolean | undefined;
        };
    };
    _combineLLMOutput(): {};
    /** @deprecated */
    _streamResponseChunksLegacy(input: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    _streamResponseChunks(input: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    protected _convertMessagesToOllamaMessages(messages: BaseMessage[]): OllamaMessage[];
    /** @deprecated */
    protected _formatMessagesAsPrompt(messages: BaseMessage[]): string;
    /** @ignore */
    _call(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<string>;
}
