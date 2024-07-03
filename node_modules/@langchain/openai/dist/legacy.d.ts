import { type ClientOptions, OpenAI as OpenAIClient } from "openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk } from "@langchain/core/outputs";
import { type BaseLLMParams, LLM } from "@langchain/core/language_models/llms";
import { AzureOpenAIInput, OpenAICallOptions, OpenAIChatInput, OpenAICoreRequestOptions, LegacyOpenAIInput } from "./types.js";
export { type AzureOpenAIInput, type OpenAIChatInput };
/**
 * Interface that extends the OpenAICallOptions interface and includes an
 * optional promptIndex property. It represents the options that can be
 * passed when making a call to the OpenAI Chat API.
 */
export interface OpenAIChatCallOptions extends OpenAICallOptions {
    promptIndex?: number;
}
/**
 * @deprecated For legacy compatibility. Use ChatOpenAI instead.
 *
 * Wrapper around OpenAI large language models that use the Chat endpoint.
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
 * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 *
 * @augments BaseLLM
 * @augments OpenAIInput
 * @augments AzureOpenAIChatInput
 * @example
 * ```typescript
 * const model = new OpenAIChat({
 *   prefixMessages: [
 *     {
 *       role: "system",
 *       content: "You are a helpful assistant that answers in pirate language",
 *     },
 *   ],
 *   maxTokens: 50,
 * });
 *
 * const res = await model.call(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 * ```
 */
export declare class OpenAIChat extends LLM<OpenAIChatCallOptions> implements OpenAIChatInput, AzureOpenAIInput {
    static lc_name(): string;
    get callKeys(): string[];
    lc_serializable: boolean;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): Record<string, string>;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    n: number;
    logitBias?: Record<string, number>;
    maxTokens?: number;
    modelName: string;
    prefixMessages?: OpenAIClient.Chat.ChatCompletionMessageParam[];
    modelKwargs?: OpenAIChatInput["modelKwargs"];
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
    constructor(fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseLLMParams & {
        configuration?: ClientOptions & LegacyOpenAIInput;
    }, 
    /** @deprecated */
    configuration?: ClientOptions & LegacyOpenAIInput);
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options?: this["ParsedCallOptions"]): Omit<OpenAIClient.Chat.ChatCompletionCreateParams, "messages">;
    /** @ignore */
    _identifyingParams(): Omit<OpenAIClient.Chat.ChatCompletionCreateParams, "messages"> & {
        model_name: string;
    } & ClientOptions;
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): Omit<OpenAIClient.Chat.ChatCompletionCreateParams, "messages"> & {
        model_name: string;
    } & ClientOptions;
    /**
     * Formats the messages for the OpenAI API.
     * @param prompt The prompt to be formatted.
     * @returns Array of formatted messages.
     */
    private formatMessages;
    _streamResponseChunks(prompt: string, options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
    /** @ignore */
    _call(prompt: string, options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<string>;
    /**
     * Calls the OpenAI API with retry logic in case of failures.
     * @param request The request to send to the OpenAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the OpenAI API.
     */
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Chat.Completions.ChatCompletionChunk>>;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Chat.Completions.ChatCompletion>;
    /** @ignore */
    private _getClientOptions;
    _llmType(): string;
}
