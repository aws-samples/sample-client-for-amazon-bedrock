import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
/**
 * Type representing the role of a message in the Wenxin chat model.
 */
export type WenxinMessageRole = "assistant" | "user";
/**
 * Interface representing a message in the Wenxin chat model.
 */
interface WenxinMessage {
    role: WenxinMessageRole;
    content: string;
}
/**
 * Interface representing a request for a chat completion.
 */
interface ChatCompletionRequest {
    messages: WenxinMessage[];
    stream?: boolean;
    user_id?: string;
    temperature?: number;
    top_p?: number;
    penalty_score?: number;
    system?: string;
}
/**
 * Interface defining the input to the ChatBaiduWenxin class.
 */
declare interface BaiduWenxinChatInput {
    /** Model name to use. Available options are: ERNIE-Bot, ERNIE-Bot-turbo, ERNIE-Bot-4
     * @default "ERNIE-Bot-turbo"
     */
    modelName: string;
    /** Whether to stream the results or not. Defaults to false. */
    streaming?: boolean;
    /** Messages to pass as a prefix to the prompt */
    prefixMessages?: WenxinMessage[];
    /**
     * ID of the end-user who made requests.
     */
    userId?: string;
    /**
     * API key to use when making requests. Defaults to the value of
     * `BAIDU_API_KEY` environment variable.
     */
    baiduApiKey?: string;
    /**
     * Secret key to use when making requests. Defaults to the value of
     * `BAIDU_SECRET_KEY` environment variable.
     */
    baiduSecretKey?: string;
    /** Amount of randomness injected into the response. Ranges
     * from 0 to 1 (0 is not included). Use temp closer to 0 for analytical /
     * multiple choice, and temp closer to 1 for creative
     * and generative tasks. Defaults to 0.95.
     */
    temperature?: number;
    /** Total probability mass of tokens to consider at each step. Range
     * from 0 to 1.0. Defaults to 0.8.
     */
    topP?: number;
    /** Penalizes repeated tokens according to frequency. Range
     * from 1.0 to 2.0. Defaults to 1.0.
     */
    penaltyScore?: number;
}
/**
 * Wrapper around Baidu ERNIE large language models that use the Chat endpoint.
 *
 * To use you should have the `BAIDU_API_KEY` and `BAIDU_SECRET_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments BaiduERNIEInput
 * @example
 * ```typescript
 * const ernieTurbo = new ChatBaiduWenxin({
 *   baiduApiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const ernie = new ChatBaiduWenxin({
 *   modelName: "ERNIE-Bot",
 *   temperature: 1,
 *   baiduApiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const messages = [new HumanMessage("Hello")];
 *
 * let res = await ernieTurbo.call(messages);
 *
 * res = await ernie.call(messages);
 * ```
 */
export declare class ChatBaiduWenxin extends BaseChatModel implements BaiduWenxinChatInput {
    static lc_name(): string;
    get callKeys(): string[];
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    baiduApiKey?: string;
    baiduSecretKey?: string;
    accessToken: string;
    streaming: boolean;
    prefixMessages?: WenxinMessage[];
    userId?: string;
    modelName: string;
    apiUrl: string;
    temperature?: number | undefined;
    topP?: number | undefined;
    penaltyScore?: number | undefined;
    constructor(fields?: Partial<BaiduWenxinChatInput> & BaseChatModelParams);
    /**
     * Method that retrieves the access token for making requests to the Baidu
     * API.
     * @param options Optional parsed call options.
     * @returns The access token for making requests to the Baidu API.
     */
    getAccessToken(options?: this["ParsedCallOptions"]): Promise<any>;
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(): Omit<ChatCompletionRequest, "messages">;
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): {
        stream?: boolean | undefined;
        temperature?: number | undefined;
        system?: string | undefined;
        user_id?: string | undefined;
        top_p?: number | undefined;
        penalty_score?: number | undefined;
        model_name: string;
    };
    /** @ignore */
    _generate(messages: BaseMessage[], options?: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    /** @ignore */
    completionWithRetry(request: ChatCompletionRequest, stream: boolean, signal?: AbortSignal, onmessage?: (event: MessageEvent) => void): Promise<any>;
    _llmType(): string;
    /** @ignore */
    _combineLLMOutput(): never[];
}
export {};
