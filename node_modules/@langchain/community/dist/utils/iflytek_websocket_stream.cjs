"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWebSocketStream = void 0;
/**
 * [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) with [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
 *
 * @see https://web.dev/websocketstream/
 */
class BaseWebSocketStream {
    constructor(url, options = {}) {
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "closed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "close", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (options.signal?.aborted) {
            throw new DOMException("This operation was aborted", "AbortError");
        }
        this.url = url;
        const ws = this.openWebSocket(url, options);
        const closeWithInfo = ({ code, reason } = {}) => ws.close(code, reason);
        this.connection = new Promise((resolve, reject) => {
            ws.onopen = () => {
                resolve({
                    readable: new ReadableStream({
                        start(controller) {
                            ws.onmessage = ({ data }) => controller.enqueue(data);
                            ws.onerror = (e) => controller.error(e);
                        },
                        cancel: closeWithInfo,
                    }),
                    writable: new WritableStream({
                        write(chunk) {
                            ws.send(chunk);
                        },
                        abort() {
                            ws.close();
                        },
                        close: closeWithInfo,
                    }),
                    protocol: ws.protocol,
                    extensions: ws.extensions,
                });
                ws.removeEventListener("error", reject);
            };
            ws.addEventListener("error", reject);
        });
        this.closed = new Promise((resolve, reject) => {
            ws.onclose = ({ code, reason }) => {
                resolve({ code, reason });
                ws.removeEventListener("error", reject);
            };
            ws.addEventListener("error", reject);
        });
        if (options.signal) {
            // eslint-disable-next-line no-param-reassign
            options.signal.onabort = () => ws.close();
        }
        this.close = closeWithInfo;
    }
}
exports.BaseWebSocketStream = BaseWebSocketStream;
