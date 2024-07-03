export interface WebSocketConnection<T extends Uint8Array | string = Uint8Array | string> {
    readable: ReadableStream<T>;
    writable: WritableStream<T>;
    protocol: string;
    extensions: string;
}
export interface WebSocketCloseInfo {
    code?: number;
    reason?: string;
}
export interface WebSocketStreamOptions {
    protocols?: string[];
    signal?: AbortSignal;
}
/**
 * [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) with [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
 *
 * @see https://web.dev/websocketstream/
 */
export declare abstract class BaseWebSocketStream<T extends Uint8Array | string = Uint8Array | string> {
    readonly url: string;
    readonly connection: Promise<WebSocketConnection<T>>;
    readonly closed: Promise<WebSocketCloseInfo>;
    readonly close: (closeInfo?: WebSocketCloseInfo) => void;
    constructor(url: string, options?: WebSocketStreamOptions);
    abstract openWebSocket(url: string, options: WebSocketStreamOptions): WebSocket;
}
