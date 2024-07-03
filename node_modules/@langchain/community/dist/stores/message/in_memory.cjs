"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageHistory = void 0;
const chat_history_1 = require("@langchain/core/chat_history");
/**
 * Class for storing chat message history in-memory. It extends the
 * BaseListChatMessageHistory class and provides methods to get, add, and
 * clear messages.
 */
class ChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor(messages) {
        super(...arguments);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "in_memory"]
        });
        Object.defineProperty(this, "messages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.messages = messages ?? [];
    }
    /**
     * Method to get all the messages stored in the ChatMessageHistory
     * instance.
     * @returns Array of stored BaseMessage instances.
     */
    async getMessages() {
        return this.messages;
    }
    /**
     * Method to add a new message to the ChatMessageHistory instance.
     * @param message The BaseMessage instance to add.
     * @returns A promise that resolves when the message has been added.
     */
    async addMessage(message) {
        this.messages.push(message);
    }
    /**
     * Method to clear all the messages from the ChatMessageHistory instance.
     * @returns A promise that resolves when all messages have been cleared.
     */
    async clear() {
        this.messages = [];
    }
}
exports.ChatMessageHistory = ChatMessageHistory;
