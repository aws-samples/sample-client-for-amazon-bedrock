"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZepMemory = void 0;
const zep_js_1 = require("@getzep/zep-js");
const memory_1 = require("@langchain/core/memory");
const messages_1 = require("@langchain/core/messages");
const chat_memory_js_1 = require("./chat_memory.cjs");
/**
 * Class used to manage the memory of a chat session, including loading
 * and saving the chat history, and clearing the memory when needed. It
 * uses the ZepClient to interact with the Zep service for managing the
 * chat session's memory.
 * @example
 * ```typescript
 * const sessionId = randomUUID();
 * const zepURL = "http://your-zep-url";
 *
 * // Initialize ZepMemory with session ID, base URL, and API key
 * const memory = new ZepMemory({
 *   sessionId,
 *   baseURL: zepURL,
 *   apiKey: "change_this_key",
 * });
 *
 * // Create a ChatOpenAI model instance with specific parameters
 * const model = new ChatOpenAI({
 *   modelName: "gpt-3.5-turbo",
 *   temperature: 0,
 * });
 *
 * // Create a ConversationChain with the model and memory
 * const chain = new ConversationChain({ llm: model, memory });
 *
 * // Example of calling the chain with an input
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res1 });
 *
 * // Follow-up call to the chain to demonstrate memory usage
 * const res2 = await chain.call({ input: "What did I just say my name was?" });
 * console.log({ res2 });
 *
 * // Output the session ID and the current state of memory
 * console.log("Session ID: ", sessionId);
 * console.log("Memory: ", await memory.loadMemoryVariables({}));
 *
 * ```
 */
class ZepMemory extends chat_memory_js_1.BaseChatMemory {
    constructor(fields) {
        super({
            returnMessages: fields?.returnMessages ?? false,
            inputKey: fields?.inputKey,
            outputKey: fields?.outputKey,
        });
        Object.defineProperty(this, "humanPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Human"
        });
        Object.defineProperty(this, "aiPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "AI"
        });
        Object.defineProperty(this, "memoryKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "history"
        });
        Object.defineProperty(this, "baseURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zepClientPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zepInitFailMsg", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ZepClient is not initialized"
        });
        this.humanPrefix = fields.humanPrefix ?? this.humanPrefix;
        this.aiPrefix = fields.aiPrefix ?? this.aiPrefix;
        this.memoryKey = fields.memoryKey ?? this.memoryKey;
        this.baseURL = fields.baseURL;
        this.sessionId = fields.sessionId;
        this.zepClientPromise = zep_js_1.ZepClient.init(this.baseURL, fields.apiKey);
    }
    get memoryKeys() {
        return [this.memoryKey];
    }
    /**
     * Method that retrieves the chat history from the Zep service and formats
     * it into a list of messages.
     * @param values Input values for the method.
     * @returns Promise that resolves with the chat history formatted into a list of messages.
     */
    async loadMemoryVariables(values) {
        // use either lastN provided by developer or undefined to use the
        // server preset.
        // Wait for ZepClient to be initialized
        const zepClient = await this.zepClientPromise;
        if (!zepClient) {
            throw new Error(this.zepInitFailMsg);
        }
        const lastN = values.lastN ?? undefined;
        let memory = null;
        try {
            memory = await zepClient.memory.getMemory(this.sessionId, lastN);
        }
        catch (error) {
            // eslint-disable-next-line no-instanceof/no-instanceof
            if (error instanceof zep_js_1.NotFoundError) {
                const result = this.returnMessages
                    ? { [this.memoryKey]: [] }
                    : { [this.memoryKey]: "" };
                return result;
            }
            else {
                throw error;
            }
        }
        let messages = memory && memory.summary?.content
            ? [new messages_1.SystemMessage(memory.summary.content)]
            : [];
        if (memory) {
            messages = messages.concat(memory.messages.map((message) => {
                const { content, role } = message;
                if (role === this.humanPrefix) {
                    return new messages_1.HumanMessage(content);
                }
                else if (role === this.aiPrefix) {
                    return new messages_1.AIMessage(content);
                }
                else {
                    // default to generic ChatMessage
                    return new messages_1.ChatMessage(content, role);
                }
            }));
        }
        if (this.returnMessages) {
            return {
                [this.memoryKey]: messages,
            };
        }
        return {
            [this.memoryKey]: (0, messages_1.getBufferString)(messages, this.humanPrefix, this.aiPrefix),
        };
    }
    /**
     * Method that saves the input and output messages to the Zep service.
     * @param inputValues Input messages to be saved.
     * @param outputValues Output messages to be saved.
     * @returns Promise that resolves when the messages have been saved.
     */
    async saveContext(inputValues, outputValues) {
        const input = (0, memory_1.getInputValue)(inputValues, this.inputKey);
        const output = (0, memory_1.getOutputValue)(outputValues, this.outputKey);
        // Create new Memory and Message instances
        const memory = new zep_js_1.Memory({
            messages: [
                new zep_js_1.Message({
                    role: this.humanPrefix,
                    content: `${input}`,
                }),
                new zep_js_1.Message({
                    role: this.aiPrefix,
                    content: `${output}`,
                }),
            ],
        });
        // Wait for ZepClient to be initialized
        const zepClient = await this.zepClientPromise;
        if (!zepClient) {
            throw new Error(this.zepInitFailMsg);
        }
        // Add the new memory to the session using the ZepClient
        if (this.sessionId) {
            try {
                await zepClient.memory.addMemory(this.sessionId, memory);
            }
            catch (error) {
                console.error("Error adding memory: ", error);
            }
        }
        // Call the superclass's saveContext method
        await super.saveContext(inputValues, outputValues);
    }
    /**
     * Method that deletes the chat history from the Zep service.
     * @returns Promise that resolves when the chat history has been deleted.
     */
    async clear() {
        // Wait for ZepClient to be initialized
        const zepClient = await this.zepClientPromise;
        if (!zepClient) {
            throw new Error(this.zepInitFailMsg);
        }
        try {
            await zepClient.memory.deleteMemory(this.sessionId);
        }
        catch (error) {
            console.error("Error deleting session: ", error);
        }
        // Clear the superclass's chat history
        await super.clear();
    }
}
exports.ZepMemory = ZepMemory;
