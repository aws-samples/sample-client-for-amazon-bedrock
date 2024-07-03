import type { protos } from "@google-ai/generativelanguage";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
export type BaseMessageExamplePair = {
    input: BaseMessage;
    output: BaseMessage;
};
/**
 * An interface defining the input to the ChatGooglePaLM class.
 */
export interface GooglePaLMChatInput extends BaseChatModelParams {
    /**
     * Model Name to use
     *
     * Note: The format must follow the pattern - `models/{model}`
     */
    modelName?: string;
    /**
     * Controls the randomness of the output.
     *
     * Values can range from [0.0,1.0], inclusive. A value closer to 1.0
     * will produce responses that are more varied and creative, while
     * a value closer to 0.0 will typically result in less surprising
     * responses from the model.
     *
     * Note: The default value varies by model
     */
    temperature?: number;
    /**
     * Top-p changes how the model selects tokens for output.
     *
     * Tokens are selected from most probable to least until the sum
     * of their probabilities equals the top-p value.
     *
     * For example, if tokens A, B, and C have a probability of
     * .3, .2, and .1 and the top-p value is .5, then the model will
     * select either A or B as the next token (using temperature).
     *
     * Note: The default value varies by model
     */
    topP?: number;
    /**
     * Top-k changes how the model selects tokens for output.
     *
     * A top-k of 1 means the selected token is the most probable among
     * all tokens in the model’s vocabulary (also called greedy decoding),
     * while a top-k of 3 means that the next token is selected from
     * among the 3 most probable tokens (using temperature).
     *
     * Note: The default value varies by model
     */
    topK?: number;
    examples?: protos.google.ai.generativelanguage.v1beta2.IExample[] | BaseMessageExamplePair[];
    /**
     * Google Palm API key to use
     */
    apiKey?: string;
}
/**
 * A class that wraps the Google Palm chat model.
 *
 * @example
 * ```typescript
 * const model = new ChatGooglePaLM({
 *   apiKey: "<YOUR API KEY>",
 *   temperature: 0.7,
 *   modelName: "models/chat-bison-001",
 *   topK: 40,
 *   topP: 1,
 *   examples: [
 *     {
 *       input: new HumanMessage("What is your favorite sock color?"),
 *       output: new AIMessage("My favorite sock color be arrrr-ange!"),
 *     },
 *   ],
 * });
 * const questions = [
 *   new SystemMessage(
 *     "You are a funny assistant that answers in pirate language."
 *   ),
 *   new HumanMessage("What is your favorite food?"),
 * ];
 * const res = await model.invoke(questions);
 * console.log({ res });
 * ```
 */
export declare class ChatGooglePaLM extends BaseChatModel implements GooglePaLMChatInput {
    static lc_name(): string;
    lc_serializable: boolean;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    modelName: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    examples: protos.google.ai.generativelanguage.v1beta2.IExample[];
    apiKey?: string;
    private client;
    constructor(fields?: GooglePaLMChatInput);
    _combineLLMOutput(): never[];
    _llmType(): string;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    protected _generateMessage(messages: protos.google.ai.generativelanguage.v1beta2.IMessage[], context?: string, examples?: protos.google.ai.generativelanguage.v1beta2.IExample[]): Promise<protos.google.ai.generativelanguage.v1beta2.IGenerateMessageResponse>;
    protected _getPalmContextInstruction(messages: BaseMessage[]): string | undefined;
    protected _mapBaseMessagesToPalmMessages(messages: BaseMessage[]): protos.google.ai.generativelanguage.v1beta2.IMessage[];
    protected _mapPalmMessagesToChatResult(msgRes: protos.google.ai.generativelanguage.v1beta2.IGenerateMessageResponse): ChatResult;
}
