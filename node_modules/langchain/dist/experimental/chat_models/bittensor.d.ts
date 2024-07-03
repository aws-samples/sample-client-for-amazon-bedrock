import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
export interface BittensorInput extends BaseChatModelParams {
    systemPrompt?: string | null | undefined;
}
/**
 * Class representing the Neural Internet chat model powerd by Bittensor, a decentralized network
 * full of different AI models.s
 * To analyze API_KEYS and logs of you usage visit
 *      https://api.neuralinternet.ai/api-keys
 *      https://api.neuralinternet.ai/logs
 */
export declare class NIBittensorChatModel extends BaseChatModel implements BittensorInput {
    static lc_name(): string;
    systemPrompt: string;
    constructor(fields?: BittensorInput);
    _combineLLMOutput(): never[];
    _llmType(): string;
    messageToOpenAIRole(message: BaseMessage): "system" | "user" | "assistant";
    stringToChatMessage(message: string): BaseMessage;
    /** Call out to NIBittensorChatModel's complete endpoint.
     Args:
         messages: The messages to pass into the model.
  
         Returns: The chat response by the model.
  
     Example:
      const chat = new NIBittensorChatModel();
      const message = new HumanMessage('What is bittensor?');
      const res = await chat.call([message]);
     */
    _generate(messages: BaseMessage[]): Promise<ChatResult>;
    identifyingParams(): {
        systemPrompt: string | null | undefined;
    };
}
