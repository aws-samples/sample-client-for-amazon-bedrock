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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.Mqtt5Client = exports.ClientExtendedValidationAndFlowControl = exports.ClientOperationQueueBehavior = exports.HttpProxyOptions = void 0;
/**
 * Node.js specific MQTT5 client implementation
 *
 * [MQTT5 Client User Guide](https://www.github.com/awslabs/aws-crt-nodejs/blob/main/MQTT5-UserGuide.md)
 *
 * @packageDocumentation
 * @module mqtt5
 * @mergeTarget
 *
 */
const binding_1 = __importDefault(require("./binding"));
const native_resource_1 = require("./native_resource");
const event_1 = require("../common/event");
const io = __importStar(require("./io"));
const mqtt_shared = __importStar(require("../common/mqtt_shared"));
const error_1 = require("./error");
var http_1 = require("./http");
Object.defineProperty(exports, "HttpProxyOptions", { enumerable: true, get: function () { return http_1.HttpProxyOptions; } });
__exportStar(require("../common/mqtt5"), exports);
__exportStar(require("../common/mqtt5_packet"), exports);
;
/**
 * Controls how disconnects affect the queued and in-progress operations tracked by the client.  Also controls
 * how operations are handled while the client is not connected.  In particular, if the client is not connected,
 * then any operation that would be failed on disconnect (according to these rules) will be rejected.
 */
var ClientOperationQueueBehavior;
(function (ClientOperationQueueBehavior) {
    /** Same as FailQos0PublishOnDisconnect */
    ClientOperationQueueBehavior[ClientOperationQueueBehavior["Default"] = 0] = "Default";
    /**
     * Re-queues QoS 1+ publishes on disconnect; un-acked publishes go to the front while unprocessed publishes stay
     * in place.  All other operations (QoS 0 publishes, subscribe, unsubscribe) are failed.
     */
    ClientOperationQueueBehavior[ClientOperationQueueBehavior["FailNonQos1PublishOnDisconnect"] = 1] = "FailNonQos1PublishOnDisconnect";
    /**
     * QoS 0 publishes that are not complete at the time of disconnection are failed.  Un-acked QoS 1+ publishes are
     * re-queued at the head of the line for immediate retransmission on a session resumption.  All other operations
     * are requeued in original order behind any retransmissions.
     */
    ClientOperationQueueBehavior[ClientOperationQueueBehavior["FailQos0PublishOnDisconnect"] = 2] = "FailQos0PublishOnDisconnect";
    /**
     * All operations that are not complete at the time of disconnection are failed, except operations that
     * the MQTT5 spec requires to be retransmitted (un-acked QoS1+ publishes).
     */
    ClientOperationQueueBehavior[ClientOperationQueueBehavior["FailAllOnDisconnect"] = 3] = "FailAllOnDisconnect";
})(ClientOperationQueueBehavior = exports.ClientOperationQueueBehavior || (exports.ClientOperationQueueBehavior = {}));
/**
 * Additional controls for client behavior with respect to operation validation and flow control; these checks
 * go beyond the MQTT5 spec to respect limits of specific MQTT brokers.
 */
var ClientExtendedValidationAndFlowControl;
(function (ClientExtendedValidationAndFlowControl) {
    /**
     * Do not do any additional validation or flow control
     */
    ClientExtendedValidationAndFlowControl[ClientExtendedValidationAndFlowControl["None"] = 0] = "None";
    /**
     * Apply additional client-side validation and operational flow control that respects the
     * default AWS IoT Core limits.
     *
     * Currently applies the following additional validation:
     *
     * 1. No more than 8 subscriptions per SUBSCRIBE packet
     * 1. Topics and topic filters have a maximum of 7 slashes (8 segments), not counting any AWS rules prefix
     * 1. Topics must be <= 256 bytes in length
     * 1. Client id must be <= 128 bytes in length
     *
     * Also applies the following flow control:
     *
     * 1. Outbound throughput throttled to 512KB/s
     * 1. Outbound publish TPS throttled to 100
     */
    ClientExtendedValidationAndFlowControl[ClientExtendedValidationAndFlowControl["AwsIotCoreDefaults"] = 1] = "AwsIotCoreDefaults";
})(ClientExtendedValidationAndFlowControl = exports.ClientExtendedValidationAndFlowControl || (exports.ClientExtendedValidationAndFlowControl = {}));
/**
 * Node.js specific MQTT5 client implementation
 *
 * Not all parts of the MQTT5 spec are supported. We currently do not support:
 *
 * * AUTH packets and the authentication fields in the CONNECT packet
 * * QoS 2
 *
 * [MQTT5 Client User Guide](https://www.github.com/awslabs/aws-crt-nodejs/blob/main/MQTT5-UserGuide.md)
 *
 * This client is based on native resources.  When finished with the client, you must call close() to dispose of
 * them or they will leak.
 *
 */
class Mqtt5Client extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    /**
     * Client constructor
     *
     * @param config The configuration for this client
     */
    constructor(config) {
        super();
        this._super(binding_1.default.mqtt5_client_new(this, config, (client) => { Mqtt5Client._s_on_stopped(client); }, (client) => { Mqtt5Client._s_on_attempting_connect(client); }, (client, connack, settings) => { Mqtt5Client._s_on_connection_success(client, connack, settings); }, (client, errorCode, connack) => { Mqtt5Client._s_on_connection_failure(client, new error_1.CrtError(errorCode), connack); }, (client, errorCode, disconnect) => { Mqtt5Client._s_on_disconnection(client, new error_1.CrtError(errorCode), disconnect); }, (client, message) => { Mqtt5Client._s_on_message_received(client, message); }, config.clientBootstrap ? config.clientBootstrap.native_handle() : null, config.socketOptions ? config.socketOptions.native_handle() : null, config.tlsCtx ? config.tlsCtx.native_handle() : null, config.httpProxyOptions ? config.httpProxyOptions.create_native_handle() : null));
    }
    /**
     * Triggers cleanup of native resources associated with the MQTT5 client.  Once this has been invoked, callbacks
     * and events are not guaranteed to be received.
     *
     * This must be called when finished with a client; otherwise, native resources will leak.  It is not safe
     * to invoke any further operations on the client after close() has been called.
     *
     * For a running client, safe and proper shutdown can be accomplished by
     *
     * ```ts
     * const stopped = once(client, "stopped");
     * client.stop();
     * await stopped;
     * client.close();
     * ```
     *
     * This is an asynchronous operation.
     *
     * @group Node-only
     */
    close() {
        binding_1.default.mqtt5_client_close(this.native_handle());
    }
    /**
     * Notifies the MQTT5 client that you want it to maintain connectivity to the configured endpoint.
     * The client will attempt to stay connected using the properties of the reconnect-related parameters
     * in the mqtt5 client configuration.
     *
     * This is an asynchronous operation.
     */
    start() {
        binding_1.default.mqtt5_client_start(this.native_handle());
    }
    /**
     * Notifies the MQTT5 client that you want it to end connectivity to the configured endpoint, disconnecting any
     * existing connection and halting reconnection attempts.
     *
     * This is an asynchronous operation.  Once the process completes, no further events will be emitted until the client
     * has {@link start} invoked.  Invoking {@link start start()} after a {@link stop stop()} will always result in a
     * new MQTT session.
     *
     * @param disconnectPacket (optional) properties of a DISCONNECT packet to send as part of the shutdown process
     */
    stop(disconnectPacket) {
        binding_1.default.mqtt5_client_stop(this.native_handle(), disconnectPacket);
    }
    /**
     * Subscribe to one or more topic filters by queuing a SUBSCRIBE packet to be sent to the server.
     *
     * @param packet SUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the SUBACK response
     */
    subscribe(packet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                function curriedPromiseCallback(client, errorCode, suback) {
                    return Mqtt5Client._s_on_suback_callback(resolve, reject, client, errorCode, suback);
                }
                try {
                    binding_1.default.mqtt5_client_subscribe(this.native_handle(), packet, curriedPromiseCallback);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Unsubscribe from one or more topic filters by queuing an UNSUBSCRIBE packet to be sent to the server.
     *
     * @param packet UNSUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the UNSUBACK response
     */
    unsubscribe(packet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                function curriedPromiseCallback(client, errorCode, unsuback) {
                    return Mqtt5Client._s_on_unsuback_callback(resolve, reject, client, errorCode, unsuback);
                }
                try {
                    binding_1.default.mqtt5_client_unsubscribe(this.native_handle(), packet, curriedPromiseCallback);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Send a message to subscribing clients by queuing a PUBLISH packet to be sent to the server.
     *
     * @param packet PUBLISH packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the PUBACK response (QoS 1) or
     * undefined (QoS 0)
     */
    publish(packet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (packet && packet.payload) {
                    packet.payload = mqtt_shared.normalize_payload(packet.payload);
                }
                function curriedPromiseCallback(client, errorCode, result) {
                    return Mqtt5Client._s_on_puback_callback(resolve, reject, client, errorCode, result);
                }
                try {
                    binding_1.default.mqtt5_client_publish(this.native_handle(), packet, curriedPromiseCallback);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    /**
     * Queries a small set of numerical statistics about the current state of the client's operation queue
     *
     * @group Node-only
     */
    getOperationalStatistics() {
        return binding_1.default.mqtt5_client_get_queue_statistics(this.native_handle());
    }
    /**
     * Queries a small set of numerical statistics about the current state of the client's operation queue
     * @deprecated use getOperationalStatistics instead
     *
     * @group Node-only
     */
    getQueueStatistics() {
        return this.getOperationalStatistics();
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
    /*
     * Private helper functions
     *
     * Callbacks come through static functions so that the native threadsafe function objects do not
     * capture the client object itself, simplifying the number of strong references to the client floating around.
     */
    static _s_on_stopped(client) {
        process.nextTick(() => {
            let stoppedEvent = {};
            client.emit(Mqtt5Client.STOPPED, stoppedEvent);
        });
    }
    static _s_on_attempting_connect(client) {
        process.nextTick(() => {
            let attemptingConnectEvent = {};
            client.emit(Mqtt5Client.ATTEMPTING_CONNECT, attemptingConnectEvent);
        });
    }
    static _s_on_connection_success(client, connack, settings) {
        let connectionSuccessEvent = {
            connack: connack,
            settings: settings
        };
        process.nextTick(() => {
            client.emit(Mqtt5Client.CONNECTION_SUCCESS, connectionSuccessEvent);
        });
    }
    static _s_on_connection_failure(client, error, connack) {
        let connectionFailureEvent = {
            error: error
        };
        if (connack !== null && connack !== undefined) {
            connectionFailureEvent.connack = connack;
        }
        process.nextTick(() => {
            client.emit(Mqtt5Client.CONNECTION_FAILURE, connectionFailureEvent);
        });
    }
    static _s_on_disconnection(client, error, disconnect) {
        let disconnectionEvent = {
            error: error
        };
        if (disconnect !== null && disconnect !== undefined) {
            disconnectionEvent.disconnect = disconnect;
        }
        process.nextTick(() => {
            client.emit(Mqtt5Client.DISCONNECTION, disconnectionEvent);
        });
    }
    static _s_on_suback_callback(resolve, reject, client, errorCode, suback) {
        if (errorCode == 0 && suback !== undefined) {
            resolve(suback);
        }
        else {
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_unsuback_callback(resolve, reject, client, errorCode, unsuback) {
        if (errorCode == 0 && unsuback !== undefined) {
            resolve(unsuback);
        }
        else {
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_puback_callback(resolve, reject, client, errorCode, result) {
        if (errorCode == 0) {
            resolve(result);
        }
        else {
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_message_received(client, message) {
        let messageReceivedEvent = {
            message: message
        };
        process.nextTick(() => {
            client.emit(Mqtt5Client.MESSAGE_RECEIVED, messageReceivedEvent);
        });
    }
}
exports.Mqtt5Client = Mqtt5Client;
/**
 * Event emitted when the client encounters a serious error condition, such as invalid input, napi failures, and
 * other potentially unrecoverable situations.
 *
 * Listener type: {@link ErrorEventListener}
 *
 * @event
 */
Mqtt5Client.ERROR = 'error';
/**
 * Event emitted when an MQTT PUBLISH packet is received by the client.
 *
 * Listener type: {@link MessageReceivedEventListener}
 *
 * @event
 */
Mqtt5Client.MESSAGE_RECEIVED = 'messageReceived';
/**
 * Event emitted when the client begins a connection attempt.
 *
 * Listener type: {@link AttemptingConnectEventListener}
 *
 * @event
 */
Mqtt5Client.ATTEMPTING_CONNECT = 'attemptingConnect';
/**
 * Event emitted when the client successfully establishes an MQTT connection.  Only emitted after
 * an {@link ATTEMPTING_CONNECT attemptingConnect} event.
 *
 * Listener type: {@link ConnectionSuccessEventListener}
 *
 * @event
 */
Mqtt5Client.CONNECTION_SUCCESS = 'connectionSuccess';
/**
 * Event emitted when the client fails to establish an MQTT connection.  Only emitted after
 * an {@link ATTEMPTING_CONNECT attemptingConnect} event.
 *
 * Listener type: {@link ConnectionFailureEventListener}
 *
 * @event
 */
Mqtt5Client.CONNECTION_FAILURE = 'connectionFailure';
/**
 * Event emitted when the client's current connection is closed for any reason.  Only emitted after
 * a {@link CONNECTION_SUCCESS connectionSuccess} event.
 *
 * Listener type: {@link DisconnectionEventListener}
 *
 * @event
 */
Mqtt5Client.DISCONNECTION = 'disconnection';
/**
 * Event emitted when the client finishes shutdown as a result of the user invoking {@link stop}.
 *
 * Listener type: {@link StoppedEventListener}
 *
 * @event
 */
Mqtt5Client.STOPPED = 'stopped';
//# sourceMappingURL=mqtt5.js.map