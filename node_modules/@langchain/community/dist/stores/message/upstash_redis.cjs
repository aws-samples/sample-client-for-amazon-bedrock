"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpstashRedisChatMessageHistory = void 0;
const redis_1 = require("@upstash/redis");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
/**
 * Class used to store chat message history in Redis. It provides methods
 * to add, get, and clear messages.
 */
class UpstashRedisChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    get lc_secrets() {
        return {
            "config.url": "UPSTASH_REDIS_REST_URL",
            "config.token": "UPSTASH_REDIS_REST_TOKEN",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "upstash_redis"]
        });
        Object.defineProperty(this, "client", {
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
        Object.defineProperty(this, "sessionTTL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { sessionId, sessionTTL, config, client } = fields;
        if (client) {
            this.client = client;
        }
        else if (config) {
            this.client = new redis_1.Redis(config);
        }
        else {
            throw new Error(`Upstash Redis message stores require either a config object or a pre-configured client.`);
        }
        this.sessionId = sessionId;
        this.sessionTTL = sessionTTL;
    }
    /**
     * Retrieves the chat messages from the Redis database.
     * @returns An array of BaseMessage instances representing the chat history.
     */
    async getMessages() {
        const rawStoredMessages = await this.client.lrange(this.sessionId, 0, -1);
        const orderedMessages = rawStoredMessages.reverse();
        const previousMessages = orderedMessages.filter((x) => x.type !== undefined && x.data.content !== undefined);
        return (0, messages_1.mapStoredMessagesToChatMessages)(previousMessages);
    }
    /**
     * Adds a new message to the chat history in the Redis database.
     * @param message The message to be added to the chat history.
     * @returns Promise resolving to void.
     */
    async addMessage(message) {
        const messageToAdd = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        await this.client.lpush(this.sessionId, JSON.stringify(messageToAdd[0]));
        if (this.sessionTTL) {
            await this.client.expire(this.sessionId, this.sessionTTL);
        }
    }
    /**
     * Deletes all messages from the chat history in the Redis database.
     * @returns Promise resolving to void.
     */
    async clear() {
        await this.client.del(this.sessionId);
    }
}
exports.UpstashRedisChatMessageHistory = UpstashRedisChatMessageHistory;
