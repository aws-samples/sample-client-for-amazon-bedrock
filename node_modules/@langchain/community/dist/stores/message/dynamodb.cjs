"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBChatMessageHistory = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
/**
 * Class providing methods to interact with a DynamoDB table to store and
 * retrieve chat messages. It extends the `BaseListChatMessageHistory`
 * class.
 */
class DynamoDBChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    get lc_secrets() {
        return {
            "config.credentials.accessKeyId": "AWS_ACCESS_KEY_ID",
            "config.credentials.secretAccessKey": "AWS_SECRETE_ACCESS_KEY",
            "config.credentials.sessionToken": "AWS_SESSION_TOKEN",
        };
    }
    constructor({ tableName, sessionId, partitionKey, sortKey, messageAttributeName, config, key = {}, }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "dynamodb"]
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
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "partitionKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "id"
        });
        Object.defineProperty(this, "sortKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messageAttributeName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "messages"
        });
        Object.defineProperty(this, "dynamoKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        this.tableName = tableName;
        this.sessionId = sessionId;
        this.client = new client_dynamodb_1.DynamoDBClient(config ?? {});
        this.partitionKey = partitionKey ?? this.partitionKey;
        this.sortKey = sortKey;
        this.messageAttributeName =
            messageAttributeName ?? this.messageAttributeName;
        this.dynamoKey = key;
        // override dynamoKey with partition key and sort key when key not specified
        if (Object.keys(this.dynamoKey).length === 0) {
            this.dynamoKey[this.partitionKey] = { S: this.sessionId };
            if (this.sortKey) {
                this.dynamoKey[this.sortKey] = { S: this.sortKey };
            }
        }
    }
    /**
     * Retrieves all messages from the DynamoDB table and returns them as an
     * array of `BaseMessage` instances.
     * @returns Array of stored messages
     */
    async getMessages() {
        const params = {
            TableName: this.tableName,
            Key: this.dynamoKey,
        };
        const response = await this.client.send(new client_dynamodb_1.GetItemCommand(params));
        const items = response.Item
            ? response.Item[this.messageAttributeName]?.L ?? []
            : [];
        const messages = items
            .map((item) => ({
            type: item.M?.type.S,
            data: {
                role: item.M?.role?.S,
                content: item.M?.text.S,
            },
        }))
            .filter((x) => x.type !== undefined && x.data.content !== undefined);
        return (0, messages_1.mapStoredMessagesToChatMessages)(messages);
    }
    /**
     * Deletes all messages from the DynamoDB table.
     */
    async clear() {
        const params = {
            TableName: this.tableName,
            Key: this.dynamoKey,
        };
        await this.client.send(new client_dynamodb_1.DeleteItemCommand(params));
    }
    /**
     * Adds a new message to the DynamoDB table.
     * @param message The message to be added to the DynamoDB table.
     */
    async addMessage(message) {
        const messages = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        const params = {
            TableName: this.tableName,
            Key: this.dynamoKey,
            ExpressionAttributeNames: {
                "#m": this.messageAttributeName,
            },
            ExpressionAttributeValues: {
                ":empty_list": {
                    L: [],
                },
                ":m": {
                    L: messages.map((message) => {
                        const dynamoSerializedMessage = {
                            M: {
                                type: {
                                    S: message.type,
                                },
                                text: {
                                    S: message.data.content,
                                },
                            },
                        };
                        if (message.data.role) {
                            dynamoSerializedMessage.M.role = { S: message.data.role };
                        }
                        return dynamoSerializedMessage;
                    }),
                },
            },
            UpdateExpression: "SET #m = list_append(if_not_exists(#m, :empty_list), :m)",
        };
        await this.client.send(new client_dynamodb_1.UpdateItemCommand(params));
    }
}
exports.DynamoDBChatMessageHistory = DynamoDBChatMessageHistory;
