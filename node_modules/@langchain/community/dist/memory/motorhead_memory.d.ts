import { InputValues, OutputValues, MemoryVariables } from "@langchain/core/memory";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
import { BaseChatMemory, BaseChatMemoryInput } from "./chat_memory.js";
/**
 * Interface for the structure of a memory message in the Motorhead
 * service. It includes the role and content of the message.
 */
export interface MotorheadMemoryMessage {
    role: string;
    content: string;
}
/**
 * @interface
 */
export type MotorheadMemoryInput = BaseChatMemoryInput & AsyncCallerParams & {
    sessionId: string;
    url?: string;
    memoryKey?: string;
    timeout?: number;
    apiKey?: string;
    clientId?: string;
};
/**
 * Class for managing chat message memory using the Motorhead service. It
 * extends BaseChatMemory and includes methods for initializing the
 * memory, loading memory variables, and saving the context.
 */
export declare class MotorheadMemory extends BaseChatMemory {
    url: string;
    timeout: number;
    memoryKey: string;
    sessionId: string;
    context?: string;
    caller: AsyncCaller;
    apiKey?: string;
    clientId?: string;
    constructor(fields: MotorheadMemoryInput);
    get memoryKeys(): string[];
    _getHeaders(): HeadersInit;
    /**
     * Method that initializes the memory by fetching the session memory from
     * the Motorhead service. It adds the messages to the chat history and
     * sets the context if it is not 'NONE'.
     */
    init(): Promise<void>;
    /**
     * Method that loads the memory variables. It gets the chat messages and
     * returns them as a string or an array based on the returnMessages flag.
     * @param _values The input values.
     * @returns A promise that resolves with the memory variables.
     */
    loadMemoryVariables(_values: InputValues): Promise<MemoryVariables>;
    /**
     * Method that saves the context to the Motorhead service and the base
     * chat memory. It sends a POST request to the Motorhead service with the
     * input and output messages, and calls the saveContext method of the base
     * chat memory.
     * @param inputValues The input values.
     * @param outputValues The output values.
     * @returns A promise that resolves when the context is saved.
     */
    saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void>;
}
