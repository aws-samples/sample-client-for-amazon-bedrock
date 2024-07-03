"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteRetriever = void 0;
const retrievers_1 = require("@langchain/core/retrievers");
const async_caller_1 = require("@langchain/core/utils/async_caller");
/**
 * Abstract class for interacting with a remote server to retrieve
 * relevant documents based on a given query.
 */
class RemoteRetriever extends retrievers_1.BaseRetriever {
    get lc_secrets() {
        return {
            "auth.bearer": "REMOTE_RETRIEVER_AUTH_BEARER",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "auth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "asyncCaller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { url, auth, ...rest } = fields;
        this.url = url;
        this.auth = auth;
        this.headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(this.auth && this.auth.bearer
                ? { Authorization: `Bearer ${this.auth.bearer}` }
                : {}),
        };
        this.asyncCaller = new async_caller_1.AsyncCaller(rest);
    }
    async _getRelevantDocuments(query) {
        const body = this.createJsonBody(query);
        const response = await this.asyncCaller.call(() => fetch(this.url, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(body),
        }));
        if (!response.ok) {
            throw new Error(`Failed to retrieve documents from ${this.url}: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return this.processJsonResponse(json);
    }
}
exports.RemoteRetriever = RemoteRetriever;
