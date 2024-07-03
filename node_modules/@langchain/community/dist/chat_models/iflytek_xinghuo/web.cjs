"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIflytekXinghuo = void 0;
const common_js_1 = require("./common.cjs");
const iflytek_websocket_stream_js_1 = require("../../utils/iflytek_websocket_stream.cjs");
class WebSocketStream extends iflytek_websocket_stream_js_1.BaseWebSocketStream {
    openWebSocket(url, options) {
        return new WebSocket(url, options.protocols ?? []);
    }
}
/**
 * @example
 * ```typescript
 * const model = new ChatIflytekXinghuo();
 * const response = await model.invoke([new HumanMessage("Nice to meet you!")]);
 * console.log(response);
 * ```
 */
class ChatIflytekXinghuo extends common_js_1.BaseChatIflytekXinghuo {
    async openWebSocketStream(options) {
        const host = "spark-api.xf-yun.com";
        const date = new Date().toUTCString();
        const url = `GET /${this.version}/chat HTTP/1.1`;
        const keyBuffer = new TextEncoder().encode(this.iflytekApiSecret);
        const dataBuffer = new TextEncoder().encode(`host: ${host}\ndate: ${date}\n${url}`);
        const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
        const hash = window.btoa(String.fromCharCode(...new Uint8Array(signature)));
        const authorization_origin = `api_key="${this.iflytekApiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${hash}"`;
        const authorization = window.btoa(authorization_origin);
        let authWebSocketUrl = this.apiUrl;
        authWebSocketUrl += `?authorization=${authorization}`;
        authWebSocketUrl += `&host=${encodeURIComponent(host)}`;
        authWebSocketUrl += `&date=${encodeURIComponent(date)}`;
        return new WebSocketStream(authWebSocketUrl, options);
    }
}
exports.ChatIflytekXinghuo = ChatIflytekXinghuo;
