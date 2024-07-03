import { LLMOptions } from "portkey-ai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult, ChatGenerationChunk } from "@langchain/core/outputs";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { PortkeySession } from "../llms/portkey.js";
export declare class PortkeyChat extends BaseChatModel {
    apiKey?: string;
    baseURL?: string;
    mode?: string;
    llms?: [LLMOptions] | null;
    session: PortkeySession;
    constructor(init?: Partial<PortkeyChat>);
    _llmType(): string;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], _?: CallbackManagerForLLMRun): Promise<ChatResult>;
    _streamResponseChunks(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    _combineLLMOutput(): {};
}
