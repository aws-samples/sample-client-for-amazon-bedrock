"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAuthClient = void 0;
const google_auth_library_1 = require("google-auth-library");
const googlevertexai_connection_js_1 = require("./googlevertexai-connection.cjs");
class GoogleVertexAINodeStream extends googlevertexai_connection_js_1.GoogleVertexAIStream {
    constructor(data) {
        super();
        data.on("data", (data) => this.appendBuffer(data.toString()));
        data.on("end", () => this.closeBuffer());
    }
}
class GAuthClient {
    constructor(options) {
        Object.defineProperty(this, "gauth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.gauth = new google_auth_library_1.GoogleAuth(options);
    }
    async getProjectId() {
        return this.gauth.getProjectId();
    }
    async request(opts) {
        const ret = await this.gauth.request(opts);
        return opts.responseType !== "stream"
            ? ret
            : {
                ...ret,
                data: new GoogleVertexAINodeStream(ret.data),
            };
    }
}
exports.GAuthClient = GAuthClient;
