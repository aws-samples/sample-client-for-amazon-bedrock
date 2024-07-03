import { APIConnectionTimeoutError, APIUserAbortError, } from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { convertToOpenAIFunction, convertToOpenAITool, } from "@langchain/core/utils/function_calling";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapOpenAIClientError(e) {
    let error;
    if (e.constructor.name === APIConnectionTimeoutError.name) {
        error = new Error(e.message);
        error.name = "TimeoutError";
    }
    else if (e.constructor.name === APIUserAbortError.name) {
        error = new Error(e.message);
        error.name = "AbortError";
    }
    else {
        error = e;
    }
    return error;
}
export { convertToOpenAIFunction as formatToOpenAIFunction, convertToOpenAITool as formatToOpenAITool, };
export function formatToOpenAIAssistantTool(tool) {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: zodToJsonSchema(tool.schema),
        },
    };
}
