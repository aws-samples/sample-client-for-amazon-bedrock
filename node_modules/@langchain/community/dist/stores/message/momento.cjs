"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MomentoChatMessageHistory = void 0;
/* eslint-disable no-instanceof/no-instanceof */
const sdk_core_1 = require("@gomomento/sdk-core");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
const momento_js_1 = require("../../utils/momento.cjs");
/**
 * A class that stores chat message history using Momento Cache. It
 * interacts with a Momento cache client to perform operations like
 * fetching, adding, and deleting messages.
 * @example
 * ```typescript
 * const chatHistory = await MomentoChatMessageHistory.fromProps({
 *   client: new CacheClient({
 *     configuration: Configurations.Laptop.v1(),
 *     credentialProvider: CredentialProvider.fromEnvironmentVariable({
 *       environmentVariableName: "MOMENTO_API_KEY",
 *     }),
 *     defaultTtlSeconds: 60 * 60 * 24,
 *   }),
 *   cacheName: "langchain",
 *   sessionId: new Date().toISOString(),
 *   sessionTtl: 300,
 * });
 *
 * const messages = await chatHistory.getMessages();
 * console.log({ messages });
 * ```
 */
class MomentoChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor(props) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "momento"]
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
        Object.defineProperty(this, "cacheName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionTtl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sessionId = props.sessionId;
        this.client = props.client;
        this.cacheName = props.cacheName;
        this.validateTtlSeconds(props.sessionTtl);
        this.sessionTtl =
            props.sessionTtl !== undefined
                ? sdk_core_1.CollectionTtl.of(props.sessionTtl)
                : sdk_core_1.CollectionTtl.fromCacheTtl();
    }
    /**
     * Create a new chat message history backed by Momento.
     *
     * @param {MomentoCacheProps} props The settings to instantiate the Momento chat message history.
     * @param {string} props.sessionId The session ID to use to store the data.
     * @param {ICacheClient} props.client The Momento cache client.
     * @param {string} props.cacheName The name of the cache to use to store the data.
     * @param {number} props.sessionTtl The time to live for the cache items in seconds.
     * If not specified, the cache client default is used.
     * @param {boolean} props.ensureCacheExists If true, ensure that the cache exists before returning.
     * If false, the cache is not checked for existence.
     * @throws {InvalidArgumentError} If {@link props.sessionTtl} is not strictly positive.
     * @returns A new chat message history backed by Momento.
     */
    static async fromProps(props) {
        const instance = new MomentoChatMessageHistory(props);
        if (props.ensureCacheExists || props.ensureCacheExists === undefined) {
            await (0, momento_js_1.ensureCacheExists)(props.client, props.cacheName);
        }
        return instance;
    }
    /**
     * Validate the user-specified TTL, if provided, is strictly positive.
     * @param ttlSeconds The TTL to validate.
     */
    validateTtlSeconds(ttlSeconds) {
        if (ttlSeconds !== undefined && ttlSeconds <= 0) {
            throw new sdk_core_1.InvalidArgumentError("ttlSeconds must be positive.");
        }
    }
    /**
     * Fetches messages from the cache.
     * @returns A Promise that resolves to an array of BaseMessage instances.
     */
    async getMessages() {
        const fetchResponse = await this.client.listFetch(this.cacheName, this.sessionId);
        let messages = [];
        if (fetchResponse instanceof sdk_core_1.CacheListFetch.Hit) {
            messages = fetchResponse
                .valueList()
                .map((serializedStoredMessage) => JSON.parse(serializedStoredMessage));
        }
        else if (fetchResponse instanceof sdk_core_1.CacheListFetch.Miss) {
            // pass
        }
        else if (fetchResponse instanceof sdk_core_1.CacheListFetch.Error) {
            throw fetchResponse.innerException();
        }
        else {
            throw new Error(`Unknown response type: ${fetchResponse.toString()}`);
        }
        return (0, messages_1.mapStoredMessagesToChatMessages)(messages);
    }
    /**
     * Adds a message to the cache.
     * @param message The BaseMessage instance to add to the cache.
     * @returns A Promise that resolves when the message has been added.
     */
    async addMessage(message) {
        const messageToAdd = JSON.stringify((0, messages_1.mapChatMessagesToStoredMessages)([message])[0]);
        const pushResponse = await this.client.listPushBack(this.cacheName, this.sessionId, messageToAdd, { ttl: this.sessionTtl });
        if (pushResponse instanceof sdk_core_1.CacheListPushBack.Success) {
            // pass
        }
        else if (pushResponse instanceof sdk_core_1.CacheListPushBack.Error) {
            throw pushResponse.innerException();
        }
        else {
            throw new Error(`Unknown response type: ${pushResponse.toString()}`);
        }
    }
    /**
     * Deletes all messages from the cache.
     * @returns A Promise that resolves when all messages have been deleted.
     */
    async clear() {
        const deleteResponse = await this.client.delete(this.cacheName, this.sessionId);
        if (deleteResponse instanceof sdk_core_1.CacheDelete.Success) {
            // pass
        }
        else if (deleteResponse instanceof sdk_core_1.CacheDelete.Error) {
            throw deleteResponse.innerException();
        }
        else {
            throw new Error(`Unknown response type: ${deleteResponse.toString()}`);
        }
    }
}
exports.MomentoChatMessageHistory = MomentoChatMessageHistory;
