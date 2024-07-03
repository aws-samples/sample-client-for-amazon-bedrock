"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttClientConnection = exports.MqttClient = exports.MqttWill = exports.QoS = exports.HttpProxyOptions = void 0;
/**
 *
 * A module containing support for mqtt connection establishment and operations.
 *
 * @packageDocumentation
 * @module mqtt
 * @mergeTarget
 */
const binding_1 = __importDefault(require("./binding"));
const native_resource_1 = require("./native_resource");
const event_1 = require("../common/event");
const crt = __importStar(require("../common/mqtt_shared"));
const error_1 = require("./error");
const io = __importStar(require("./io"));
var http_1 = require("./http");
Object.defineProperty(exports, "HttpProxyOptions", { enumerable: true, get: function () { return http_1.HttpProxyOptions; } });
const mqtt_1 = require("../common/mqtt");
var mqtt_2 = require("../common/mqtt");
Object.defineProperty(exports, "QoS", { enumerable: true, get: function () { return mqtt_2.QoS; } });
Object.defineProperty(exports, "MqttWill", { enumerable: true, get: function () { return mqtt_2.MqttWill; } });
/**
 * MQTT client
 *
 * @category MQTT
 */
class MqttClient extends native_resource_1.NativeResource {
    /**
     * @param bootstrap The {@link io.ClientBootstrap} to use for socket connections.  Leave undefined to use the
     *          default system-wide bootstrap (recommended).
     */
    constructor(bootstrap = undefined) {
        super(binding_1.default.mqtt_client_new(bootstrap != null ? bootstrap.native_handle() : null));
        this.bootstrap = bootstrap;
    }
    /**
     * Creates a new {@link MqttClientConnection}
     * @param config Configuration for the mqtt connection
     * @returns A new connection
     */
    new_connection(config) {
        return new MqttClientConnection(this, config);
    }
}
exports.MqttClient = MqttClient;
;
/**
 * MQTT client connection
 *
 * @category MQTT
 */
class MqttClientConnection extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    /**
     * @param client The client that owns this connection
     * @param config The configuration for this connection
     */
    constructor(client, config) {
        super();
        this.client = client;
        this.config = config;
        if (config == null || config == undefined) {
            throw new error_1.CrtError("MqttClientConnection constructor: config not defined");
        }
        // If there is a will, ensure that its payload is normalized to a DataView
        const will = config.will ?
            {
                topic: config.will.topic,
                qos: config.will.qos,
                payload: crt.normalize_payload(config.will.payload),
                retain: config.will.retain
            }
            : undefined;
        /** clamp reconnection time out values */
        var min_sec = mqtt_1.DEFAULT_RECONNECT_MIN_SEC;
        var max_sec = mqtt_1.DEFAULT_RECONNECT_MAX_SEC;
        if (config.reconnect_min_sec) {
            min_sec = config.reconnect_min_sec;
            // clamp max, in case they only passed in min
            max_sec = Math.max(min_sec, max_sec);
        }
        if (config.reconnect_max_sec) {
            max_sec = config.reconnect_max_sec;
            // clamp min, in case they only passed in max (or passed in min > max)
            min_sec = Math.min(min_sec, max_sec);
        }
        if (client == undefined || client == null) {
            throw new error_1.CrtError("MqttClientConnection constructor: client not defined");
        }
        if (config.socket_options == undefined || config.socket_options == null) {
            throw new error_1.CrtError("MqttClientConnection constructor: socket_options in configuration not defined");
        }
        this._super(binding_1.default.mqtt_client_connection_new(client.native_handle(), (error_code) => { this._on_connection_interrupted(error_code); }, (return_code, session_present) => { this._on_connection_resumed(return_code, session_present); }, (return_code, session_present) => { this._on_connection_success(return_code, session_present); }, (error_code) => { this._on_connection_failure(error_code); }, config.tls_ctx ? config.tls_ctx.native_handle() : null, will, config.username, config.password, config.use_websocket, config.proxy_options ? config.proxy_options.create_native_handle() : undefined, config.websocket_handshake_transform, min_sec, max_sec));
        this.tls_ctx = config.tls_ctx;
        binding_1.default.mqtt_client_connection_on_message(this.native_handle(), this._on_any_publish.bind(this));
        binding_1.default.mqtt_client_connection_on_closed(this.native_handle(), this._on_connection_closed.bind(this));
        /*
         * Failed mqtt operations (which is normal) emit error events as well as rejecting the original promise.
         * By installing a default error handler here we help prevent common issues where operation failures bring
         * the whole program to an end because a handler wasn't installed.  Programs that install their own handler
         * will be unaffected.
         */
        this.on('error', (error) => { });
    }
    close() {
        binding_1.default.mqtt_client_connection_close(this.native_handle());
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
    /**
     * Open the actual connection to the server (async).
     * @returns A Promise which completes whether the connection succeeds or fails.
     *          If connection fails, the Promise will reject with an exception.
     *          If connection succeeds, the Promise will return a boolean that is
     *          true for resuming an existing session, or false if the session is new
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                if (this.config.socket_options == null || this.config.socket_options == undefined) {
                    throw new error_1.CrtError("MqttClientConnection connect: socket_options in configuration not defined");
                }
                try {
                    binding_1.default.mqtt_client_connection_connect(this.native_handle(), this.config.client_id, this.config.host_name, this.config.port, this.config.socket_options.native_handle(), this.config.keep_alive, this.config.ping_timeout, this.config.protocol_operation_timeout, this.config.clean_session, this._on_connect_callback.bind(this, resolve, reject));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * The connection will automatically reconnect when disconnected, removing the need for this function.
     * To cease automatic reconnection attempts, call {@link disconnect}.
     * @deprecated
     */
    reconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                try {
                    binding_1.default.mqtt_client_connection_reconnect(this.native_handle(), this._on_connect_callback.bind(this, resolve, reject));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Publish message (async).
     * If the device is offline, the PUBLISH packet will be sent once the connection resumes.
     *
     * @param topic Topic name
     * @param payload Contents of message
     * @param qos Quality of Service for delivering this message
     * @param retain If true, the server will store the message and its QoS so that it can be
     *               delivered to future subscribers whose subscriptions match the topic name
     * @returns Promise which returns a {@link MqttRequest} which will contain the packet id of
     *          the PUBLISH packet.
     *
     * * For QoS 0, completes as soon as the packet is sent.
     * * For QoS 1, completes when PUBACK is received.
     * * For QoS 2, completes when PUBCOMP is received.
     */
    publish(topic, payload, qos, retain = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // Skip payload since it can be several different types
            if (typeof (topic) !== 'string') {
                return Promise.reject("topic is not a string");
            }
            if (typeof (qos) !== 'number') {
                return Promise.reject("qos is not a number");
            }
            if (typeof (retain) !== 'boolean') {
                return Promise.reject("retain is not a boolean");
            }
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                try {
                    binding_1.default.mqtt_client_connection_publish(this.native_handle(), topic, crt.normalize_payload(payload), qos, retain, this._on_puback_callback.bind(this, resolve, reject));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Subscribe to a topic filter (async).
     * The client sends a SUBSCRIBE packet and the server responds with a SUBACK.
     *
     * subscribe() may be called while the device is offline, though the async
     * operation cannot complete successfully until the connection resumes.
     *
     * Once subscribed, `callback` is invoked each time a message matching
     * the `topic` is received. It is possible for such messages to arrive before
     * the SUBACK is received.
     *
     * @param topic Subscribe to this topic filter, which may include wildcards
     * @param qos Maximum requested QoS that server may use when sending messages to the client.
     *            The server may grant a lower QoS in the SUBACK
     * @param on_message Optional callback invoked when message received.
     * @returns Promise which returns a {@link MqttSubscribeRequest} which will contain the
     *          result of the SUBSCRIBE. The Promise resolves when a SUBACK is returned
     *          from the server or is rejected when an exception occurs.
     */
    subscribe(topic, qos, on_message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (topic) !== 'string') {
                return Promise.reject("topic is not a string");
            }
            if (typeof (qos) !== 'number') {
                return Promise.reject("qos is not a number");
            }
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                try {
                    binding_1.default.mqtt_client_connection_subscribe(this.native_handle(), topic, qos, on_message, this._on_suback_callback.bind(this, resolve, reject));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Unsubscribe from a topic filter (async).
     * The client sends an UNSUBSCRIBE packet, and the server responds with an UNSUBACK.
     * @param topic The topic filter to unsubscribe from. May contain wildcards.
     * @returns Promise wihch returns a {@link MqttRequest} which will contain the packet id
     *          of the UNSUBSCRIBE packet being acknowledged. Promise is resolved when an
     *          UNSUBACK is received from the server or is rejected when an exception occurs.
     */
    unsubscribe(topic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (topic) !== 'string') {
                return Promise.reject("topic is not a string");
            }
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                try {
                    binding_1.default.mqtt_client_connection_unsubscribe(this.native_handle(), topic, this._on_unsuback_callback.bind(this, resolve, reject));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Close the connection (async).
     *
     * Will free all native resources, rendering the connection unusable after the disconnect() call.
     *
     * @returns Promise which completes when the connection is closed.
    */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                reject = this._reject(reject);
                try {
                    binding_1.default.mqtt_client_connection_disconnect(this.native_handle(), this._on_disconnect_callback.bind(this, resolve));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Queries a small set of numerical statistics about the current state of the connection's operation queue
     *
     * @group Node-only
     */
    getOperationalStatistics() {
        return binding_1.default.mqtt_client_connection_get_queue_statistics(this.native_handle());
    }
    /**
     * Queries a small set of numerical statistics about the current state of the connection's operation queue
     * @deprecated use getOperationalStatistics instead
     *
     * @group Node-only
     */
    getQueueStatistics() {
        return this.getOperationalStatistics();
    }
    // Wrap a promise rejection with a function that will also emit the error as an event
    _reject(reject) {
        return (reason) => {
            reject(reason);
            process.nextTick(() => {
                this.emit('error', new error_1.CrtError(reason));
            });
        };
    }
    _on_connection_failure(error_code) {
        let failureCallbackData = { error: new error_1.CrtError(error_code) };
        this.emit('connection_failure', failureCallbackData);
    }
    _on_connection_success(return_code, session_present) {
        let successCallbackData = { session_present: session_present, reason_code: return_code };
        this.emit('connection_success', successCallbackData);
    }
    _on_connection_interrupted(error_code) {
        this.emit('interrupt', new error_1.CrtError(error_code));
    }
    _on_connection_resumed(return_code, session_present) {
        this.emit('resume', return_code, session_present);
    }
    _on_any_publish(topic, payload, dup, qos, retain) {
        this.emit('message', topic, payload, dup, qos, retain);
    }
    _on_connection_closed() {
        let closedCallbackData = {};
        this.emit('closed', closedCallbackData);
        /**
         * We call close() here instead of on disconnect because on_close is always called AFTER disconnect
         * but if we call close() before, then we cannot emit the closed callback.
         */
        this.close();
    }
    _on_connect_callback(resolve, reject, error_code, return_code, session_present) {
        if (error_code == 0 && return_code == 0) {
            resolve(session_present);
            this.emit('connect', session_present);
        }
        else if (error_code != 0) {
            reject("Failed to connect: " + io.error_code_to_string(error_code));
        }
        else {
            reject("Server rejected connection.");
        }
    }
    _on_puback_callback(resolve, reject, packet_id, error_code) {
        if (error_code == 0) {
            resolve({ packet_id });
        }
        else {
            reject("Failed to publish: " + io.error_code_to_string(error_code));
        }
    }
    _on_suback_callback(resolve, reject, packet_id, topic, qos, error_code) {
        if (error_code == 0) {
            resolve({ packet_id, topic, qos, error_code });
        }
        else {
            reject("Failed to subscribe: " + io.error_code_to_string(error_code));
        }
    }
    _on_unsuback_callback(resolve, reject, packet_id, error_code) {
        if (error_code == 0) {
            resolve({ packet_id });
        }
        else {
            reject("Failed to unsubscribe: " + io.error_code_to_string(error_code));
        }
    }
    _on_disconnect_callback(resolve) {
        resolve();
        this.emit('disconnect');
        /** NOTE: We are NOT calling close() here but instead calling it at
         * on_closed because it is always called after disconnect */
    }
}
exports.MqttClientConnection = MqttClientConnection;
/**
 * Emitted when the connection successfully establishes itself for the first time
 *
 * @event
 */
MqttClientConnection.CONNECT = 'connect';
/**
 * Emitted when connection has disconnected successfully.
 *
 * @event
 */
MqttClientConnection.DISCONNECT = 'disconnect';
/**
 * Emitted when an error occurs.  The error will contain the error
 * code and message.
 *
 * @event
 */
MqttClientConnection.ERROR = 'error';
/**
 * Emitted when the connection is dropped unexpectedly. The error will contain the error
 * code and message.  The underlying mqtt implementation will attempt to reconnect.
 *
 * @event
 */
MqttClientConnection.INTERRUPT = 'interrupt';
/**
 * Emitted when the connection reconnects (after an interrupt). Only triggers on connections after the initial one.
 *
 * @event
 */
MqttClientConnection.RESUME = 'resume';
/**
 * Emitted when any MQTT publish message arrives.
 *
 * @event
 */
MqttClientConnection.MESSAGE = 'message';
/**
 * Emitted on every successful connect and reconnect.
 * Will contain a number with the connection reason code and
 * a boolean indicating whether the connection resumed a session.
 *
 * @event
 */
MqttClientConnection.CONNECTION_SUCCESS = 'connection_success';
/**
 * Emitted on an unsuccessful connect and reconnect.
 * Will contain an error code indicating the reason for the unsuccessful connection.
 *
 * @event
 */
MqttClientConnection.CONNECTION_FAILURE = 'connection_failure';
/**
 * Emitted when the MQTT connection was disconnected and shutdown successfully.
 *
 * @event
 */
MqttClientConnection.CLOSED = 'closed';
//# sourceMappingURL=mqtt.js.map