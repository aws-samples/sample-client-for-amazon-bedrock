import { ObjectId } from "mongodb";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, } from "@langchain/core/messages";
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
export class MongoDBChatMessageHistory extends BaseListChatMessageHistory {
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
            _id: new ObjectId(this.sessionId),
        });
        const messages = document?.messages || [];
        return mapStoredMessagesToChatMessages(messages);
    }
    async addMessage(message) {
        const messages = mapChatMessagesToStoredMessages([message]);
        await this.collection.updateOne({ _id: new ObjectId(this.sessionId) }, {
            $push: { messages: { $each: messages } },
        }, { upsert: true });
    }
    async clear() {
        await this.collection.deleteOne({ _id: new ObjectId(this.sessionId) });
    }
}
