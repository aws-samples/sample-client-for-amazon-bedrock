import { GoogleAuth } from "google-auth-library";
import { GoogleVertexAIStream } from "./googlevertexai-connection.js";
class GoogleVertexAINodeStream extends GoogleVertexAIStream {
    constructor(data) {
        super();
        data.on("data", (data) => this.appendBuffer(data.toString()));
        data.on("end", () => this.closeBuffer());
    }
}
export class GAuthClient {
    constructor(options) {
        Object.defineProperty(this, "gauth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.gauth = new GoogleAuth(options);
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
