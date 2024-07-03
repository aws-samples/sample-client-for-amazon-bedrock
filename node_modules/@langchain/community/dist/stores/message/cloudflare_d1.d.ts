import type { D1Database } from "@cloudflare/workers-types";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Type definition for the input parameters required when instantiating a
 * CloudflareD1MessageHistory object.
 */
export type CloudflareD1MessageHistoryInput = {
    tableName?: string;
    sessionId: string;
    database?: D1Database;
};
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
export declare class CloudflareD1MessageHistory extends BaseListChatMessageHistory {
    lc_namespace: string[];
    database: D1Database;
    private tableName;
    private sessionId;
    private tableInitialized;
    constructor(fields: CloudflareD1MessageHistoryInput);
    /**
     * Private method to ensure that the necessary table exists in the
     * Cloudflare D1 database before performing any operations. If the table
     * does not exist, it is created.
     * @returns Promise that resolves to void.
     */
    private ensureTable;
    /**
     * Method to retrieve all messages from the Cloudflare D1 database for the
     * current session.
     * @returns Promise that resolves to an array of BaseMessage objects.
     */
    getMessages(): Promise<BaseMessage[]>;
    /**
     * Method to add a new message to the Cloudflare D1 database for the current
     * session.
     * @param message The BaseMessage object to be added to the database.
     * @returns Promise that resolves to void.
     */
    addMessage(message: BaseMessage): Promise<void>;
    /**
     * Method to delete all messages from the Cloudflare D1 database for the
     * current session.
     * @returns Promise that resolves to void.
     */
    clear(): Promise<void>;
}
