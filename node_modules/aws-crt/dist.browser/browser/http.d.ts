/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 * @mergeTarget
 */
import { CommonHttpProxyOptions, HttpHeader, HttpHeaders as CommonHttpHeaders, HttpClientConnectionConnected, HttpClientConnectionError, HttpClientConnectionClosed, HttpStreamComplete, HttpStreamData, HttpStreamError } from '../common/http';
export { HttpHeader, HttpProxyAuthenticationType } from '../common/http';
import { BufferedEventEmitter } from '../common/event';
import { ClientBootstrap, InputStream, SocketOptions, TlsConnectionOptions } from './io';
/**
 * A collection of HTTP headers
 *
 * @category HTTP
 */
export declare class HttpHeaders implements CommonHttpHeaders {
    private headers;
    /** Construct from a collection of [name, value] pairs
     *
     * @param headers list of HttpHeader values to seat in this object
     */
    constructor(headers?: HttpHeader[]);
    /**
     * Fetches the total length of all headers
     *
     * @returns the total length of all headers
     */
    get length(): number;
    /**
     * Add a name/value pair
     * @param name The header name
     * @param value The header value
    */
    add(name: string, value: string): void;
    /**
     * Set a name/value pair, replacing any existing values for the name
     * @param name - The header name
     * @param value - The header value
    */
    set(name: string, value: string): void;
    /**
     * Get the list of values for the given name
     * @param name - The header name to look for
     * @return List of values, or empty list if none exist
     */
    get_values(name: string): string[];
    /**
     * Gets the first value for the given name, ignoring any additional values
     * @param name - The header name to look for
     * @param default_value - Value returned if no values are found for the given name
     * @return The first header value, or default if no values exist
     */
    get(name: string, default_value?: string): string;
    /**
     * Removes all values for the given name
     * @param name - The header to remove all values for
     */
    remove(name: string): void;
    /**
     * Removes a specific name/value pair
     * @param name - The header name to remove
     * @param value - The header value to remove
     */
    remove_value(name: string, value: string): void;
    /** Clears the entire header set */
    clear(): void;
    /**
     * Iterator. Allows for:
     * let headers = new HttpHeaders();
     * ...
     * for (const header of headers) { }
    */
    [Symbol.iterator](): Generator<HttpHeader, void, unknown>;
    /** @internal */
    _flatten(): HttpHeader[];
}
/**
 * Options used when connecting to an HTTP endpoint via a proxy
 *
 * @category HTTP
 */
export declare class HttpProxyOptions extends CommonHttpProxyOptions {
}
/**
 * Represents a request to a web server from a client
 *
 * @category HTTP
 */
export declare class HttpRequest {
    method: string;
    path: string;
    headers: HttpHeaders;
    body?: InputStream | undefined;
    /**
     * Constructor for the HttpRequest class
     *
     * @param method The verb to use for the request (i.e. GET, POST, PUT, DELETE, HEAD)
     * @param path The URI of the request
     * @param headers Additional custom headers to send to the server
     * @param body The request body, in the case of a POST or PUT request
     */
    constructor(method: string, path: string, headers?: HttpHeaders, body?: InputStream | undefined);
}
/**
 * Represents an HTTP connection from a client to a server
 *
 * @category HTTP
 */
export declare class HttpClientConnection extends BufferedEventEmitter {
    _axios: any;
    private axios_options;
    protected bootstrap: ClientBootstrap | undefined;
    protected socket_options?: SocketOptions;
    protected tls_options?: TlsConnectionOptions;
    protected proxy_options?: HttpProxyOptions;
    /**
     * Http connection constructor, signature synced to native version for compatibility
     *
     * @param bootstrap - (native only) leave undefined
     * @param host_name - endpoint to connection with
     * @param port - port to connect to
     * @param socketOptions - (native only) leave undefined
     * @param tlsOptions - instantiate for TLS, but actual value is unused in browse implementation
     * @param proxyOptions - options to control proxy usage when establishing the connection
     */
    constructor(bootstrap: ClientBootstrap | undefined, host_name: string, port: number, socketOptions?: SocketOptions, tlsOptions?: TlsConnectionOptions, proxyOptions?: HttpProxyOptions);
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
    /**
     * Make a client initiated request to this connection.
     * @param request - The HttpRequest to attempt on this connection
     * @returns A new stream that will deliver events for the request
     */
    request(request: HttpRequest): HttpClientStream;
    /**
     * Ends the connection
     */
    close(): void;
}
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
 * Represents a single http message exchange (request/response) in HTTP.
 *
 * NOTE: Binding either the ready or response event will uncork any buffered events and start
 * event delivery
 *
 * @category HTTP
 */
export declare class HttpClientStream extends BufferedEventEmitter {
    readonly connection: HttpClientConnection;
    private response_status_code?;
    private constructor();
    /**
     * HTTP status code returned from the server.
     * @return Either the status code, or undefined if the server response has not arrived yet.
     */
    status_code(): number | undefined;
    /**
     * Begin sending the request.
     *
     * The stream does nothing until this is called. Call activate() when you
     * are ready for its callbacks and events to fire.
     */
    activate(): void;
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
    on(event: 'response', listener: HttpStreamResponse): this;
    on(event: 'data', listener: HttpStreamData): this;
    on(event: 'error', listener: HttpStreamError): this;
    on(event: 'end', listener: HttpStreamComplete): this;
    /** @internal */
    static _create(connection: HttpClientConnection): HttpClientStream;
    /** @internal */
    _on_response(response: any): void;
    /** @internal */
    _on_error(error: any): void;
}
/**
 * Creates, manages, and vends connections to a given host/port endpoint
 *
 * @category HTTP
 */
export declare class HttpClientConnectionManager {
    readonly bootstrap: ClientBootstrap | undefined;
    readonly host: string;
    readonly port: number;
    readonly max_connections: number;
    readonly initial_window_size: number;
    readonly socket_options?: SocketOptions | undefined;
    readonly tls_opts?: TlsConnectionOptions | undefined;
    readonly proxy_options?: HttpProxyOptions | undefined;
    private pending_connections;
    private live_connections;
    private free_connections;
    private pending_requests;
    /**
     * Constructor for the HttpClientConnectionManager class.  Signature stays in sync with native implementation
     * for compatibility purposes (leads to some useless params)
     *
     * @param bootstrap - (native only) leave undefined
     * @param host - endpoint to pool connections for
     * @param port - port to connect to
     * @param max_connections - maximum allowed connection count
     * @param initial_window_size - (native only) leave as zero
     * @param socket_options - (native only) leave null
     * @param tls_opts - if not null TLS will be used, otherwise plain http will be used
     * @param proxy_options - configuration for establishing connections through a proxy
     */
    constructor(bootstrap: ClientBootstrap | undefined, host: string, port: number, max_connections: number, initial_window_size: number, socket_options?: SocketOptions | undefined, tls_opts?: TlsConnectionOptions | undefined, proxy_options?: HttpProxyOptions | undefined);
    private remove;
    private resolve;
    private reject;
    private pump;
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
