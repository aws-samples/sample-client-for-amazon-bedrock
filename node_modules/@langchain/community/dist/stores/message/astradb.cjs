"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstraDBChatMessageHistory = void 0;
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
const astra_db_ts_1 = require("@datastax/astra-db-ts");
/**
 * Class for storing chat message history with Astra DB. It extends the
 * BaseListChatMessageHistory class and provides methods to get, add, and
 * clear messages.
 * @example
 *
 * ```typescript
 * const client = new AstraDB(
 *   process.env.ASTRA_DB_APPLICATION_TOKEN,
 *   process.env.ASTRA_DB_ENDPOINT,
 *   process.env.ASTRA_DB_NAMESPACE
 * );
 *
 * const collection = await client.collection("test_chat");
 *
 * const chatHistory = new AstraDBChatMessageHistory({
 *   collection,
 *   sessionId: "YOUR_SESSION_ID",
 * });
 *
 * const messages = await chatHistory.getMessages();
 *
 * await chatHistory.clear();
 */
class AstraDBChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor({ collection, sessionId }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "astradb"]
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "collection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sessionId = sessionId;
        this.collection = collection;
    }
    /**
     * async initializer function to return a new instance of AstraDBChatMessageHistory in a single step
     * @param AstraDBChatMessageHistoryInput
     * @returns Promise<AstraDBChatMessageHistory>
     *
     * @example
     * const chatHistory = await AstraDBChatMessageHistory.initialize({
     *  token: process.env.ASTRA_DB_APPLICATION_TOKEN,
     *  endpoint: process.env.ASTRA_DB_ENDPOINT,
     *  namespace: process.env.ASTRA_DB_NAMESPACE,
     *  collectionName:"test_chat",
     *  sessionId: "YOUR_SESSION_ID"
     * });
     */
    static async initialize({ token, endpoint, collectionName, namespace, sessionId, }) {
        const client = new astra_db_ts_1.AstraDB(token, endpoint, namespace);
        const collection = await client.collection(collectionName);
        return new AstraDBChatMessageHistory({ collection, sessionId });
    }
    async getMessages() {
        const docs = this.collection.find({
            sessionId: this.sessionId,
        });
        const docsArray = await docs.toArray();
        const sortedDocs = docsArray.sort((a, b) => a.timestamp - b.timestamp);
        const storedMessages = sortedDocs.map((doc) => ({
            type: doc.type,
            data: doc.data,
        }));
        return (0, messages_1.mapStoredMessagesToChatMessages)(storedMessages);
    }
    async addMessage(message) {
        const messages = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        const { type, data } = messages[0];
        await this.collection.insertOne({
            sessionId: this.sessionId,
            timestamp: Date.now(),
            type,
            data,
        });
    }
    async clear() {
        await this.collection.deleteMany({
            sessionId: this.sessionId,
        });
    }
}
exports.AstraDBChatMessageHistory = AstraDBChatMessageHistory;
