import { type BaseMessage } from "@langchain/core/messages";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
/**
 * Class for storing chat message history in-memory. It extends the
 * BaseListChatMessageHistory class and provides methods to get, add, and
 * clear messages.
 */
export declare class ChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace: string[];
    private messages;
    constructor(messages?: BaseMessage[]);
    /**
     * Method to get all the messages stored in the ChatMessageHistory
     * instance.
     * @returns Array of stored BaseMessage instances.
     */
    getMessages(): Promise<BaseMessage[]>;
    /**
     * Method to add a new message to the ChatMessageHistory instance.
     * @param message The BaseMessage instance to add.
     * @returns A promise that resolves when the message has been added.
     */
    addMessage(message: BaseMessage): Promise<void>;
    /**
     * Method to clear all the messages from the ChatMessageHistory instance.
     * @returns A promise that resolves when all messages have been cleared.
     */
    clear(): Promise<void>;
}
