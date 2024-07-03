import { OpenAI } from "@langchain/openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { LLMResult } from "@langchain/core/outputs";
export { type AzureOpenAIInput, type OpenAICallOptions, type OpenAIInput, } from "@langchain/openai";
export { OpenAI };
/**
 * PromptLayer wrapper to OpenAI
 * @augments OpenAI
 */
export declare class PromptLayerOpenAI extends OpenAI {
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    promptLayerApiKey?: string;
    plTags?: string[];
    returnPromptLayerId?: boolean;
    constructor(fields?: ConstructorParameters<typeof OpenAI>[0] & {
        promptLayerApiKey?: string;
        plTags?: string[];
        returnPromptLayerId?: boolean;
    });
    _generate(prompts: string[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<LLMResult>;
}
export { OpenAIChat, PromptLayerOpenAIChat } from "./openai-chat.js";
