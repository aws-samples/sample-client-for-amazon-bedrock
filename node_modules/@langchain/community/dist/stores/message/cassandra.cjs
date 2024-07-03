"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CassandraChatMessageHistory = void 0;
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
const cassandra_js_1 = require("../../utils/cassandra.cjs");
/**
 * Class for storing chat message history within Cassandra. It extends the
 * BaseListChatMessageHistory class and provides methods to get, add, and
 * clear messages.
 * @example
 * ```typescript
 * const chatHistory = new CassandraChatMessageHistory({
 *   cloud: {
 *     secureConnectBundle: "<path to your secure bundle>",
 *   },
 *   credentials: {
 *     username: "token",
 *     password: "<your Cassandra access token>",
 *   },
 *   keyspace: "langchain",
 *   table: "message_history",
 *   sessionId: "<some unique session identifier>",
 * });
 *
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI(),
 *   memory: chatHistory,
 * });
 *
 * const response = await chain.invoke({
 *   input: "What did I just say my name was?",
 * });
 * console.log({ response });
 * ```
 */
class CassandraChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor(options) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "cassandra"]
        });
        Object.defineProperty(this, "cassandraTable", {
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
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colSessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colMessageTs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colMessageType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sessionId = options.sessionId;
        this.options = options;
        this.colSessionId = { name: "session_id", type: "text", partition: true };
        this.colMessageTs = { name: "message_ts", type: "timestamp" };
        this.colMessageType = { name: "message_type", type: "text" };
        this.colData = { name: "data", type: "text" };
    }
    /**
     * Method to get all the messages stored in the Cassandra database.
     * @returns Array of stored BaseMessage instances.
     */
    async getMessages() {
        await this.ensureTable();
        const resultSet = await this.cassandraTable.select([this.colMessageType, this.colData], [{ name: "session_id", value: this.sessionId }]);
        const storedMessages = resultSet.rows.map((row) => ({
            type: row.message_type,
            data: JSON.parse(row.data),
        }));
        const baseMessages = (0, messages_1.mapStoredMessagesToChatMessages)(storedMessages);
        return baseMessages;
    }
    /**
     * Method to add a new message to the Cassandra database.
     * @param message The BaseMessage instance to add.
     * @returns A promise that resolves when the message has been added.
     */
    async addMessage(message) {
        await this.ensureTable();
        const messages = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        const { type, data } = messages[0];
        return this.cassandraTable
            .upsert([[this.sessionId, type, Date.now(), JSON.stringify(data)]], [
            this.colSessionId,
            this.colMessageType,
            this.colMessageTs,
            this.colData,
        ])
            .then(() => { });
    }
    /**
     * Method to clear all the messages from the Cassandra database.
     * @returns A promise that resolves when all messages have been cleared.
     */
    async clear() {
        await this.ensureTable();
        return this.cassandraTable
            .delete({ name: this.colSessionId.name, value: this.sessionId })
            .then(() => { });
    }
    /**
     * Method to initialize the Cassandra database.
     * @returns Promise that resolves when the database has been initialized.
     */
    async ensureTable() {
        if (this.cassandraTable) {
            return;
        }
        const tableConfig = {
            ...this.options,
            primaryKey: [this.colSessionId, this.colMessageTs],
            nonKeyColumns: [this.colMessageType, this.colData],
        };
        this.cassandraTable = await new cassandra_js_1.CassandraTable(tableConfig);
    }
}
exports.CassandraChatMessageHistory = CassandraChatMessageHistory;
