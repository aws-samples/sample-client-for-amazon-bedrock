import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { YandexGPTInputs } from "../llms/yandex.js";
/**
 * @deprecated Prefer @langchain/yandex
 * @example
 * ```typescript
 * const chat = new ChatYandexGPT({});
 * // The assistant is set to translate English to French.
 * const res = await chat.call([
 *   new SystemMessage(
 *     "You are a helpful assistant that translates English to French."
 *   ),
 *   new HumanMessage("I love programming."),
 * ]);
 * console.log(res);
 * ```
 */
export declare class ChatYandexGPT extends BaseChatModel {
    apiKey?: string;
    iamToken?: string;
    temperature: number;
    maxTokens: number;
    model: string;
    constructor(fields?: YandexGPTInputs);
    _llmType(): string;
    _combineLLMOutput?(): {};
    /** @ignore */
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], _?: CallbackManagerForLLMRun | undefined): Promise<ChatResult>;
}
