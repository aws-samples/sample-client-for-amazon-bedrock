import monitor from "llmonitor";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseCallbackHandler, } from "@langchain/core/callbacks/base";
// Langchain Helpers
// Input can be either a single message, an array of message, or an array of array of messages (batch requests)
const parseRole = (id) => {
    const roleHint = id[id.length - 1];
    if (roleHint.includes("Human"))
        return "user";
    if (roleHint.includes("System"))
        return "system";
    if (roleHint.includes("AI"))
        return "ai";
    if (roleHint.includes("Function"))
        return "function";
    if (roleHint.includes("Tool"))
        return "tool";
    return "ai";
};
const PARAMS_TO_CAPTURE = [
    "stop",
    "stop_sequences",
    "function_call",
    "functions",
    "tools",
    "tool_choice",
    "response_format",
];
export const convertToLLMonitorMessages = (input) => {
    const parseMessage = (raw) => {
        if (typeof raw === "string")
            return raw;
        // sometimes the message is nested in a "message" property
        if ("message" in raw)
            return parseMessage(raw.message);
        // Serialize
        const message = JSON.parse(JSON.stringify(raw));
        try {
            // "id" contains an array describing the constructor, with last item actual schema type
            const role = parseRole(message.id);
            const obj = message.kwargs;
            const text = message.text ?? obj.content;
            return {
                role,
                text,
                ...(obj.additional_kwargs ?? {}),
            };
        }
        catch (e) {
            // if parsing fails, return the original message
            return message.text ?? message;
        }
    };
    if (Array.isArray(input)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Confuses the compiler
        return input.length === 1
            ? convertToLLMonitorMessages(input[0])
            : input.map(convertToLLMonitorMessages);
    }
    return parseMessage(input);
};
const parseInput = (rawInput) => {
    if (!rawInput)
        return null;
    const { input, inputs, question } = rawInput;
    if (input)
        return input;
    if (inputs)
        return inputs;
    if (question)
        return question;
    return rawInput;
};
const parseOutput = (rawOutput) => {
    if (!rawOutput)
        return null;
    const { text, output, answer, result } = rawOutput;
    if (text)
        return text;
    if (answer)
        return answer;
    if (output)
        return output;
    if (result)
        return result;
    return rawOutput;
};
const parseExtraAndName = (llm, extraParams, metadata) => {
    const params = {
        ...(extraParams?.invocation_params ?? {}),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore this is a valid property
        ...(llm?.kwargs ?? {}),
        ...(metadata || {}),
    };
    const { model, model_name, modelName, model_id, userId, userProps, ...rest } = params;
    const name = model || modelName || model_name || model_id || llm.id.at(-1);
    // Filter rest to only include params we want to capture
    const extra = Object.fromEntries(Object.entries(rest).filter(([key]) => PARAMS_TO_CAPTURE.includes(key) ||
        ["string", "number", "boolean"].includes(typeof rest[key])));
    return { name, extra, userId, userProps };
};
/**
 * @deprecated Please use LunaryHandler instead:
 * ```
 * import { LunaryHandler } from "@langchain/community/callbacks/handlers/lunary";
 * ```
 */
export class LLMonitorHandler extends BaseCallbackHandler {
    constructor(fields = {}) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "llmonitor_handler"
        });
        Object.defineProperty(this, "monitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.monitor = monitor;
        if (fields) {
            const { appId, apiUrl, verbose } = fields;
            this.monitor.init({
                verbose,
                appId: appId ?? getEnvironmentVariable("LLMONITOR_APP_ID"),
                apiUrl: apiUrl ?? getEnvironmentVariable("LLMONITOR_API_URL"),
            });
        }
    }
    async handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata) {
        const { name, extra, userId, userProps } = parseExtraAndName(llm, extraParams, metadata);
        await this.monitor.trackEvent("llm", "start", {
            runId,
            parentRunId,
            name,
            input: convertToLLMonitorMessages(prompts),
            extra,
            userId,
            userProps,
            tags,
            runtime: "langchain-js",
        });
    }
    async handleChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata) {
        const { name, extra, userId, userProps } = parseExtraAndName(llm, extraParams, metadata);
        await this.monitor.trackEvent("llm", "start", {
            runId,
            parentRunId,
            name,
            input: convertToLLMonitorMessages(messages),
            extra,
            userId,
            userProps,
            tags,
            runtime: "langchain-js",
        });
    }
    async handleLLMEnd(output, runId) {
        const { generations, llmOutput } = output;
        await this.monitor.trackEvent("llm", "end", {
            runId,
            output: convertToLLMonitorMessages(generations),
            tokensUsage: {
                completion: llmOutput?.tokenUsage?.completionTokens,
                prompt: llmOutput?.tokenUsage?.promptTokens,
            },
        });
    }
    async handleLLMError(error, runId) {
        await this.monitor.trackEvent("llm", "error", {
            runId,
            error,
        });
    }
    async handleChainStart(chain, inputs, runId, parentRunId, tags, metadata) {
        const { agentName, userId, userProps, ...rest } = metadata || {};
        // allow the user to specify an agent name
        const name = agentName || chain.id.at(-1);
        // Attempt to automatically detect if this is an agent or chain
        const runType = agentName || ["AgentExecutor", "PlanAndExecute"].includes(name)
            ? "agent"
            : "chain";
        await this.monitor.trackEvent(runType, "start", {
            runId,
            parentRunId,
            name,
            userId,
            userProps,
            input: parseInput(inputs),
            extra: rest,
            tags,
            runtime: "langchain-js",
        });
    }
    async handleChainEnd(outputs, runId) {
        await this.monitor.trackEvent("chain", "end", {
            runId,
            output: parseOutput(outputs),
        });
    }
    async handleChainError(error, runId) {
        await this.monitor.trackEvent("chain", "error", {
            runId,
            error,
        });
    }
    async handleToolStart(tool, input, runId, parentRunId, tags, metadata) {
        const { toolName, userId, userProps, ...rest } = metadata || {};
        const name = toolName || tool.id.at(-1);
        await this.monitor.trackEvent("tool", "start", {
            runId,
            parentRunId,
            name,
            userId,
            userProps,
            input,
            extra: rest,
            tags,
            runtime: "langchain-js",
        });
    }
    async handleToolEnd(output, runId) {
        await this.monitor.trackEvent("tool", "end", {
            runId,
            output,
        });
    }
    async handleToolError(error, runId) {
        await this.monitor.trackEvent("tool", "error", {
            runId,
            error,
        });
    }
}
