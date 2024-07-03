import monitor from "llmonitor";
import { LLMonitorOptions, ChatMessage } from "llmonitor/types";
import { BaseRun, RunUpdate as BaseRunUpdate, KVMap } from "langsmith/schemas";
import { BaseMessage } from "@langchain/core/messages";
import { ChainValues } from "@langchain/core/utils/types";
import { LLMResult, Generation } from "@langchain/core/outputs";
import { BaseCallbackHandler, BaseCallbackHandlerInput } from "@langchain/core/callbacks/base";
import { Serialized } from "../../load/serializable.js";
type Message = BaseMessage | Generation | string;
type OutputMessage = ChatMessage | string;
export declare const convertToLLMonitorMessages: (input: Message | Message[] | Message[][]) => OutputMessage | OutputMessage[] | OutputMessage[][];
export interface Run extends BaseRun {
    id: string;
    child_runs: this[];
    child_execution_order: number;
}
export interface RunUpdate extends BaseRunUpdate {
    events: BaseRun["events"];
}
export interface LLMonitorHandlerFields extends BaseCallbackHandlerInput, LLMonitorOptions {
}
/**
 * @deprecated Please use LunaryHandler instead:
 * ```
 * import { LunaryHandler } from "@langchain/community/callbacks/handlers/lunary";
 * ```
 */
export declare class LLMonitorHandler extends BaseCallbackHandler implements LLMonitorHandlerFields {
    name: string;
    monitor: typeof monitor;
    constructor(fields?: LLMonitorHandlerFields);
    handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string, extraParams?: KVMap, tags?: string[], metadata?: KVMap): Promise<void>;
    handleChatModelStart(llm: Serialized, messages: BaseMessage[][], runId: string, parentRunId?: string, extraParams?: KVMap, tags?: string[], metadata?: KVMap): Promise<void>;
    handleLLMEnd(output: LLMResult, runId: string): Promise<void>;
    handleLLMError(error: Error, runId: string): Promise<void>;
    handleChainStart(chain: Serialized, inputs: ChainValues, runId: string, parentRunId?: string, tags?: string[], metadata?: KVMap): Promise<void>;
    handleChainEnd(outputs: ChainValues, runId: string): Promise<void>;
    handleChainError(error: Error, runId: string): Promise<void>;
    handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string, tags?: string[], metadata?: KVMap): Promise<void>;
    handleToolEnd(output: string, runId: string): Promise<void>;
    handleToolError(error: Error, runId: string): Promise<void>;
}
export {};
