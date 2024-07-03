import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { BaseFunctionCallOptions } from "@langchain/core/language_models/base";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { type ChatOllamaInput } from "../../chat_models/ollama.js";
export interface ChatOllamaFunctionsCallOptions extends BaseFunctionCallOptions {
}
export type OllamaFunctionsInput = Partial<ChatOllamaInput> & BaseChatModelParams & {
    llm?: ChatOllama;
    toolSystemPromptTemplate?: string;
};
export declare class OllamaFunctions extends BaseChatModel<ChatOllamaFunctionsCallOptions> {
    llm: ChatOllama;
    toolSystemPromptTemplate: string;
    protected defaultResponseFunction: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                response: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    lc_namespace: string[];
    static lc_name(): string;
    constructor(fields?: OllamaFunctionsInput);
    invocationParams(): {
        model: string;
        format: import("@langchain/core/utils/types").StringWithAutocomplete<"json"> | undefined;
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
    /** @ignore */
    _identifyingParams(): Record<string, any>;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun | undefined): Promise<ChatResult>;
    _llmType(): string;
    /** @ignore */
    _combineLLMOutput(): never[];
}
