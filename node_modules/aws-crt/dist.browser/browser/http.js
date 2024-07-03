"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientConnectionManager = exports.HttpClientStream = exports.HttpClientConnection = exports.HttpRequest = exports.HttpProxyOptions = exports.HttpHeaders = exports.HttpProxyAuthenticationType = void 0;
/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 * @mergeTarget
 */
var http_1 = require("../common/http");
var http_2 = require("../common/http");
Object.defineProperty(exports, "HttpProxyAuthenticationType", { enumerable: true, get: function () { return http_2.HttpProxyAuthenticationType; } });
var event_1 = require("../common/event");
var error_1 = require("./error");
var axios = __importStar(require("axios"));
var io_1 = require("./io");
var util_utf8_browser_1 = require("@aws-sdk/util-utf8-browser");
/**
 * A collection of HTTP headers
 *
 * @category HTTP
 */
var HttpHeaders = /** @class */ (function () {
    /** Construct from a collection of [name, value] pairs
     *
     * @param headers list of HttpHeader values to seat in this object
     */
    function HttpHeaders(headers) {
        var e_1, _a;
        if (headers === void 0) { headers = []; }
        // Map from "header": [["HeAdEr", "value1"], ["HEADER", "value2"], ["header", "value3"]]
        this.headers = {};
        try {
            for (var headers_1 = __values(headers), headers_1_1 = headers_1.next(); !headers_1_1.done; headers_1_1 = headers_1.next()) {
                var header = headers_1_1.value;
                this.add(header[0], header[1]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (headers_1_1 && !headers_1_1.done && (_a = headers_1.return)) _a.call(headers_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    Object.defineProperty(HttpHeaders.prototype, "length", {
        /**
         * Fetches the total length of all headers
         *
         * @returns the total length of all headers
         */
        get: function () {
            var length = 0;
            for (var key in this.headers) {
                length += this.headers[key].length;
            }
            return length;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Add a name/value pair
     * @param name The header name
     * @param value The header value
    */
    HttpHeaders.prototype.add = function (name, value) {
        var values = this.headers[name.toLowerCase()];
        if (values) {
            values.push([name, value]);
        }
        else {
            this.headers[name.toLowerCase()] = [[name, value]];
        }
    };
    /**
     * Set a name/value pair, replacing any existing values for the name
     * @param name - The header name
     * @param value - The header value
    */
    HttpHeaders.prototype.set = function (name, value) {
        this.headers[name.toLowerCase()] = [[name, value]];
    };
    /**
     * Get the list of values for the given name
     * @param name - The header name to look for
     * @return List of values, or empty list if none exist
     */
    HttpHeaders.prototype.get_values = function (name) {
        var e_2, _a;
        var values = [];
        var values_list = this.headers[name.toLowerCase()] || [];
        try {
            for (var values_list_1 = __values(values_list), values_list_1_1 = values_list_1.next(); !values_list_1_1.done; values_list_1_1 = values_list_1.next()) {
                var entry = values_list_1_1.value;
                values.push(entry[1]);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (values_list_1_1 && !values_list_1_1.done && (_a = values_list_1.return)) _a.call(values_list_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return values;
    };
    /**
     * Gets the first value for the given name, ignoring any additional values
     * @param name - The header name to look for
     * @param default_value - Value returned if no values are found for the given name
     * @return The first header value, or default if no values exist
     */
    HttpHeaders.prototype.get = function (name, default_value) {
        if (default_value === void 0) { default_value = ""; }
        var values = this.headers[name.toLowerCase()];
        if (!values) {
            return default_value;
        }
        return values[0][1] || default_value;
    };
    /**
     * Removes all values for the given name
     * @param name - The header to remove all values for
     */
    HttpHeaders.prototype.remove = function (name) {
        delete this.headers[name.toLowerCase()];
    };
    /**
     * Removes a specific name/value pair
     * @param name - The header name to remove
     * @param value - The header value to remove
     */
    HttpHeaders.prototype.remove_value = function (name, value) {
        var key = name.toLowerCase();
        var values = this.headers[key];
        for (var idx = 0; idx < values.length; ++idx) {
            var entry = values[idx];
            if (entry[1] === value) {
                if (values.length === 1) {
                    delete this.headers[key];
                }
                else {
                    delete values[idx];
                }
                return;
            }
        }
    };
    /** Clears the entire header set */
    HttpHeaders.prototype.clear = function () {
        this.headers = {};
    };
    /**
     * Iterator. Allows for:
     * let headers = new HttpHeaders();
     * ...
     * for (const header of headers) { }
    */
    HttpHeaders.prototype[Symbol.iterator] = function () {
        var _a, _b, _c, _i, key, values, values_1, values_1_1, entry, e_3_1;
        var e_3, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _a = this.headers;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _e.label = 1;
                case 1:
                    if (!(_i < _b.length)) return [3 /*break*/, 10];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 9];
                    key = _c;
                    values = this.headers[key];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 7, 8, 9]);
                    values_1 = (e_3 = void 0, __values(values)), values_1_1 = values_1.next();
                    _e.label = 3;
                case 3:
                    if (!!values_1_1.done) return [3 /*break*/, 6];
                    entry = values_1_1.value;
                    return [4 /*yield*/, entry];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    values_1_1 = values_1.next();
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 9];
                case 7:
                    e_3_1 = _e.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 9];
                case 8:
                    try {
                        if (values_1_1 && !values_1_1.done && (_d = values_1.return)) _d.call(values_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                    return [7 /*endfinally*/];
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/];
            }
        });
    };
    /** @internal */
    HttpHeaders.prototype._flatten = function () {
        var e_4, _a;
        var flattened = [];
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var pair = _c.value;
                flattened.push(pair);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return flattened;
    };
    return HttpHeaders;
}());
exports.HttpHeaders = HttpHeaders;
/**
 * Options used when connecting to an HTTP endpoint via a proxy
 *
 * @category HTTP
 */
var HttpProxyOptions = /** @class */ (function (_super) {
    __extends(HttpProxyOptions, _super);
    function HttpProxyOptions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return HttpProxyOptions;
}(http_1.CommonHttpProxyOptions));
exports.HttpProxyOptions = HttpProxyOptions;
/**
 * Represents a request to a web server from a client
 *
 * @category HTTP
 */
var HttpRequest = /** @class */ (function () {
    /**
     * Constructor for the HttpRequest class
     *
     * @param method The verb to use for the request (i.e. GET, POST, PUT, DELETE, HEAD)
     * @param path The URI of the request
     * @param headers Additional custom headers to send to the server
     * @param body The request body, in the case of a POST or PUT request
     */
    function HttpRequest(method, path, headers, body) {
        if (headers === void 0) { headers = new HttpHeaders(); }
        this.method = method;
        this.path = path;
        this.headers = headers;
        this.body = body;
    }
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
/**
 * Represents an HTTP connection from a client to a server
 *
 * @category HTTP
 */
var HttpClientConnection = /** @class */ (function (_super) {
    __extends(HttpClientConnection, _super);
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
    function HttpClientConnection(bootstrap, host_name, port, socketOptions, tlsOptions, proxyOptions) {
        var _this = _super.call(this) || this;
        _this.cork();
        _this.bootstrap = bootstrap;
        _this.socket_options = socketOptions;
        _this.tls_options = tlsOptions;
        _this.proxy_options = proxyOptions;
        var scheme = (_this.tls_options || port === 443) ? 'https' : 'http';
        _this.axios_options = {
            baseURL: "".concat(scheme, "://").concat(host_name, ":").concat(port, "/")
        };
        if (_this.proxy_options) {
            _this.axios_options.proxy = {
                host: _this.proxy_options.host_name,
                port: _this.proxy_options.port,
            };
            if (_this.proxy_options.auth_method == http_1.HttpProxyAuthenticationType.Basic) {
                _this.axios_options.proxy.auth = {
                    username: _this.proxy_options.auth_username || "",
                    password: _this.proxy_options.auth_password || "",
                };
            }
        }
        _this._axios = axios.default.create(_this.axios_options);
        setTimeout(function () {
            _this.emit('connect');
        }, 0);
        return _this;
    }
    // Override to allow uncorking on ready
    HttpClientConnection.prototype.on = function (event, listener) {
        var _this = this;
        _super.prototype.on.call(this, event, listener);
        if (event == 'connect') {
            setTimeout(function () {
                _this.uncork();
            }, 0);
        }
        return this;
    };
    /**
     * Make a client initiated request to this connection.
     * @param request - The HttpRequest to attempt on this connection
     * @returns A new stream that will deliver events for the request
     */
    HttpClientConnection.prototype.request = function (request) {
        return stream_request(this, request);
    };
    /**
     * Ends the connection
     */
    HttpClientConnection.prototype.close = function () {
        this.emit('close');
        this._axios = undefined;
    };
    /**
     * Emitted when the connection is connected and ready to start streams
     *
     * @event
     */
    HttpClientConnection.CONNECT = 'connect';
    /**
     * Emitted when an error occurs on the connection
     *
     * @event
     */
    HttpClientConnection.ERROR = 'error';
    /**
     * Emitted when the connection has completed
     *
     * @event
     */
    HttpClientConnection.CLOSE = 'close';
    return HttpClientConnection;
}(event_1.BufferedEventEmitter));
exports.HttpClientConnection = HttpClientConnection;
function stream_request(connection, request) {
    if (request == null || request == undefined) {
        throw new error_1.CrtError("HttpClientConnection stream_request: request not defined");
    }
    var _to_object = function (headers) {
        var e_5, _a;
        // browsers refuse to let users configure host or user-agent
        var forbidden_headers = ['host', 'user-agent'];
        var obj = {};
        try {
            for (var headers_2 = __values(headers), headers_2_1 = headers_2.next(); !headers_2_1.done; headers_2_1 = headers_2.next()) {
                var header = headers_2_1.value;
                if (forbidden_headers.indexOf(header[0].toLowerCase()) != -1) {
                    continue;
                }
                obj[header[0]] = headers.get(header[0]);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (headers_2_1 && !headers_2_1.done && (_a = headers_2.return)) _a.call(headers_2);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return obj;
    };
    var body = (request.body) ? request.body.data : undefined;
    var stream = HttpClientStream._create(connection);
    stream.connection._axios.request({
        url: request.path,
        method: request.method.toLowerCase(),
        headers: _to_object(request.headers),
        body: body
    }).then(function (response) {
        stream._on_response(response);
    }).catch(function (error) {
        stream._on_error(error);
    });
    return stream;
}
/**
 * Represents a single http message exchange (request/response) in HTTP.
 *
 * NOTE: Binding either the ready or response event will uncork any buffered events and start
 * event delivery
 *
 * @category HTTP
 */
var HttpClientStream = /** @class */ (function (_super) {
    __extends(HttpClientStream, _super);
    function HttpClientStream(connection) {
        var _this = _super.call(this) || this;
        _this.connection = connection;
        _this.cork();
        return _this;
    }
    /**
     * HTTP status code returned from the server.
     * @return Either the status code, or undefined if the server response has not arrived yet.
     */
    HttpClientStream.prototype.status_code = function () {
        return this.response_status_code;
    };
    /**
     * Begin sending the request.
     *
     * The stream does nothing until this is called. Call activate() when you
     * are ready for its callbacks and events to fire.
     */
    HttpClientStream.prototype.activate = function () {
        var _this = this;
        setTimeout(function () {
            _this.uncork();
        }, 0);
    };
    HttpClientStream.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    // Private helpers for stream_request()
    /** @internal */
    HttpClientStream._create = function (connection) {
        return new HttpClientStream(connection);
    };
    // Convert axios' single response into a series of events
    /** @internal */
    HttpClientStream.prototype._on_response = function (response) {
        this.response_status_code = response.status;
        var headers = new HttpHeaders();
        for (var header in response.headers) {
            headers.add(header, response.headers[header]);
        }
        this.emit('response', this.response_status_code, headers);
        var data = response.data;
        if (data && !(data instanceof ArrayBuffer)) {
            data = (0, util_utf8_browser_1.fromUtf8)(data.toString());
        }
        this.emit('data', data);
        this.emit('end');
    };
    // Gather as much information as possible from the axios error
    // and pass it on to the user
    /** @internal */
    HttpClientStream.prototype._on_error = function (error) {
        var info = "";
        if (error.response) {
            this.response_status_code = error.response.status;
            info += "status_code=".concat(error.response.status);
            if (error.response.headers) {
                info += " headers=".concat(JSON.stringify(error.response.headers));
            }
            if (error.response.data) {
                info += " data=".concat(error.response.data);
            }
        }
        else {
            info = "No response from server";
        }
        this.connection.close();
        this.emit('error', new Error("msg=".concat(error.message, ", connection=").concat(JSON.stringify(this.connection), ", info=").concat(info)));
    };
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
    return HttpClientStream;
}(event_1.BufferedEventEmitter));
exports.HttpClientStream = HttpClientStream;
/**
 * Creates, manages, and vends connections to a given host/port endpoint
 *
 * @category HTTP
 */
var HttpClientConnectionManager = /** @class */ (function () {
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
    function HttpClientConnectionManager(bootstrap, host, port, max_connections, initial_window_size, socket_options, tls_opts, proxy_options) {
        this.bootstrap = bootstrap;
        this.host = host;
        this.port = port;
        this.max_connections = max_connections;
        this.initial_window_size = initial_window_size;
        this.socket_options = socket_options;
        this.tls_opts = tls_opts;
        this.proxy_options = proxy_options;
        this.pending_connections = new Set();
        this.live_connections = new Set();
        this.free_connections = [];
        this.pending_requests = [];
    }
    HttpClientConnectionManager.prototype.remove = function (connection) {
        this.pending_connections.delete(connection);
        this.live_connections.delete(connection);
        var free_idx = this.free_connections.indexOf(connection);
        if (free_idx != -1) {
            this.free_connections.splice(free_idx, 1);
        }
    };
    HttpClientConnectionManager.prototype.resolve = function (connection) {
        var request = this.pending_requests.shift();
        if (request) {
            request.resolve(connection);
        }
        else {
            this.free_connections.push(connection);
        }
    };
    HttpClientConnectionManager.prototype.reject = function (error) {
        var request = this.pending_requests.shift();
        if (request) {
            request.reject(error);
        }
    };
    HttpClientConnectionManager.prototype.pump = function () {
        var _this = this;
        if (this.pending_requests.length == 0) {
            return;
        }
        // Try to service the request with a free connection
        {
            var connection_1 = this.free_connections.pop();
            if (connection_1) {
                return this.resolve(connection_1);
            }
        }
        // If there's no more room, nothing can be resolved right now
        if ((this.live_connections.size + this.pending_connections.size) == this.max_connections) {
            return;
        }
        // There's room, create a new connection
        var connection = new HttpClientConnection(new io_1.ClientBootstrap(), this.host, this.port, this.socket_options, this.tls_opts, this.proxy_options);
        this.pending_connections.add(connection);
        var on_connect = function () {
            _this.pending_connections.delete(connection);
            _this.live_connections.add(connection);
            _this.free_connections.push(connection);
            _this.resolve(connection);
        };
        var on_error = function (error) {
            if (_this.pending_connections.has(connection)) {
                // Connection never connected, error it out
                return _this.reject(new error_1.CrtError(error));
            }
            // If the connection errors after use, get it out of rotation and replace it
            _this.remove(connection);
            _this.pump();
        };
        var on_close = function () {
            _this.remove(connection);
            _this.pump();
        };
        connection.on('connect', on_connect);
        connection.on('error', on_error);
        connection.on('close', on_close);
    };
    /**
     * Vends a connection from the pool
     * @returns A promise that results in an HttpClientConnection. When done with the connection, return
     *          it via {@link release}
     */
    HttpClientConnectionManager.prototype.acquire = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.pending_requests.push({
                resolve: resolve,
                reject: reject
            });
            _this.pump();
        });
    };
    /**
     * Returns an unused connection to the pool
     * @param connection - The connection to return
    */
    HttpClientConnectionManager.prototype.release = function (connection) {
        this.free_connections.push(connection);
        this.pump();
    };
    /** Closes all connections and rejects all pending requests */
    HttpClientConnectionManager.prototype.close = function () {
        this.pending_requests.forEach(function (request) {
            request.reject(new error_1.CrtError('HttpClientConnectionManager shutting down'));
        });
    };
    return HttpClientConnectionManager;
}());
exports.HttpClientConnectionManager = HttpClientConnectionManager;
//# sourceMappingURL=http.js.map