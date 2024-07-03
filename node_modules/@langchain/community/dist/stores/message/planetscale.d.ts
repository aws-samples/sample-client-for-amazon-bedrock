import { Client as PlanetScaleClient, Config as PlanetScaleConfig } from "@planetscale/database";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";
/**
 * Type definition for the input parameters required when instantiating a
 * PlanetScaleChatMessageHistory object.
 */
export type PlanetScaleChatMessageHistoryInput = {
    tableName?: string;
    sessionId: string;
    config?: PlanetScaleConfig;
    client?: PlanetScaleClient;
};
/**
 * Class for storing and retrieving chat message history from a
 * PlanetScale database. Extends the BaseListChatMessageHistory class.
 * @example
 * ```typescript
 * const chatHistory = new PlanetScaleChatMessageHistory({
 *   tableName: "stored_message",
 *   sessionId: "lc-example",
 *   config: {
 *     url: "ADD_YOURS_HERE",
 *   },
 * });
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI(),
 *   memory: chatHistory,
 * });
 * const response = await chain.invoke({
 *   input: "What did I just say my name was?",
 * });
 * console.log({ response });
 * ```
 */
export declare class PlanetScaleChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace: string[];
    get lc_secrets(): {
        "config.host": string;
        "config.username": string;
        "config.password": string;
        "config.url": string;
    };
    client: PlanetScaleClient;
    private connection;
    private tableName;
    private sessionId;
    private tableInitialized;
    constructor(fields: PlanetScaleChatMessageHistoryInput);
    /**
     * Private method to ensure that the necessary table exists in the
     * PlanetScale database before performing any operations. If the table
     * does not exist, it is created.
     * @returns Promise that resolves to void.
     */
    private ensureTable;
    /**
     * Method to retrieve all messages from the PlanetScale database for the
     * current session.
     * @returns Promise that resolves to an array of BaseMessage objects.
     */
    getMessages(): Promise<BaseMessage[]>;
    /**
     * Method to add a new message to the PlanetScale database for the current
     * session.
     * @param message The BaseMessage object to be added to the database.
     * @returns Promise that resolves to void.
     */
    addMessage(message: BaseMessage): Promise<void>;
    /**
     * Method to delete all messages from the PlanetScale database for the
     * current session.
     * @returns Promise that resolves to void.
     */
    clear(): Promise<void>;
}
