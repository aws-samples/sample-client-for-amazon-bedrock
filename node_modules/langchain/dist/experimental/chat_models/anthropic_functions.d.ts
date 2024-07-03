import type { StructuredToolInterface } from "@langchain/core/tools";
import { BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk, ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { BaseFunctionCallOptions } from "@langchain/core/language_models/base";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BasePromptTemplate } from "@langchain/core/prompts";
import { type AnthropicInput } from "../../chat_models/anthropic.js";
/** @deprecated Install and use in "@langchain/anthropic/experimental" instead */
export interface ChatAnthropicFunctionsCallOptions extends BaseFunctionCallOptions {
    tools?: StructuredToolInterface[];
}
/** @deprecated Install and use in "@langchain/anthropic/experimental" instead */
export type AnthropicFunctionsInput = Partial<AnthropicInput> & BaseChatModelParams & {
    llm?: BaseChatModel;
    systemPromptTemplate?: BasePromptTemplate;
};
/** @deprecated Install and use in "@langchain/anthropic/experimental" instead */
export declare class AnthropicFunctions extends BaseChatModel<ChatAnthropicFunctionsCallOptions> {
    llm: BaseChatModel;
    stopSequences?: string[];
    systemPromptTemplate: BasePromptTemplate;
    lc_namespace: string[];
    static lc_name(): string;
    constructor(fields?: AnthropicFunctionsInput);
    invocationParams(): any;
    /** @ignore */
    _identifyingParams(): Record<string, any>;
    _streamResponseChunks(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun | undefined): Promise<ChatResult>;
    _llmType(): string;
    /** @ignore */
    _combineLLMOutput(): never[];
}
