"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebGoogleAuth = void 0;
const google_1 = require("web-auth-library/google");
const env_1 = require("@langchain/core/utils/env");
const googlevertexai_connection_js_1 = require("./googlevertexai-connection.cjs");
class GoogleVertexAIResponseStream extends googlevertexai_connection_js_1.GoogleVertexAIStream {
    constructor(body) {
        super();
        Object.defineProperty(this, "decoder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.decoder = new TextDecoder();
        if (body) {
            void this.run(body);
        }
        else {
            console.error("Unexpected empty body while streaming");
        }
    }
    async run(body) {
        const reader = body.getReader();
        let isDone = false;
        while (!isDone) {
            const { value, done } = await reader.read();
            if (!done) {
                const svalue = this.decoder.decode(value);
                this.appendBuffer(svalue);
            }
            else {
                isDone = done;
                this.closeBuffer();
            }
        }
    }
}
class WebGoogleAuth {
    constructor(options) {
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const accessToken = options?.accessToken;
        const credentials = options?.credentials ??
            (0, env_1.getEnvironmentVariable)("GOOGLE_VERTEX_AI_WEB_CREDENTIALS");
        if (credentials === undefined)
            throw new Error(`Credentials not found. Please set the GOOGLE_VERTEX_AI_WEB_CREDENTIALS environment variable or pass credentials into "authOptions.credentials".`);
        const scope = options?.scope ?? "https://www.googleapis.com/auth/cloud-platform";
        this.options = { ...options, accessToken, credentials, scope };
    }
    async getProjectId() {
        const credentials = (0, google_1.getCredentials)(this.options.credentials);
        return credentials.project_id;
    }
    async request(opts) {
        let { accessToken } = this.options;
        if (accessToken === undefined) {
            accessToken = await (0, google_1.getAccessToken)(this.options);
        }
        if (opts.url == null)
            throw new Error("Missing URL");
        const fetchOptions = {
            method: opts.method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        };
        if (opts.data !== undefined) {
            fetchOptions.body = JSON.stringify(opts.data);
        }
        const res = await fetch(opts.url, fetchOptions);
        if (!res.ok) {
            const error = new Error(`Could not get access token for Vertex AI with status code: ${res.status}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.response = res;
            throw error;
        }
        return {
            data: opts.responseType === "json"
                ? await res.json()
                : new GoogleVertexAIResponseStream(res.body),
            config: {},
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            request: { responseURL: res.url },
        };
    }
}
exports.WebGoogleAuth = WebGoogleAuth;
