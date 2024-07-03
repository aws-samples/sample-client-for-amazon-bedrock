import type { StringWithAutocomplete } from "@langchain/core/utils/types";
import { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
export interface OllamaInput {
    embeddingOnly?: boolean;
    f16KV?: boolean;
    frequencyPenalty?: number;
    headers?: Record<string, string>;
    keepAlive?: string;
    logitsAll?: boolean;
    lowVram?: boolean;
    mainGpu?: number;
    model?: string;
    baseUrl?: string;
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
}
export interface OllamaRequestParams {
    model: string;
    format?: StringWithAutocomplete<"json">;
    images?: string[];
    options: {
        embedding_only?: boolean;
        f16_kv?: boolean;
        frequency_penalty?: number;
        logits_all?: boolean;
        low_vram?: boolean;
        main_gpu?: number;
        mirostat?: number;
        mirostat_eta?: number;
        mirostat_tau?: number;
        num_batch?: number;
        num_ctx?: number;
        num_gpu?: number;
        num_gqa?: number;
        num_keep?: number;
        num_thread?: number;
        num_predict?: number;
        penalize_newline?: boolean;
        presence_penalty?: number;
        repeat_last_n?: number;
        repeat_penalty?: number;
        rope_frequency_base?: number;
        rope_frequency_scale?: number;
        temperature?: number;
        stop?: string[];
        tfs_z?: number;
        top_k?: number;
        top_p?: number;
        typical_p?: number;
        use_mlock?: boolean;
        use_mmap?: boolean;
        vocab_only?: boolean;
    };
}
export type OllamaMessage = {
    role: StringWithAutocomplete<"user" | "assistant" | "system">;
    content: string;
    images?: string[];
};
export interface OllamaGenerateRequestParams extends OllamaRequestParams {
    prompt: string;
}
export interface OllamaChatRequestParams extends OllamaRequestParams {
    messages: OllamaMessage[];
}
export type BaseOllamaGenerationChunk = {
    model: string;
    created_at: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
};
export type OllamaGenerationChunk = BaseOllamaGenerationChunk & {
    response: string;
};
export type OllamaChatGenerationChunk = BaseOllamaGenerationChunk & {
    message: OllamaMessage;
};
export type OllamaCallOptions = BaseLanguageModelCallOptions & {
    headers?: Record<string, string>;
};
export declare function createOllamaGenerateStream(baseUrl: string, params: OllamaGenerateRequestParams, options: OllamaCallOptions): AsyncGenerator<OllamaGenerationChunk>;
export declare function createOllamaChatStream(baseUrl: string, params: OllamaChatRequestParams, options: OllamaCallOptions): AsyncGenerator<OllamaChatGenerationChunk>;
