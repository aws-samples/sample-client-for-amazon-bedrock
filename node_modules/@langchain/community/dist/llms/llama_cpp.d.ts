import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";
import { LLM, type BaseLLMCallOptions, type BaseLLMParams } from "@langchain/core/language_models/llms";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk } from "@langchain/core/outputs";
import { LlamaBaseCppInputs } from "../utils/llama_cpp.js";
/**
 * Note that the modelPath is the only required parameter. For testing you
 * can set this in the environment variable `LLAMA_PATH`.
 */
export interface LlamaCppInputs extends LlamaBaseCppInputs, BaseLLMParams {
}
export interface LlamaCppCallOptions extends BaseLLMCallOptions {
    /** The maximum number of tokens the response should contain. */
    maxTokens?: number;
    /** A function called when matching the provided token array */
    onToken?: (tokens: number[]) => void;
}
/**
 *  To use this model you need to have the `node-llama-cpp` module installed.
 *  This can be installed using `npm install -S node-llama-cpp` and the minimum
 *  version supported in version 2.0.0.
 *  This also requires that have a locally built version of Llama2 installed.
 */
export declare class LlamaCpp extends LLM<LlamaCppCallOptions> {
    lc_serializable: boolean;
    static inputs: LlamaCppInputs;
    maxTokens?: number;
    temperature?: number;
    topK?: number;
    topP?: number;
    trimWhitespaceSuffix?: boolean;
    _model: LlamaModel;
    _context: LlamaContext;
    _session: LlamaChatSession;
    static lc_name(): string;
    constructor(inputs: LlamaCppInputs);
    _llmType(): string;
    /** @ignore */
    _call(prompt: string, options?: this["ParsedCallOptions"]): Promise<string>;
    _streamResponseChunks(prompt: string, _options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
}
