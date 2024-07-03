import { DynamoDBClientConfig, AttributeValue } from "@aws-sdk/client-dynamodb";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";
/**
 * Interface defining the fields required to create an instance of
 * `DynamoDBChatMessageHistory`. It includes the DynamoDB table name,
 * session ID, partition key, sort key, message attribute name, and
 * DynamoDB client configuration.
 */
export interface DynamoDBChatMessageHistoryFields {
    tableName: string;
    sessionId: string;
    partitionKey?: string;
    sortKey?: string;
    messageAttributeName?: string;
    config?: DynamoDBClientConfig;
    key?: Record<string, AttributeValue>;
}
/**
 * Class providing methods to interact with a DynamoDB table to store and
 * retrieve chat messages. It extends the `BaseListChatMessageHistory`
 * class.
 */
export declare class DynamoDBChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace: string[];
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    private tableName;
    private sessionId;
    private client;
    private partitionKey;
    private sortKey?;
    private messageAttributeName;
    private dynamoKey;
    constructor({ tableName, sessionId, partitionKey, sortKey, messageAttributeName, config, key, }: DynamoDBChatMessageHistoryFields);
    /**
     * Retrieves all messages from the DynamoDB table and returns them as an
     * array of `BaseMessage` instances.
     * @returns Array of stored messages
     */
    getMessages(): Promise<BaseMessage[]>;
    /**
     * Deletes all messages from the DynamoDB table.
     */
    clear(): Promise<void>;
    /**
     * Adds a new message to the DynamoDB table.
     * @param message The message to be added to the DynamoDB table.
     */
    addMessage(message: BaseMessage): Promise<void>;
}
