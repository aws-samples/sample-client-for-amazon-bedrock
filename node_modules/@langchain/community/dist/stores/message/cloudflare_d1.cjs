"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareD1MessageHistory = void 0;
const uuid_1 = require("uuid");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Class for storing and retrieving chat message history from a
 * Cloudflare D1 database. Extends the BaseListChatMessageHistory class.
 * @example
 * ```typescript
 * const memory = new BufferMemory({
 *   returnMessages: true,
 *   chatHistory: new CloudflareD1MessageHistory({
 *     tableName: "stored_message",
 *     sessionId: "example",
 *     database: env.DB,
 *   }),
 * });
 *
 * const chainInput = { input };
 *
 * const res = await memory.chatHistory.invoke(chainInput);
 * await memory.saveContext(chainInput, {
 *   output: res,
 * });
 * ```
 */
class CloudflareD1MessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "cloudflare_d1"]
        });
        Object.defineProperty(this, "database", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableName", {
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
        Object.defineProperty(this, "tableInitialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { sessionId, database, tableName } = fields;
        if (database) {
            this.database = database;
        }
        else {
            throw new Error("Either a client or config must be provided to CloudflareD1MessageHistory");
        }
        this.tableName = tableName || "langchain_chat_histories";
        this.tableInitialized = false;
        this.sessionId = sessionId;
    }
    /**
     * Private method to ensure that the necessary table exists in the
     * Cloudflare D1 database before performing any operations. If the table
     * does not exist, it is created.
     * @returns Promise that resolves to void.
     */
    async ensureTable() {
        if (this.tableInitialized) {
            return;
        }
        const query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (id TEXT PRIMARY KEY, session_id TEXT, type TEXT, content TEXT, role TEXT, name TEXT, additional_kwargs TEXT);`;
        await this.database.prepare(query).bind().all();
        const idIndexQuery = `CREATE INDEX IF NOT EXISTS id_index ON ${this.tableName} (id);`;
        await this.database.prepare(idIndexQuery).bind().all();
        const sessionIdIndexQuery = `CREATE INDEX IF NOT EXISTS session_id_index ON ${this.tableName} (session_id);`;
        await this.database.prepare(sessionIdIndexQuery).bind().all();
        this.tableInitialized = true;
    }
    /**
     * Method to retrieve all messages from the Cloudflare D1 database for the
     * current session.
     * @returns Promise that resolves to an array of BaseMessage objects.
     */
    async getMessages() {
        await this.ensureTable();
        const query = `SELECT * FROM ${this.tableName} WHERE session_id = ?`;
        const rawStoredMessages = await this.database
            .prepare(query)
            .bind(this.sessionId)
            .all();
        const storedMessagesObject = rawStoredMessages.results;
        const orderedMessages = storedMessagesObject.map((message) => {
            const data = {
                content: message.content,
                additional_kwargs: JSON.parse(message.additional_kwargs),
            };
            if (message.role) {
                data.role = message.role;
            }
            if (message.name) {
                data.name = message.name;
            }
            return {
                type: message.type,
                data,
            };
        });
        return (0, messages_1.mapStoredMessagesToChatMessages)(orderedMessages);
    }
    /**
     * Method to add a new message to the Cloudflare D1 database for the current
     * session.
     * @param message The BaseMessage object to be added to the database.
     * @returns Promise that resolves to void.
     */
    async addMessage(message) {
        await this.ensureTable();
        const messageToAdd = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        const query = `INSERT INTO ${this.tableName} (id, session_id, type, content, role, name, additional_kwargs) VALUES(?, ?, ?, ?, ?, ?, ?)`;
        const id = (0, uuid_1.v4)();
        await this.database
            .prepare(query)
            .bind(id, this.sessionId, messageToAdd[0].type || null, messageToAdd[0].data.content || null, messageToAdd[0].data.role || null, messageToAdd[0].data.name || null, JSON.stringify(messageToAdd[0].data.additional_kwargs))
            .all();
    }
    /**
     * Method to delete all messages from the Cloudflare D1 database for the
     * current session.
     * @returns Promise that resolves to void.
     */
    async clear() {
        await this.ensureTable();
        const query = `DELETE FROM ? WHERE session_id = ? `;
        await this.database
            .prepare(query)
            .bind(this.tableName, this.sessionId)
            .all();
    }
}
exports.CloudflareD1MessageHistory = CloudflareD1MessageHistory;
