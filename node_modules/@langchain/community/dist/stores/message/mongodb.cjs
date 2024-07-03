"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBChatMessageHistory = void 0;
const mongodb_1 = require("mongodb");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
/**
 * @deprecated Install and import from the "@langchain/mongodb" integration package instead.
 * @example
 * ```typescript
 * const chatHistory = new MongoDBChatMessageHistory({
 *   collection: myCollection,
 *   sessionId: 'unique-session-id',
 * });
 * const messages = await chatHistory.getMessages();
 * await chatHistory.clear();
 * ```
 */
class MongoDBChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor({ collection, sessionId }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "mongodb"]
        });
        Object.defineProperty(this, "collection", {
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
        this.collection = collection;
        this.sessionId = sessionId;
    }
    async getMessages() {
        const document = await this.collection.findOne({
            _id: new mongodb_1.ObjectId(this.sessionId),
        });
        const messages = document?.messages || [];
        return (0, messages_1.mapStoredMessagesToChatMessages)(messages);
    }
    async addMessage(message) {
        const messages = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        await this.collection.updateOne({ _id: new mongodb_1.ObjectId(this.sessionId) }, {
            $push: { messages: { $each: messages } },
        }, { upsert: true });
    }
    async clear() {
        await this.collection.deleteOne({ _id: new mongodb_1.ObjectId(this.sessionId) });
    }
}
exports.MongoDBChatMessageHistory = MongoDBChatMessageHistory;
