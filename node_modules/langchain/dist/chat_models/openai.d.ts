import { ChatOpenAI, type ChatOpenAICallOptions } from "@langchain/openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
export { type AzureOpenAIInput, type OpenAICallOptions, type OpenAIChatInput, } from "@langchain/openai";
export { type ChatOpenAICallOptions, ChatOpenAI };
export declare class PromptLayerChatOpenAI extends ChatOpenAI {
    promptLayerApiKey?: string;
    plTags?: string[];
    returnPromptLayerId?: boolean;
    constructor(fields?: ConstructorParameters<typeof ChatOpenAI>[0] & {
        promptLayerApiKey?: string;
        plTags?: string[];
        returnPromptLayerId?: boolean;
    });
    _generate(messages: BaseMessage[], options?: string[] | ChatOpenAICallOptions, runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
}
