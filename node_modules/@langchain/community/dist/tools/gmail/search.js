import { z } from "zod";
import { GmailBaseTool } from "./base.js";
import { SEARCH_DESCRIPTION } from "./descriptions.js";
export class GmailSearch extends GmailBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "search_gmail"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                query: z.string(),
                maxResults: z.number().optional(),
                resource: z.enum(["messages", "threads"]).optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SEARCH_DESCRIPTION
        });
    }
    async _call(arg) {
        const { query, maxResults = 10, resource = "messages" } = arg;
        const response = await this.gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults,
        });
        const { data } = response;
        if (!data) {
            throw new Error("No data returned from Gmail");
        }
        const { messages } = data;
        if (!messages) {
            throw new Error("No messages returned from Gmail");
        }
        if (resource === "messages") {
            const parsedMessages = await this.parseMessages(messages);
            return `Result for the query ${query}:\n${JSON.stringify(parsedMessages)}`;
        }
        else if (resource === "threads") {
            const parsedThreads = await this.parseThreads(messages);
            return `Result for the query ${query}:\n${JSON.stringify(parsedThreads)}`;
        }
        throw new Error(`Invalid resource: ${resource}`);
    }
    async parseMessages(messages) {
        const parsedMessages = await Promise.all(messages.map(async (message) => {
            const messageData = await this.gmail.users.messages.get({
                userId: "me",
                format: "raw",
                id: message.id ?? "",
            });
            const headers = messageData.data.payload?.headers || [];
            const subject = headers.find((header) => header.name === "Subject");
            const sender = headers.find((header) => header.name === "From");
            let body = "";
            if (messageData.data.payload?.parts) {
                body = messageData.data.payload.parts
                    .map((part) => part.body?.data ?? "")
                    .join("");
            }
            else if (messageData.data.payload?.body?.data) {
                body = messageData.data.payload.body.data;
            }
            return {
                id: message.id,
                threadId: message.threadId,
                snippet: message.snippet,
                body,
                subject,
                sender,
            };
        }));
        return parsedMessages;
    }
    async parseThreads(threads) {
        const parsedThreads = await Promise.all(threads.map(async (thread) => {
            const threadData = await this.gmail.users.threads.get({
                userId: "me",
                format: "raw",
                id: thread.id ?? "",
            });
            const headers = threadData.data.messages?.[0]?.payload?.headers || [];
            const subject = headers.find((header) => header.name === "Subject");
            const sender = headers.find((header) => header.name === "From");
            let body = "";
            if (threadData.data.messages?.[0]?.payload?.parts) {
                body = threadData.data.messages[0].payload.parts
                    .map((part) => part.body?.data ?? "")
                    .join("");
            }
            else if (threadData.data.messages?.[0]?.payload?.body?.data) {
                body = threadData.data.messages[0].payload.body.data;
            }
            return {
                id: thread.id,
                snippet: thread.snippet,
                body,
                subject,
                sender,
            };
        }));
        return parsedThreads;
    }
}
