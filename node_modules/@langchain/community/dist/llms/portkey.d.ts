import { LLMOptions, Portkey as _Portkey } from "portkey-ai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk, LLMResult } from "@langchain/core/outputs";
import { BaseLLM } from "@langchain/core/language_models/llms";
interface PortkeyOptions {
    apiKey?: string;
    baseURL?: string;
    mode?: string;
    llms?: [LLMOptions] | null;
}
export declare class PortkeySession {
    portkey: _Portkey;
    constructor(options?: PortkeyOptions);
}
/**
 * Get a session for the Portkey API. If one already exists with the same options,
 * it will be returned. Otherwise, a new session will be created.
 * @param options
 * @returns
 */
export declare function getPortkeySession(options?: PortkeyOptions): PortkeySession;
/**
 * @example
 * ```typescript
 * const model = new Portkey({
 *   mode: "single",
 *   llms: [
 *     {
 *       provider: "openai",
 *       virtual_key: "open-ai-key-1234",
 *       model: "gpt-3.5-turbo-instruct",
 *       max_tokens: 2000,
 *     },
 *   ],
 * });
 *
 * // Stream the output of the model and process it
 * const res = await model.stream(
 *   "Question: Write a story about a king\nAnswer:"
 * );
 * for await (const i of res) {
 *   process.stdout.write(i);
 * }
 * ```
 */
export declare class Portkey extends BaseLLM {
    apiKey?: string;
    baseURL?: string;
    mode?: string;
    llms?: [LLMOptions] | null;
    session: PortkeySession;
    constructor(init?: Partial<Portkey>);
    _llmType(): string;
    _generate(prompts: string[], options: this["ParsedCallOptions"], _?: CallbackManagerForLLMRun): Promise<LLMResult>;
    _streamResponseChunks(input: string, options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
}
export {};
