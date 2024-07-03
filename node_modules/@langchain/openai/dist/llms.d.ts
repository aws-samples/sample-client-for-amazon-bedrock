import { type ClientOptions, OpenAI as OpenAIClient } from "openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk, type LLMResult } from "@langchain/core/outputs";
import { BaseLLM, type BaseLLMParams } from "@langchain/core/language_models/llms";
import type { AzureOpenAIInput, OpenAICallOptions, OpenAICoreRequestOptions, OpenAIInput, LegacyOpenAIInput } from "./types.js";
import { OpenAIChat, OpenAIChatCallOptions } from "./legacy.js";
export type { AzureOpenAIInput, OpenAICallOptions, OpenAIInput, OpenAIChatCallOptions, };
export { OpenAIChat };
/**
 * Wrapper around OpenAI large language models.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the `openai` package installed, with the
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/completions/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 * @example
 * ```typescript
 * const model = new OpenAI({
 *   modelName: "gpt-4",
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   maxRetries: 5,
 * });
 *
 * const res = await model.call(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 */
export declare class OpenAI<CallOptions extends OpenAICallOptions = OpenAICallOptions> extends BaseLLM<CallOptions> implements OpenAIInput, AzureOpenAIInput {
    static lc_name(): string;
    get callKeys(): string[];
    lc_serializable: boolean;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): Record<string, string>;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    n: number;
    bestOf?: number;
    logitBias?: Record<string, number>;
    modelName: string;
    modelKwargs?: OpenAIInput["modelKwargs"];
    batchSize: number;
    timeout?: number;
    stop?: string[];
    user?: string;
    streaming: boolean;
    openAIApiKey?: string;
    azureOpenAIApiVersion?: string;
    azureOpenAIApiKey?: string;
    azureOpenAIApiInstanceName?: string;
    azureOpenAIApiDeploymentName?: string;
    azureOpenAIBasePath?: string;
    organization?: string;
    private client;
    private clientConfig;
    constructor(fields?: Partial<OpenAIInput> & Partial<AzureOpenAIInput> & BaseLLMParams & {
        configuration?: ClientOptions & LegacyOpenAIInput;
    }, 
    /** @deprecated */
    configuration?: ClientOptions & LegacyOpenAIInput);
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options?: this["ParsedCallOptions"]): Omit<OpenAIClient.CompletionCreateParams, "prompt">;
    /** @ignore */
    _identifyingParams(): Omit<OpenAIClient.CompletionCreateParams, "prompt"> & {
        model_name: string;
    } & ClientOptions;
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): Omit<OpenAIClient.CompletionCreateParams, "prompt"> & {
        model_name: string;
    } & ClientOptions;
    /**
     * Call out to OpenAI's endpoint with k unique prompts
     *
     * @param [prompts] - The prompts to pass into the model.
     * @param [options] - Optional list of stop words to use when generating.
     * @param [runManager] - Optional callback manager to use when generating.
     *
     * @returns The full LLM output.
     *
     * @example
     * ```ts
     * import { OpenAI } from "langchain/llms/openai";
     * const openai = new OpenAI();
     * const response = await openai.generate(["Tell me a joke."]);
     * ```
     */
    _generate(prompts: string[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<LLMResult>;
    _streamResponseChunks(input: string, options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
    /**
     * Calls the OpenAI API with retry logic in case of failures.
     * @param request The request to send to the OpenAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the OpenAI API.
     */
    completionWithRetry(request: OpenAIClient.CompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Completion>>;
    completionWithRetry(request: OpenAIClient.CompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Completions.Completion>;
    /**
     * Calls the OpenAI API with retry logic in case of failures.
     * @param request The request to send to the OpenAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the OpenAI API.
     */
    private _getClientOptions;
    _llmType(): string;
}
