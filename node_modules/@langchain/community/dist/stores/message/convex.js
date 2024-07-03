/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-extraneous-dependencies
import { makeFunctionReference, } from "convex/server";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, } from "@langchain/core/messages";
export class ConvexChatMessageHistory extends BaseListChatMessageHistory {
    constructor(config) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "convex"]
        });
        Object.defineProperty(this, "ctx", {
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
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionIdField", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messageTextFieldName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "insert", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lookup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deleteMany", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.ctx = config.ctx;
        this.sessionId = config.sessionId;
        this.table = config.table ?? "messages";
        this.index = config.index ?? "bySessionId";
        this.sessionIdField =
            config.sessionIdField ?? "sessionId";
        this.messageTextFieldName =
            config.messageTextFieldName ?? "message";
        this.insert =
            config.insert ?? makeFunctionReference("langchain/db:insert");
        this.lookup =
            config.lookup ?? makeFunctionReference("langchain/db:lookup");
        this.deleteMany =
            config.deleteMany ??
                makeFunctionReference("langchain/db:deleteMany");
    }
    async getMessages() {
        const convexDocuments = await this.ctx.runQuery(this.lookup, {
            table: this.table,
            index: this.index,
            keyField: this.sessionIdField,
            key: this.sessionId,
        });
        return mapStoredMessagesToChatMessages(convexDocuments.map((doc) => doc[this.messageTextFieldName]));
    }
    async addMessage(message) {
        const messages = mapChatMessagesToStoredMessages([message]);
        // TODO: Remove chunking when Convex handles the concurrent requests correctly
        const PAGE_SIZE = 16;
        for (let i = 0; i < messages.length; i += PAGE_SIZE) {
            await Promise.all(messages.slice(i, i + PAGE_SIZE).map((message) => this.ctx.runMutation(this.insert, {
                table: this.table,
                document: {
                    [this.sessionIdField]: this.sessionId,
                    [this.messageTextFieldName]: message,
                },
            })));
        }
    }
    async clear() {
        await this.ctx.runMutation(this.deleteMany, {
            table: this.table,
            index: this.index,
            keyField: this.sessionIdField,
            key: this.sessionId,
        });
    }
}
