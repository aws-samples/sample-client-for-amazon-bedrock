import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, } from "@langchain/core/messages";
import pg from "pg";
/**
 * Class for managing chat message history using a Postgres Database as a
 * storage backend. Extends the BaseListChatMessageHistory class.
 * @example
 * ```typescript
 * const chatHistory = new PostgresChatMessageHistory({
 *    tableName: "langchain_chat_histories",
 *    sessionId: "lc-example",
 *    pool: new pg.Pool({
 *      host: "127.0.0.1",
 *      port: 5432,
 *      user: "myuser",
 *      password: "ChangeMe",
 *      database: "api",
 *    }),
 * });
 * ```
 */
export class PostgresChatMessageHistory extends BaseListChatMessageHistory {
    /**
     * Creates a new PostgresChatMessageHistory.
     * @param {PostgresChatMessageHistoryInput} fields The input fields for the PostgresChatMessageHistory.
     * @param {string} fields.tableName The name of the table name to use. Defaults to `langchain_chat_histories`.
     * @param {string} fields.sessionId The session ID to use when storing and retrieving chat message history.
     * @param {pg.Pool} fields.pool The Postgres pool to use. If provided, the PostgresChatMessageHistory will use the provided pool.
     * @param {pg.PoolConfig} fields.poolConfig The configuration object for the Postgres pool. If no pool is provided, the conig will be used to create a new pool.
     * If `pool` is provided, it will be used as the Postgres pool even if `poolConfig` is also provided.
     * @throws If neither `pool` nor `poolConfig` is provided.
     */
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "postgres"]
        });
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "langchain_chat_histories"
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "initialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        const { tableName, sessionId, pool, poolConfig, escapeTableName } = fields;
        // Ensure that either a client or config is provided
        if (!pool && !poolConfig) {
            throw new Error("PostgresChatMessageHistory requires either a pool instance or pool config");
        }
        this.pool = pool ?? new pg.Pool(poolConfig);
        const _tableName = tableName || this.tableName;
        this.tableName = escapeTableName
            ? pg.escapeIdentifier(_tableName)
            : _tableName;
        this.sessionId = sessionId;
    }
    /**
     * Checks if the table has been created and creates it if it hasn't.
     * @returns Promise that resolves when the table's existence is ensured.
     */
    async ensureTable() {
        if (this.initialized)
            return;
        const query = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            message JSONB NOT NULL
        );`;
        try {
            await this.pool.query(query);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            // This error indicates that the table already exists
            // Due to asynchronous nature of the code, it is possible that
            // the table is created between the time we check if it exists
            // and the time we try to create it. It can be safely ignored.
            // If it's not this error, rethrow it.
            if (!("code" in e) || e.code !== "23505") {
                throw e;
            }
        }
        this.initialized = true;
    }
    async addMessage(message) {
        await this.ensureTable();
        const { data, type } = mapChatMessagesToStoredMessages([message])[0];
        const query = `INSERT INTO ${this.tableName} (session_id, message) VALUES ($1, $2)`;
        await this.pool.query(query, [this.sessionId, { ...data, type }]);
    }
    async getMessages() {
        await this.ensureTable();
        const query = `SELECT message FROM ${this.tableName} WHERE session_id = $1 ORDER BY id`;
        const res = await this.pool.query(query, [this.sessionId]);
        const storedMessages = res.rows.map((row) => {
            const { type, ...data } = row.message;
            return { type, data };
        });
        return mapStoredMessagesToChatMessages(storedMessages);
    }
    async clear() {
        await this.ensureTable();
        const query = `DELETE FROM ${this.tableName} WHERE session_id = $1`;
        await this.pool.query(query, [this.sessionId]);
    }
    /**
     * End the Postgres pool.
     */
    async end() {
        await this.pool.end();
    }
}
