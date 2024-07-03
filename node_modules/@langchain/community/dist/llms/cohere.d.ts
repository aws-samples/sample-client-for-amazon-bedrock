import { LLM, type BaseLLMParams } from "@langchain/core/language_models/llms";
/**
 * Interface for the input parameters specific to the Cohere model.
 * @deprecated Use `CohereInput` from `@langchain/cohere` instead.
 */
export interface CohereInput extends BaseLLMParams {
    /** Sampling temperature to use */
    temperature?: number;
    /**
     * Maximum number of tokens to generate in the completion.
     */
    maxTokens?: number;
    /** Model to use */
    model?: string;
    apiKey?: string;
}
/**
 * Class representing a Cohere Large Language Model (LLM). It interacts
 * with the Cohere API to generate text completions.
 * @example
 * ```typescript
 * const model = new Cohere({
 *   temperature: 0.7,
 *   maxTokens: 20,
 *   maxRetries: 5,
 * });
 *
 * const res = await model.invoke(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 * @deprecated Use `Cohere` from `@langchain/cohere` instead.
 */
export declare class Cohere extends LLM implements CohereInput {
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    temperature: number;
    maxTokens: number;
    model: string;
    apiKey: string;
    constructor(fields?: CohereInput);
    _llmType(): string;
    /** @ignore */
    _call(prompt: string, options: this["ParsedCallOptions"]): Promise<string>;
    /** @ignore */
    static imports(): Promise<{
        cohere: typeof import("cohere-ai");
    }>;
}
