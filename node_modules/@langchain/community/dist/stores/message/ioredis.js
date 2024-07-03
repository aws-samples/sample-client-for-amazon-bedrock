import { Redis } from "ioredis";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, } from "@langchain/core/messages";
/**
 * Class used to store chat message history in Redis. It provides methods
 * to add, retrieve, and clear messages from the chat history.
 * @example
 * ```typescript
 * const chatHistory = new RedisChatMessageHistory({
 *   sessionId: new Date().toISOString(),
 *   sessionTTL: 300,
 *   url: "redis:
 * });
 *
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI({ temperature: 0 }),
 *   memory: { chatHistory },
 * });
 *
 * const response = await chain.invoke({
 *   input: "What did I just say my name was?",
 * });
 * console.log({ response });
 * ```
 */
export class RedisChatMessageHistory extends BaseListChatMessageHistory {
    get lc_secrets() {
        return {
            url: "REDIS_URL",
            "config.username": "REDIS_USERNAME",
            "config.password": "REDIS_PASSWORD",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "ioredis"]
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
        const { sessionId, sessionTTL, url, config, client } = fields;
        this.client = (client ??
            (url ? new Redis(url) : new Redis(config ?? {})));
        this.sessionId = sessionId;
        this.sessionTTL = sessionTTL;
    }
    /**
     * Retrieves all messages from the chat history.
     * @returns Promise that resolves with an array of BaseMessage instances.
     */
    async getMessages() {
        const rawStoredMessages = await this.client.lrange(this.sessionId, 0, -1);
        const orderedMessages = rawStoredMessages
            .reverse()
            .map((message) => JSON.parse(message));
        return mapStoredMessagesToChatMessages(orderedMessages);
    }
    /**
     * Adds a message to the chat history.
     * @param message The message to add to the chat history.
     * @returns Promise that resolves when the message has been added.
     */
    async addMessage(message) {
        const messageToAdd = mapChatMessagesToStoredMessages([message]);
        await this.client.lpush(this.sessionId, JSON.stringify(messageToAdd[0]));
        if (this.sessionTTL) {
            await this.client.expire(this.sessionId, this.sessionTTL);
        }
    }
    /**
     * Clears all messages from the chat history.
     * @returns Promise that resolves when the chat history has been cleared.
     */
    async clear() {
        await this.client.del(this.sessionId);
    }
}
