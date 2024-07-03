/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 * @mergeTarget
 */
import crt_native from './binding';
import { NativeResource } from "./native_resource";
import { ResourceSafe } from '../common/resource_safety';
import { ClientBootstrap, SocketOptions, TlsConnectionOptions, InputStream } from './io';
import { CommonHttpProxyOptions, HttpProxyAuthenticationType, HttpClientConnectionConnected, HttpClientConnectionError, HttpClientConnectionClosed, HttpStreamComplete, HttpStreamData, HttpStreamError } from '../common/http';
/** @internal */
export { HttpHeader } from '../common/http';
/** @internal */
export { HttpProxyAuthenticationType } from '../common/http';
import { BufferedEventEmitter } from '../common/event';
/**
 * @category HTTP
 */
export type HttpHeaders = crt_native.HttpHeaders;
/**
 * @category HTTP
 */
export declare const HttpHeaders: typeof crt_native.HttpHeaders;
/** @internal */
type nativeHttpRequest = crt_native.HttpRequest;
/** @internal */
declare const nativeHttpRequest: typeof crt_native.HttpRequest;
/**
 * @category HTTP
 */
export declare class HttpRequest extends nativeHttpRequest {
    constructor(method: string, path: string, headers?: HttpHeaders, body?: InputStream);
}
declare const HttpConnection_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
/**
 * Base class for HTTP connections
 *
 * @category HTTP
 */
export declare class HttpConnection extends HttpConnection_base implements ResourceSafe {
    protected constructor(native_handle: any);
    /**
     * Close the connection.
     * Shutdown is asynchronous. This call has no effect if the connection is already
     * closing.
     */
    close(): void;
    /**
     * Emitted when the connection is connected and ready to start streams
     *
     * @event
     */
    static CONNECT: string;
    /**
     * Emitted when an error occurs on the connection
     *
     * @event
     */
    static ERROR: string;
    /**
     * Emitted when the connection has completed
     *
     * @event
     */
    static CLOSE: string;
    on(event: 'connect', listener: HttpClientConnectionConnected): this;
    on(event: 'error', listener: HttpClientConnectionError): this;
    on(event: 'close', listener: HttpClientConnectionClosed): this;
}
/**
 * Proxy connection types.
 *
 * The original behavior was to make a tunneling connection if TLS was used, and a forwarding connection if it was not.
 * There are legitimate use cases for plaintext tunneling connections, and so the implicit behavior has now
 * been replaced by this setting, with a default that maps to the old behavior.
 *
 * @category HTTP
 */
export declare enum HttpProxyConnectionType {
    /**
     * (Default for backwards compatibility).  If Tls options are supplied then the connection will be a tunneling
     * one, otherwise it will be a forwarding one.
     */
    Legacy = 0,
    /**
     * Establish a forwarding-based connection with the proxy.  Tls is not allowed in this case.
     */
    Forwarding = 1,
    /**
     * Establish a tunneling-based connection with the proxy.
     */
    Tunneling = 2
}
/**
 * Proxy options for HTTP clients.
 *
 * @category HTTP
 */
export declare class HttpProxyOptions extends CommonHttpProxyOptions {
    tls_opts?: TlsConnectionOptions | undefined;
    connection_type?: HttpProxyConnectionType | undefined;
    /**
     *
     * @param host_name Name of the proxy server to connect through
     * @param port Port number of the proxy server to connect through
     * @param auth_method Type of proxy authentication to use. Default is {@link HttpProxyAuthenticationType.None}
     * @param auth_username Username to use when `auth_type` is {@link HttpProxyAuthenticationType.Basic}
     * @param auth_password Password to use when `auth_type` is {@link HttpProxyAuthenticationType.Basic}
     * @param tls_opts Optional TLS connection options for the connection to the proxy host.
     *                 Must be distinct from the {@link TlsConnectionOptions} provided to
     *                 the HTTP connection
     * @param connection_type Optional Type of connection to make.  If not specified,
     *                 {@link HttpProxyConnectionType.Legacy} will be used.
     */
    constructor(host_name: string, port: number, auth_method?: HttpProxyAuthenticationType, auth_username?: string, auth_password?: string, tls_opts?: TlsConnectionOptions | undefined, connection_type?: HttpProxyConnectionType | undefined);
    /** @internal */
    create_native_handle(): any;
}
/**
 * Represents an HTTP connection from a client to a server
 *
 * @category HTTP
 */
export declare class HttpClientConnection extends HttpConnection {
    protected bootstrap: ClientBootstrap | undefined;
    protected socket_options: SocketOptions;
    protected tls_opts?: TlsConnectionOptions | undefined;
    private _on_setup;
    private _on_shutdown;
    /** Asynchronously establish a new HttpClientConnection.
     * @param bootstrap Client bootstrap to use when initiating socket connection.  Leave undefined to use the
     *          default system-wide bootstrap (recommended).
     * @param host_name Host to connect to
     * @param port Port to connect to on host
     * @param socket_options Socket options
     * @param tls_opts Optional TLS connection options
     * @param proxy_options Optional proxy options
    */
    constructor(bootstrap: ClientBootstrap | undefined, host_name: string, port: number, socket_options: SocketOptions, tls_opts?: TlsConnectionOptions | undefined, proxy_options?: HttpProxyOptions, handle?: any);
    /**
     * Create {@link HttpClientStream} to carry out the request/response exchange.
     *
     * NOTE: The stream sends no data until :meth:`HttpClientStream.activate()`
     * is called. Call {@link HttpStream.activate} when you're ready for
     * callbacks and events to fire.
     * @param request - The HttpRequest to attempt on this connection
     * @returns A new stream that will deliver events for the request
     */
    request(request: HttpRequest): HttpClientStream;
}
declare const HttpStream_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
/**
 * Represents a single http message exchange (request/response) in HTTP/1.1. In H2, it may
 * also represent a PUSH_PROMISE followed by the accompanying response.
 *
 * NOTE: Binding either the ready or response event will uncork any buffered events and start
 * event delivery
 *
 * @category HTTP
 */
export declare class HttpStream extends HttpStream_base implements ResourceSafe {
    readonly connection: HttpConnection;
    protected constructor(native_handle: any, connection: HttpConnection);
    /**
     * Begin sending the request.
     *
     * The stream does nothing until this is called. Call activate() when you
     * are ready for its callbacks and events to fire.
     */
    activate(): void;
    /**
     * Closes and ends all communication on this stream. Called automatically after the 'end'
     * event is delivered. Calling this manually is only necessary if you wish to terminate
     * communication mid-request/response.
     */
    close(): void;
    /** @internal */
    _on_body(data: ArrayBuffer): void;
    /** @internal */
    _on_complete(error_code: Number): void;
}
/**
 * Listener signature for event emitted from an {@link HttpClientStream} when inline headers are delivered while communicating over H2
 *
 * @param headers the set of headers
 *
 * @category HTTP
 */
export type HttpStreamHeaders = (headers: HttpHeaders) => void;
/**
 * Listener signature for event emitted from an {@link HttpClientStream} when the http response headers have arrived.
 *
 * @param status_code http response status code
 * @param headers the response's set of headers
 *
 * @category HTTP
 */
export type HttpStreamResponse = (status_code: number, headers: HttpHeaders) => void;
/**
 * Stream that sends a request and receives a response.
 *
 * Create an HttpClientStream with {@link HttpClientConnection.request}.
 *
 * NOTE: The stream sends no data until {@link HttpStream.activate} is called.
 * Call {@link HttpStream.activate} when you're ready for callbacks and events to fire.
 *
 * @category HTTP
 */
export declare class HttpClientStream extends HttpStream {
    readonly request: HttpRequest;
    private response_status_code?;
    constructor(native_handle: any, connection: HttpClientConnection, request: HttpRequest);
    /**
     * HTTP status code returned from the server.
     * @return Either the status code, or undefined if the server response has not arrived yet.
     */
    status_code(): Number | undefined;
    /**
     * Emitted when the http response headers have arrived.
     *
     * @event
     */
    static RESPONSE: string;
    /**
     * Emitted when http response data is available.
     *
     * @event
     */
    static DATA: string;
    /**
     * Emitted when an error occurs in stream processing
     *
     * @event
     */
    static ERROR: string;
    /**
     * Emitted when the stream has completed
     *
     * @event
     */
    static END: string;
    /**
     * Emitted when inline headers are delivered while communicating over H2
     *
     * @event
     */
    static HEADERS: string;
    on(event: 'response', listener: HttpStreamResponse): this;
    on(event: 'data', listener: HttpStreamData): this;
    on(event: 'error', listener: HttpStreamError): this;
    on(event: 'end', listener: HttpStreamComplete): this;
    on(event: 'headers', listener: HttpStreamHeaders): this;
    /** @internal */
    _on_response(status_code: Number, header_array: [string, string][]): void;
}
/**
 * Creates, manages, and vends connections to a given host/port endpoint
 *
 * @category HTTP
 */
export declare class HttpClientConnectionManager extends NativeResource {
    readonly bootstrap: ClientBootstrap | undefined;
    readonly host: string;
    readonly port: number;
    readonly max_connections: number;
    readonly initial_window_size: number;
    readonly socket_options: SocketOptions;
    readonly tls_opts?: TlsConnectionOptions | undefined;
    readonly proxy_options?: HttpProxyOptions | undefined;
    private connections;
    /**
     * @param bootstrap Client bootstrap to use when initiating socket connections.  Leave undefined to use the
     *          default system-wide bootstrap (recommended).
     * @param host Host to connect to
     * @param port Port to connect to on host
     * @param max_connections Maximum number of connections to pool
     * @param initial_window_size Optional initial window size
     * @param socket_options Socket options to use when initiating socket connections
     * @param tls_opts Optional TLS connection options
     * @param proxy_options Optional proxy options
     */
    constructor(bootstrap: ClientBootstrap | undefined, host: string, port: number, max_connections: number, initial_window_size: number, socket_options: SocketOptions, tls_opts?: TlsConnectionOptions | undefined, proxy_options?: HttpProxyOptions | undefined);
    /**
    * Vends a connection from the pool
    * @returns A promise that results in an HttpClientConnection. When done with the connection, return
    *          it via {@link release}
    */
    acquire(): Promise<HttpClientConnection>;
    /**
     * Returns an unused connection to the pool
     * @param connection - The connection to return
    */
    release(connection: HttpClientConnection): void;
    /** Closes all connections and rejects all pending requests */
    close(): void;
}
