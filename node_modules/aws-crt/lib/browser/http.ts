/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 * @mergeTarget
 */

import {
    CommonHttpProxyOptions,
    HttpHeader,
    HttpHeaders as CommonHttpHeaders,
    HttpProxyAuthenticationType,
    HttpClientConnectionConnected,
    HttpClientConnectionError,
    HttpClientConnectionClosed,
    HttpStreamComplete,
    HttpStreamData,
    HttpStreamError
} from '../common/http';
export { HttpHeader, HttpProxyAuthenticationType } from '../common/http';
import { BufferedEventEmitter } from '../common/event';
import { CrtError } from './error';
import * as axios from "axios";
import { ClientBootstrap, InputStream, SocketOptions, TlsConnectionOptions } from './io';
import { fromUtf8 } from '@aws-sdk/util-utf8-browser';

/**
 * A collection of HTTP headers
 *
 * @category HTTP
 */
export class HttpHeaders implements CommonHttpHeaders {
    // Map from "header": [["HeAdEr", "value1"], ["HEADER", "value2"], ["header", "value3"]]
    private headers: { [index: string]: [HttpHeader] } = {};

    /** Construct from a collection of [name, value] pairs
     *
     * @param headers list of HttpHeader values to seat in this object
     */
    constructor(headers: HttpHeader[] = []) {
        for (const header of headers) {
            this.add(header[0], header[1]);
        }
    }

    /**
     * Fetches the total length of all headers
     *
     * @returns the total length of all headers
     */
    get length(): number {
        let length = 0;
        for (let key in this.headers) {
            length += this.headers[key].length;
        }
        return length;
    }

    /**
     * Add a name/value pair
     * @param name The header name
     * @param value The header value
    */
    add(name: string, value: string) {
        let values = this.headers[name.toLowerCase()];
        if (values) {
            values.push([name, value]);
        } else {
            this.headers[name.toLowerCase()] = [[name, value]];
        }
    }

    /**
     * Set a name/value pair, replacing any existing values for the name
     * @param name - The header name
     * @param value - The header value
    */
    set(name: string, value: string) {
        this.headers[name.toLowerCase()] = [[name, value]];
    }

    /**
     * Get the list of values for the given name
     * @param name - The header name to look for
     * @return List of values, or empty list if none exist
     */
    get_values(name: string) {
        const values = [];
        const values_list = this.headers[name.toLowerCase()] || [];
        for (const entry of values_list) {
            values.push(entry[1]);
        }
        return values;
    }

    /**
     * Gets the first value for the given name, ignoring any additional values
     * @param name - The header name to look for
     * @param default_value - Value returned if no values are found for the given name
     * @return The first header value, or default if no values exist
     */
    get(name: string, default_value: string = "") {
        const values = this.headers[name.toLowerCase()];
        if (!values) {
            return default_value;
        }
        return values[0][1] || default_value;
    }

    /**
     * Removes all values for the given name
     * @param name - The header to remove all values for
     */
    remove(name: string) {
        delete this.headers[name.toLowerCase()];
    }

    /**
     * Removes a specific name/value pair
     * @param name - The header name to remove
     * @param value - The header value to remove
     */
    remove_value(name: string, value: string) {
        const key = name.toLowerCase();

        let values = this.headers[key];
        for (let idx = 0; idx < values.length; ++idx) {
            const entry = values[idx];
            if (entry[1] === value) {
                if (values.length === 1) {
                    delete this.headers[key];
                } else {
                    delete values[idx];
                }
                return;
            }
        }
    }

    /** Clears the entire header set */
    clear() {
        this.headers = {};
    }

    /**
     * Iterator. Allows for:
     * let headers = new HttpHeaders();
     * ...
     * for (const header of headers) { }
    */
    *[Symbol.iterator]() {
        for (const key in this.headers) {
            const values = this.headers[key];
            for (let entry of values) {
                yield entry;
            }
        }
    }

    /** @internal */
    _flatten(): HttpHeader[] {
        let flattened = [];
        for (const pair of this) {
            flattened.push(pair);
        }
        return flattened;
    }
}

/**
 * Options used when connecting to an HTTP endpoint via a proxy
 *
 * @category HTTP
 */
export class HttpProxyOptions extends CommonHttpProxyOptions {
}

/**
 * Represents a request to a web server from a client
 *
 * @category HTTP
 */
export class HttpRequest {

    /**
     * Constructor for the HttpRequest class
     *
     * @param method The verb to use for the request (i.e. GET, POST, PUT, DELETE, HEAD)
     * @param path The URI of the request
     * @param headers Additional custom headers to send to the server
     * @param body The request body, in the case of a POST or PUT request
     */
    constructor(
        public method: string,
        public path: string,
        public headers = new HttpHeaders(),
        public body?: InputStream) {
    }
}

/**
 * Represents an HTTP connection from a client to a server
 *
 * @category HTTP
 */
export class HttpClientConnection extends BufferedEventEmitter {
    public _axios: any;
    private axios_options: axios.AxiosRequestConfig;
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
    constructor(
        bootstrap: ClientBootstrap | undefined,
        host_name: string,
        port: number,
        socketOptions?: SocketOptions,
        tlsOptions?: TlsConnectionOptions,
        proxyOptions?: HttpProxyOptions,
    ) {
        super();
        this.cork();

        this.bootstrap = bootstrap;
        this.socket_options = socketOptions;
        this.tls_options = tlsOptions;
        this.proxy_options = proxyOptions;
        const scheme = (this.tls_options || port === 443) ? 'https' : 'http'

        this.axios_options = {
            baseURL: `${scheme}://${host_name}:${port}/`
        };

        if (this.proxy_options) {
            this.axios_options.proxy = {
                host: this.proxy_options.host_name,
                port: this.proxy_options.port,
            };

            if (this.proxy_options.auth_method == HttpProxyAuthenticationType.Basic) {
                this.axios_options.proxy.auth = {
                    username: this.proxy_options.auth_username || "",
                    password: this.proxy_options.auth_password || "",
                };
            }
        }
        this._axios = axios.default.create(this.axios_options);
        setTimeout(() => {
            this.emit('connect');
        }, 0);
    }

    /**
     * Emitted when the connection is connected and ready to start streams
     *
     * @event
     */
    static CONNECT = 'connect';

    /**
     * Emitted when an error occurs on the connection
     *
     * @event
     */
    static ERROR = 'error';

    /**
     * Emitted when the connection has completed
     *
     * @event
     */
    static CLOSE = 'close';

    on(event: 'connect', listener: HttpClientConnectionConnected): this;

    on(event: 'error', listener: HttpClientConnectionError): this;

    on(event: 'close', listener: HttpClientConnectionClosed): this;

    // Override to allow uncorking on ready
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        super.on(event, listener);
        if (event == 'connect') {
            setTimeout(() => {
                this.uncork();
            }, 0);
        }
        return this;
    }

    /**
     * Make a client initiated request to this connection.
     * @param request - The HttpRequest to attempt on this connection
     * @returns A new stream that will deliver events for the request
     */
    request(request: HttpRequest) {
        return stream_request(this, request);
    }

    /**
     * Ends the connection
     */
    close() {
        this.emit('close');
        this._axios = undefined;
    }
}

function stream_request(connection: HttpClientConnection, request: HttpRequest) {
    if (request == null || request == undefined) {
        throw new CrtError("HttpClientConnection stream_request: request not defined");
    }

    const _to_object = (headers: HttpHeaders) => {
        // browsers refuse to let users configure host or user-agent
        const forbidden_headers = ['host', 'user-agent'];
        let obj: { [index: string]: string } = {};
        for (const header of headers) {
            if (forbidden_headers.indexOf(header[0].toLowerCase()) != -1) {
                continue;
            }
            obj[header[0]] = headers.get(header[0]);
        }
        return obj;
    }
    let body = (request.body) ? (request.body as InputStream).data : undefined;
    let stream = HttpClientStream._create(connection);
    stream.connection._axios.request({
        url: request.path,
        method: request.method.toLowerCase(),
        headers: _to_object(request.headers),
        body: body
    }).then((response: any) => {
        stream._on_response(response);
    }).catch((error: any) => {
        stream._on_error(error);
    });
    return stream;
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
export class HttpClientStream extends BufferedEventEmitter {
    private response_status_code?: number;

    private constructor(readonly connection: HttpClientConnection) {
        super();
        this.cork();
    }

    /**
     * HTTP status code returned from the server.
     * @return Either the status code, or undefined if the server response has not arrived yet.
     */
    status_code() {
        return this.response_status_code;
    }

    /**
     * Begin sending the request.
     *
     * The stream does nothing until this is called. Call activate() when you
     * are ready for its callbacks and events to fire.
     */
    activate() {
        setTimeout(() => {
            this.uncork();
        }, 0);
    }

    /**
     * Emitted when the http response headers have arrived.
     *
     * @event
     */
    static RESPONSE = 'response';

    /**
     * Emitted when http response data is available.
     *
     * @event
     */
    static DATA = 'data';

    /**
     * Emitted when an error occurs in stream processing
     *
     * @event
     */
    static ERROR = 'error';

    /**
     * Emitted when the stream has completed
     *
     * @event
     */
    static END = 'end';

    on(event: 'response', listener: HttpStreamResponse): this;

    on(event: 'data', listener: HttpStreamData): this;

    on(event: 'error', listener: HttpStreamError): this;

    on(event: 'end', listener: HttpStreamComplete): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    // Private helpers for stream_request()
    /** @internal */
    static _create(connection: HttpClientConnection) {
        return new HttpClientStream(connection);
    }

    // Convert axios' single response into a series of events
    /** @internal */
    _on_response(response: any) {
        this.response_status_code = response.status;
        let headers = new HttpHeaders();
        for (let header in response.headers) {
            headers.add(header, response.headers[header]);
        }
        this.emit('response', this.response_status_code, headers);
        let data = response.data;
        if (data && !(data instanceof ArrayBuffer)) {
            data = fromUtf8(data.toString());
        }
        this.emit('data', data);
        this.emit('end');
    }

    // Gather as much information as possible from the axios error
    // and pass it on to the user
    /** @internal */
    _on_error(error: any) {
        let info = "";
        if (error.response) {
            this.response_status_code = error.response.status;
            info += `status_code=${error.response.status}`;
            if (error.response.headers) {
                info += ` headers=${JSON.stringify(error.response.headers)}`;
            }
            if (error.response.data) {
                info += ` data=${error.response.data}`;
            }
        } else {
            info = "No response from server";
        }

        this.connection.close();
        this.emit('error', new Error(`msg=${error.message}, connection=${JSON.stringify(this.connection)}, info=${info}`));
    }
}

interface PendingRequest {
    resolve: (connection: HttpClientConnection) => void;
    reject: (error: CrtError) => void;
}

/**
 * Creates, manages, and vends connections to a given host/port endpoint
 *
 * @category HTTP
 */
export class HttpClientConnectionManager {
    private pending_connections = new Set<HttpClientConnection>();
    private live_connections = new Set<HttpClientConnection>();
    private free_connections: HttpClientConnection[] = [];
    private pending_requests: PendingRequest[] = [];


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
    constructor(
        readonly bootstrap: ClientBootstrap | undefined,
        readonly host: string,
        readonly port: number,
        readonly max_connections: number,
        readonly initial_window_size: number,
        readonly socket_options?: SocketOptions,
        readonly tls_opts?: TlsConnectionOptions,
        readonly proxy_options?: HttpProxyOptions
    ) {

    }

    private remove(connection: HttpClientConnection) {
        this.pending_connections.delete(connection);
        this.live_connections.delete(connection);
        const free_idx = this.free_connections.indexOf(connection);
        if (free_idx != -1) {
            this.free_connections.splice(free_idx, 1);
        }
    }

    private resolve(connection: HttpClientConnection) {
        const request = this.pending_requests.shift();
        if (request) {
            request.resolve(connection);
        } else {
            this.free_connections.push(connection);
        }
    }

    private reject(error: CrtError) {
        const request = this.pending_requests.shift();
        if (request) {
            request.reject(error);
        }
    }

    private pump() {
        if (this.pending_requests.length == 0) {
            return;
        }
        // Try to service the request with a free connection
        {
            let connection = this.free_connections.pop();
            if (connection) {
                return this.resolve(connection);
            }
        }

        // If there's no more room, nothing can be resolved right now
        if ((this.live_connections.size + this.pending_connections.size) == this.max_connections) {
            return;
        }

        // There's room, create a new connection
        let connection = new HttpClientConnection(
            new ClientBootstrap(),
            this.host,
            this.port,
            this.socket_options,
            this.tls_opts,
            this.proxy_options);
        this.pending_connections.add(connection);
        const on_connect = () => {
            this.pending_connections.delete(connection);
            this.live_connections.add(connection);
            this.free_connections.push(connection);
            this.resolve(connection);
        }
        const on_error = (error: any) => {
            if (this.pending_connections.has(connection)) {
                // Connection never connected, error it out
                return this.reject(new CrtError(error));
            }
            // If the connection errors after use, get it out of rotation and replace it
            this.remove(connection);
            this.pump();
        }
        const on_close = () => {
            this.remove(connection);
            this.pump();
        }
        connection.on('connect', on_connect);
        connection.on('error', on_error);
        connection.on('close', on_close);
    }

    /**
     * Vends a connection from the pool
     * @returns A promise that results in an HttpClientConnection. When done with the connection, return
     *          it via {@link release}
     */
    acquire(): Promise<HttpClientConnection> {
        return new Promise((resolve, reject) => {
            this.pending_requests.push({
                resolve: resolve,
                reject: reject
            });
            this.pump();
        });
    }

    /**
     * Returns an unused connection to the pool
     * @param connection - The connection to return
    */
    release(connection: HttpClientConnection) {
        this.free_connections.push(connection);
        this.pump();
    }

    /** Closes all connections and rejects all pending requests */
    close() {
        this.pending_requests.forEach((request) => {
            request.reject(new CrtError('HttpClientConnectionManager shutting down'));
        })
    }
}
