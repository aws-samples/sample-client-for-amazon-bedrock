import { OpenAIChat } from "@langchain/openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { LLMResult } from "@langchain/core/outputs";
export { type AzureOpenAIInput, type OpenAICallOptions, type OpenAIInput, type OpenAIChatCallOptions, } from "@langchain/openai";
export { OpenAIChat };
/**
 * PromptLayer wrapper to OpenAIChat
 * @deprecated
 */
export declare class PromptLayerOpenAIChat extends OpenAIChat {
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    promptLayerApiKey?: string;
    plTags?: string[];
    returnPromptLayerId?: boolean;
    constructor(fields?: ConstructorParameters<typeof OpenAIChat>[0] & {
        promptLayerApiKey?: string;
        plTags?: string[];
        returnPromptLayerId?: boolean;
    });
    _generate(prompts: string[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<LLMResult>;
}
