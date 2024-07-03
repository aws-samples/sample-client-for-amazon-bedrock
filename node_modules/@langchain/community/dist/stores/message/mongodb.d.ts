import { Collection, Document as MongoDBDocument } from "mongodb";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";
/** @deprecated Install and import from the "@langchain/mongodb" integration package instead. */
export interface MongoDBChatMessageHistoryInput {
    collection: Collection<MongoDBDocument>;
    sessionId: string;
}
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
export declare class MongoDBChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace: string[];
    private collection;
    private sessionId;
    constructor({ collection, sessionId }: MongoDBChatMessageHistoryInput);
    getMessages(): Promise<BaseMessage[]>;
    addMessage(message: BaseMessage): Promise<void>;
    clear(): Promise<void>;
}
