"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientConnectionManager = exports.HttpClientStream = exports.HttpStream = exports.HttpClientConnection = exports.HttpProxyOptions = exports.HttpProxyConnectionType = exports.HttpConnection = exports.HttpRequest = exports.HttpHeaders = exports.HttpProxyAuthenticationType = void 0;
/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 * @mergeTarget
 */
const binding_1 = __importDefault(require("./binding"));
const native_resource_1 = require("./native_resource");
const error_1 = require("./error");
const http_1 = require("../common/http");
/** @internal */
var http_2 = require("../common/http");
Object.defineProperty(exports, "HttpProxyAuthenticationType", { enumerable: true, get: function () { return http_2.HttpProxyAuthenticationType; } });
const event_1 = require("../common/event");
/**
 * @category HTTP
 */
exports.HttpHeaders = binding_1.default.HttpHeaders;
/** @internal */
const nativeHttpRequest = binding_1.default.HttpRequest;
/**
 * @category HTTP
 */
class HttpRequest extends nativeHttpRequest {
    constructor(method, path, headers, body) {
        super(method, path, headers, body === null || body === void 0 ? void 0 : body.native_handle());
    }
}
exports.HttpRequest = HttpRequest;
/**
 * Base class for HTTP connections
 *
 * @category HTTP
 */
class HttpConnection extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    constructor(native_handle) {
        super();
        this._super(native_handle);
    }
    /**
     * Close the connection.
     * Shutdown is asynchronous. This call has no effect if the connection is already
     * closing.
     */
    close() {
        binding_1.default.http_connection_close(this.native_handle());
    }
    // Overridden to allow uncorking on ready
    on(event, listener) {
        super.on(event, listener);
        if (event == 'connect') {
            process.nextTick(() => {
                this.uncork();
            });
        }
        return this;
    }
}
exports.HttpConnection = HttpConnection;
/**
 * Emitted when the connection is connected and ready to start streams
 *
 * @event
 */
HttpConnection.CONNECT = 'connect';
/**
 * Emitted when an error occurs on the connection
 *
 * @event
 */
HttpConnection.ERROR = 'error';
/**
 * Emitted when the connection has completed
 *
 * @event
 */
HttpConnection.CLOSE = 'close';
/**
 * Proxy connection types.
 *
 * The original behavior was to make a tunneling connection if TLS was used, and a forwarding connection if it was not.
 * There are legitimate use cases for plaintext tunneling connections, and so the implicit behavior has now
 * been replaced by this setting, with a default that maps to the old behavior.
 *
 * @category HTTP
 */
var HttpProxyConnectionType;
(function (HttpProxyConnectionType) {
    /**
     * (Default for backwards compatibility).  If Tls options are supplied then the connection will be a tunneling
     * one, otherwise it will be a forwarding one.
     */
    HttpProxyConnectionType[HttpProxyConnectionType["Legacy"] = 0] = "Legacy";
    /**
     * Establish a forwarding-based connection with the proxy.  Tls is not allowed in this case.
     */
    HttpProxyConnectionType[HttpProxyConnectionType["Forwarding"] = 1] = "Forwarding";
    /**
     * Establish a tunneling-based connection with the proxy.
     */
    HttpProxyConnectionType[HttpProxyConnectionType["Tunneling"] = 2] = "Tunneling";
})(HttpProxyConnectionType = exports.HttpProxyConnectionType || (exports.HttpProxyConnectionType = {}));
;
/**
 * Proxy options for HTTP clients.
 *
 * @category HTTP
 */
class HttpProxyOptions extends http_1.CommonHttpProxyOptions {
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
    constructor(host_name, port, auth_method = http_1.HttpProxyAuthenticationType.None, auth_username, auth_password, tls_opts, connection_type) {
        super(host_name, port, auth_method, auth_username, auth_password);
        this.tls_opts = tls_opts;
        this.connection_type = connection_type;
    }
    /** @internal */
    create_native_handle() {
        return binding_1.default.http_proxy_options_new(this.host_name, this.port, this.auth_method, this.auth_username, this.auth_password, this.tls_opts ? this.tls_opts.native_handle() : undefined, this.connection_type ? this.connection_type : HttpProxyConnectionType.Legacy);
    }
}
exports.HttpProxyOptions = HttpProxyOptions;
/**
 * Represents an HTTP connection from a client to a server
 *
 * @category HTTP
 */
class HttpClientConnection extends HttpConnection {
    _on_setup(native_handle, error_code) {
        if (error_code) {
            this.emit('error', new error_1.CrtError(error_code));
            return;
        }
        this.emit('connect');
    }
    _on_shutdown(native_handle, error_code) {
        if (error_code) {
            this.emit('error', new error_1.CrtError(error_code));
            return;
        }
        this.emit('close');
    }
    /** Asynchronously establish a new HttpClientConnection.
     * @param bootstrap Client bootstrap to use when initiating socket connection.  Leave undefined to use the
     *          default system-wide bootstrap (recommended).
     * @param host_name Host to connect to
     * @param port Port to connect to on host
     * @param socket_options Socket options
     * @param tls_opts Optional TLS connection options
     * @param proxy_options Optional proxy options
    */
    constructor(bootstrap, host_name, port, socket_options, tls_opts, proxy_options, handle) {
        if (socket_options == null || socket_options == undefined) {
            throw new error_1.CrtError("HttpClientConnection constructor: socket_options not defined");
        }
        super(handle
            ? handle
            : binding_1.default.http_connection_new(bootstrap != null ? bootstrap.native_handle() : null, (handle, error_code) => {
                this._on_setup(handle, error_code);
            }, (handle, error_code) => {
                this._on_shutdown(handle, error_code);
            }, host_name, port, socket_options.native_handle(), tls_opts ? tls_opts.native_handle() : undefined, proxy_options ? proxy_options.create_native_handle() : undefined));
        this.bootstrap = bootstrap;
        this.socket_options = socket_options;
        this.tls_opts = tls_opts;
    }
    /**
     * Create {@link HttpClientStream} to carry out the request/response exchange.
     *
     * NOTE: The stream sends no data until :meth:`HttpClientStream.activate()`
     * is called. Call {@link HttpStream.activate} when you're ready for
     * callbacks and events to fire.
     * @param request - The HttpRequest to attempt on this connection
     * @returns A new stream that will deliver events for the request
     */
    request(request) {
        let stream;
        const on_response_impl = (status_code, headers) => {
            stream._on_response(status_code, headers);
        };
        const on_body_impl = (data) => {
            stream._on_body(data);
        };
        const on_complete_impl = (error_code) => {
            stream._on_complete(error_code);
        };
        const native_handle = binding_1.default.http_stream_new(this.native_handle(), request, on_complete_impl, on_response_impl, on_body_impl);
        return stream = new HttpClientStream(native_handle, this, request);
    }
}
exports.HttpClientConnection = HttpClientConnection;
/**
 * Represents a single http message exchange (request/response) in HTTP/1.1. In H2, it may
 * also represent a PUSH_PROMISE followed by the accompanying response.
 *
 * NOTE: Binding either the ready or response event will uncork any buffered events and start
 * event delivery
 *
 * @category HTTP
 */
class HttpStream extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    constructor(native_handle, connection) {
        super();
        this.connection = connection;
        this._super(native_handle);
        this.cork();
    }
    /**
     * Begin sending the request.
     *
     * The stream does nothing until this is called. Call activate() when you
     * are ready for its callbacks and events to fire.
     */
    activate() {
        binding_1.default.http_stream_activate(this.native_handle());
    }
    /**
     * Closes and ends all communication on this stream. Called automatically after the 'end'
     * event is delivered. Calling this manually is only necessary if you wish to terminate
     * communication mid-request/response.
     */
    close() {
        binding_1.default.http_stream_close(this.native_handle());
    }
    /** @internal */
    _on_body(data) {
        this.emit('data', data);
    }
    /** @internal */
    _on_complete(error_code) {
        if (error_code) {
            this.emit('error', new error_1.CrtError(error_code));
            this.close();
            return;
        }
        // schedule death after end is delivered
        this.on('end', () => {
            this.close();
        });
        this.emit('end');
    }
}
exports.HttpStream = HttpStream;
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
class HttpClientStream extends HttpStream {
    constructor(native_handle, connection, request) {
        super(native_handle, connection);
        this.request = request;
    }
    /**
     * HTTP status code returned from the server.
     * @return Either the status code, or undefined if the server response has not arrived yet.
     */
    status_code() {
        return this.response_status_code;
    }
    // Overridden to allow uncorking on ready and response
    on(event, listener) {
        super.on(event, listener);
        if (event == 'response') {
            process.nextTick(() => {
                this.uncork();
            });
        }
        return this;
    }
    /** @internal */
    _on_response(status_code, header_array) {
        this.response_status_code = status_code;
        let headers = new exports.HttpHeaders(header_array);
        this.emit('response', status_code, headers);
    }
}
exports.HttpClientStream = HttpClientStream;
/**
 * Emitted when the http response headers have arrived.
 *
 * @event
 */
HttpClientStream.RESPONSE = 'response';
/**
 * Emitted when http response data is available.
 *
 * @event
 */
HttpClientStream.DATA = 'data';
/**
 * Emitted when an error occurs in stream processing
 *
 * @event
 */
HttpClientStream.ERROR = 'error';
/**
 * Emitted when the stream has completed
 *
 * @event
 */
HttpClientStream.END = 'end';
/**
 * Emitted when inline headers are delivered while communicating over H2
 *
 * @event
 */
HttpClientStream.HEADERS = 'headers';
/**
 * Creates, manages, and vends connections to a given host/port endpoint
 *
 * @category HTTP
 */
class HttpClientConnectionManager extends native_resource_1.NativeResource {
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
    constructor(bootstrap, host, port, max_connections, initial_window_size, socket_options, tls_opts, proxy_options) {
        if (socket_options == null || socket_options == undefined) {
            throw new error_1.CrtError("HttpClientConnectionManager constructor: socket_options not defined");
        }
        super(binding_1.default.http_connection_manager_new(bootstrap != null ? bootstrap.native_handle() : null, host, port, max_connections, initial_window_size, socket_options.native_handle(), tls_opts ? tls_opts.native_handle() : undefined, proxy_options ? proxy_options.create_native_handle() : undefined, undefined /* on_shutdown */));
        this.bootstrap = bootstrap;
        this.host = host;
        this.port = port;
        this.max_connections = max_connections;
        this.initial_window_size = initial_window_size;
        this.socket_options = socket_options;
        this.tls_opts = tls_opts;
        this.proxy_options = proxy_options;
        this.connections = new Map();
    }
    /**
    * Vends a connection from the pool
    * @returns A promise that results in an HttpClientConnection. When done with the connection, return
    *          it via {@link release}
    */
    acquire() {
        return new Promise((resolve, reject) => {
            // Only create 1 connection in JS/TS from each native connection
            const on_acquired = (handle, error_code) => {
                if (error_code) {
                    reject(new error_1.CrtError(error_code));
                    return;
                }
                let connection = this.connections.get(handle);
                if (!connection) {
                    connection = new HttpClientConnection(this.bootstrap, this.host, this.port, this.socket_options, this.tls_opts, this.proxy_options, handle);
                    this.connections.set(handle, connection);
                    connection.on('close', () => {
                        this.connections.delete(handle);
                    });
                }
                resolve(connection);
            };
            binding_1.default.http_connection_manager_acquire(this.native_handle(), on_acquired);
        });
    }
    /**
     * Returns an unused connection to the pool
     * @param connection - The connection to return
    */
    release(connection) {
        if (connection == null || connection == undefined) {
            throw new error_1.CrtError("HttpClientConnectionManager release: connection not defined");
        }
        binding_1.default.http_connection_manager_release(this.native_handle(), connection.native_handle());
    }
    /** Closes all connections and rejects all pending requests */
    close() {
        binding_1.default.http_connection_manager_close(this.native_handle());
    }
}
exports.HttpClientConnectionManager = HttpClientConnectionManager;
//# sourceMappingURL=http.js.map