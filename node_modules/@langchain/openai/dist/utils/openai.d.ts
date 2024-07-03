import { type OpenAI as OpenAIClient } from "openai";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { convertToOpenAIFunction, convertToOpenAITool } from "@langchain/core/utils/function_calling";
export declare function wrapOpenAIClientError(e: any): any;
export { convertToOpenAIFunction as formatToOpenAIFunction, convertToOpenAITool as formatToOpenAITool, };
export declare function formatToOpenAIAssistantTool(tool: StructuredToolInterface): OpenAIClient.Beta.AssistantCreateParams.AssistantToolsFunction;
