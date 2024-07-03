/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing support for mqtt connection establishment and operations.
 *
 * @packageDocumentation
 * @module mqtt
 * @mergeTarget
 */

import * as mqtt from "mqtt";
import * as WebsocketUtils from "./ws";
import * as auth from "./auth";
import { Trie, TrieOp, Node as TrieNode } from "./trie";

import { BufferedEventEmitter } from "../common/event";
import { CrtError } from "../browser";
import { ClientBootstrap, SocketOptions } from "./io";
import {
    QoS,
    Payload,
    MqttRequest,
    MqttSubscribeRequest,
    MqttWill,
    OnMessageCallback,
    MqttConnectionConnected,
    MqttConnectionDisconnected,
    MqttConnectionResumed,
    DEFAULT_RECONNECT_MIN_SEC,
    DEFAULT_RECONNECT_MAX_SEC,
    OnConnectionSuccessResult,
    OnConnectionFailedResult,
    OnConnectionClosedResult
} from "../common/mqtt";
import { normalize_payload } from "../common/mqtt_shared";

export {
    QoS, Payload, MqttRequest, MqttSubscribeRequest, MqttWill, OnMessageCallback, MqttConnectionConnected, MqttConnectionDisconnected,
    MqttConnectionResumed, OnConnectionSuccessResult, OnConnectionFailedResult, OnConnectionClosedResult
} from "../common/mqtt";

/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when an error occurs
 *
 * @param error the error that occurred
 *
 * @category MQTT
 */
export type MqttConnectionError = (error: CrtError) => void;

/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has been
 * interrupted unexpectedly.
 *
 * @param error description of the error that occurred
 *
 * @category MQTT
 */
export type MqttConnectionInterrupted = (error: CrtError) => void;

/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has been
 * connected successfully.
 *
 * This listener is invoked for every successful connect and every successful reconnect.
 *
 * @param callback_data Data returned containing information about the successful connection.
 *
 * @category MQTT
 */
export type MqttConnectionSuccess = (callback_data: OnConnectionSuccessResult) => void;

/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has failed
 * to connect.
 *
 * This listener is invoked for every failed connect and every failed reconnect.
 *
 * @param callback_data Data returned containing information about the failed connection.
 *
 * @category MQTT
 */
export type MqttConnectionFailure = (callback_data: OnConnectionFailedResult) => void;

/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has been
 * disconnected and shutdown successfully.
 *
 * @param callback_data Data returned containing information about the closed/disconnected connection.
 *                      Currently empty, but may contain data in the future.
 *
 * @category MQTT
 */
export type MqttConnectionClosed = (callback_data: OnConnectionClosedResult) => void;

/**
 * @category MQTT
 */
export type WebsocketOptions = WebsocketUtils.WebsocketOptions;

/**
 * @category MQTT
 */
export type AWSCredentials = auth.AWSCredentials;

/**
 * Configuration options for an MQTT connection
 *
 * @category MQTT
 */
export interface MqttConnectionConfig {
    /**
    * ID to place in CONNECT packet. Must be unique across all devices/clients.
    * If an ID is already in use, the other client will be disconnected.
    */
    client_id: string;

    /** Server name to connect to */
    host_name: string;

    /** Server port to connect to */
    port: number;

    /** Socket options, ignored in browser */
    socket_options: SocketOptions;

    /**
     * Whether or not to start a clean session with each reconnect.
     * If True, the server will forget all subscriptions with each reconnect.
     * Set False to request that the server resume an existing session
     * or start a new session that may be resumed after a connection loss.
     * The `session_present` bool in the connection callback informs
     * whether an existing session was successfully resumed.
     * If an existing session is resumed, the server remembers previous subscriptions
     * and sends messages (with QoS1 or higher) that were published while the client was offline.
     */
    clean_session?: boolean;

    /**
     * The keep alive value, in seconds, to send in CONNECT packet.
     * A PING will automatically be sent at this interval.
     * The server will assume the connection is lost if no PING is received after 1.5X this value.
     * This duration must be longer than {@link ping_timeout}.
     */
    keep_alive?: number;

    /**
     * Milliseconds to wait for ping response before client assumes
     * the connection is invalid and attempts to reconnect.
     * This duration must be shorter than keep_alive_secs.
     * Alternatively, TCP keep-alive via :attr:`SocketOptions.keep_alive`
     * may accomplish this in a more efficient (low-power) scenario,
     * but keep-alive options may not work the same way on every platform and OS version.
     */
    ping_timeout?: number;

    /**
     * Milliseconds to wait for the response to the operation requires response by protocol.
     * Set to zero to disable timeout. Otherwise, the operation will fail if no response is
     * received within this amount of time after the packet is written to the socket.
     * It applied to PUBLISH (QoS>0) and UNSUBSCRIBE now.
     */
    protocol_operation_timeout?: number;

    /**
     * Minimum seconds to wait between reconnect attempts.
     * Must be <= {@link reconnect_max_sec}.
     * Wait starts at min and doubles with each attempt until max is reached.
     */
    reconnect_min_sec?: number;

    /**
     * Maximum seconds to wait between reconnect attempts.
     * Must be >= {@link reconnect_min_sec}.
     * Wait starts at min and doubles with each attempt until max is reached.
     */
    reconnect_max_sec?: number;

    /**
     * Will to send with CONNECT packet. The will is
     * published by the server when its connection to the client is unexpectedly lost.
     */
    will?: MqttWill;

    /** Username to connect with */
    username?: string;

    /** Password to connect with */
    password?: string;

    /** Options for the underlying websocket connection */
    websocket?: WebsocketOptions;

    /** AWS credentials, which will be used to sign the websocket request */
    credentials?: AWSCredentials;

    /** Options for the underlying credentials provider */
    credentials_provider?: auth.CredentialsProvider;
}

/**
 * MQTT client
 *
 * @category MQTT
 */
export class MqttClient {
    constructor(bootstrap?: ClientBootstrap) {

    }

    /**
     * Creates a new {@link MqttClientConnection}
     * @param config Configuration for the connection
     * @returns A new connection
     */
    new_connection(config: MqttConnectionConfig) {
        return new MqttClientConnection(this, config);
    }
}

/**
 * @internal
 */
enum MqttBrowserClientState {
    Connected,
    Stopped
};


/** @internal */
class TopicTrie extends Trie<OnMessageCallback | undefined> {
    constructor() {
        super('/');
    }

    protected find_node(key: string, op: TrieOp) {
        const parts = this.split_key(key);
        let current = this.root;
        let parent = undefined;
        for (const part of parts) {
            let child = current.children.get(part);
            if (!child) {
                child = current.children.get('#');
                if (child) {
                    return child;
                }

                child = current.children.get('+');
            }
            if (!child) {
                if (op == TrieOp.Insert) {
                    current.children.set(part, child = new TrieNode(part));
                }
                else {
                    return undefined;
                }
            }
            parent = current;
            current = child;
        }
        if (parent && op == TrieOp.Delete) {
            parent.children.delete(current.key!);
        }
        return current;
    }
}

/**
 * MQTT client connection
 *
 * @category MQTT
 */
export class MqttClientConnection extends BufferedEventEmitter {
    private connection: mqtt.MqttClient;
    private subscriptions = new TopicTrie();
    private connection_count = 0;

    // track number of times in a row that reconnect has been attempted
    // use exponential backoff between subsequent failed attempts
    private reconnect_count = 0;
    private reconnect_min_sec = DEFAULT_RECONNECT_MIN_SEC;
    private reconnect_max_sec = DEFAULT_RECONNECT_MAX_SEC;

    private currentState: MqttBrowserClientState = MqttBrowserClientState.Stopped;
    private desiredState: MqttBrowserClientState = MqttBrowserClientState.Stopped;
    private reconnectTask?: ReturnType<typeof setTimeout>;

    // The last error reported by MQTT.JS - or undefined if none has occurred or the error has been processed.
    private lastError? : Error;

    /**
     * @param client The client that owns this connection
     * @param config The configuration for this connection
     */
    constructor(
        readonly client: MqttClient,
        private config: MqttConnectionConfig) {
        super();

        const create_websocket_stream = (client: mqtt.MqttClient) => WebsocketUtils.create_websocket_stream(this.config);
        const transform_websocket_url = (url: string, options: mqtt.IClientOptions, client: mqtt.MqttClient) => WebsocketUtils.create_websocket_url(this.config);

        if (config == null || config == undefined) {
            throw new CrtError("MqttClientConnection constructor: config not defined");
        }

        const will = this.config.will ? {
            topic: this.config.will.topic,
            payload: normalize_payload(this.config.will.payload),
            qos: this.config.will.qos,
            retain: this.config.will.retain,
        } : undefined;


        if (config.reconnect_min_sec !== undefined) {
            this.reconnect_min_sec = config.reconnect_min_sec;
            // clamp max, in case they only passed in min
            this.reconnect_max_sec = Math.max(this.reconnect_min_sec, this.reconnect_max_sec);
        }

        if (config.reconnect_max_sec !== undefined) {
            this.reconnect_max_sec = config.reconnect_max_sec;
            // clamp min, in case they only passed in max (or passed in min > max)
            this.reconnect_min_sec = Math.min(this.reconnect_min_sec, this.reconnect_max_sec);
        }

        this.reset_reconnect_times();

        // If the credentials are set but no the credentials_provider
        if (this.config.credentials_provider == undefined &&
            this.config.credentials != undefined) {
            const provider = new auth.StaticCredentialProvider(
                { aws_region: this.config.credentials.aws_region,
                  aws_access_id: this.config.credentials.aws_access_id,
                  aws_secret_key: this.config.credentials.aws_secret_key,
                  aws_sts_token: this.config.credentials.aws_sts_token});
            this.config.credentials_provider = provider;
        }

        const websocketXform = (this.config.websocket || {}).protocol != 'wss-custom-auth' ? transform_websocket_url : undefined;
        this.connection = new mqtt.MqttClient(
            create_websocket_stream,
            {
                // service default is 1200 seconds
                keepalive: this.config.keep_alive ? this.config.keep_alive : 1200,
                clientId: this.config.client_id,
                connectTimeout: this.config.ping_timeout ? this.config.ping_timeout : 30 * 1000,
                clean: this.config.clean_session,
                username: this.config.username,
                password: this.config.password,
                reconnectPeriod: this.reconnect_max_sec * 1000,
                will: will,
                transformWsUrl: websocketXform,
            }
        );

        this.connection.on('connect', this.on_connect);
        this.connection.on('error', this.on_error);
        this.connection.on('message', this.on_message);
        this.connection.on('close', this.on_close);
        this.connection.on('end', this.on_disconnected);
    }

    /**
     * Emitted when the connection successfully establishes itself for the first time
     *
     * @event
     */
    static CONNECT = 'connect';

    /**
     * Emitted when connection has disconnected sucessfully.
     *
     * @event
     */
    static DISCONNECT = 'disconnect';

    /**
     * Emitted when an error occurs.  The error will contain the error
     * code and message.
     *
     * @event
     */
    static ERROR = 'error';

    /**
     * Emitted when the connection is dropped unexpectedly. The error will contain the error
     * code and message.  The underlying mqtt implementation will attempt to reconnect.
     *
     * @event
     */
    static INTERRUPT = 'interrupt';

    /**
     * Emitted when the connection reconnects (after an interrupt). Only triggers on connections after the initial one.
     *
     * @event
     */
    static RESUME = 'resume';

    /**
     * Emitted when any MQTT publish message arrives.
     *
     * @event
     */
    static MESSAGE = 'message';

    /**
     * Emitted on every successful connect and reconnect.
     * Will contain a boolean indicating whether the connection resumed a session.
     *
     * @event
     */
    static CONNECTION_SUCCESS = 'connection_success';

    /**
     * Emitted on an unsuccessful connect and reconnect.
     * Will contain an error code indicating the reason for the unsuccessful connection.
     *
     * @event
     */
    static CONNECTION_FAILURE = 'connection_failure';

    /**
     * Emitted when the MQTT connection was disconnected and shutdown successfully.
     *
     * @event
     */
    static CLOSED = 'closed'

    on(event: 'connect', listener: MqttConnectionConnected): this;

    on(event: 'disconnect', listener: MqttConnectionDisconnected): this;

    on(event: 'error', listener: MqttConnectionError): this;

    on(event: 'interrupt', listener: MqttConnectionInterrupted): this;

    on(event: 'connection_success', listener: MqttConnectionSuccess): this;

    on(event: 'connection_failure', listener: MqttConnectionFailure): this;

    on(event: 'closed', listener: MqttConnectionClosed): this;

    on(event: 'resume', listener: MqttConnectionResumed): this;

    on(event: 'message', listener: OnMessageCallback): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Open the actual connection to the server (async).
     * @returns A Promise which completes whether the connection succeeds or fails.
     *          If connection fails, the Promise will reject with an exception.
     *          If connection succeeds, the Promise will return a boolean that is
     *          true for resuming an existing session, or false if the session is new
     */
    async connect() {
        this.desiredState = MqttBrowserClientState.Connected;

        setTimeout(() => { this.uncork() }, 0);
        return new Promise<boolean>(async (resolve, reject) => {
            let provider = this.config.credentials_provider;
            if (provider) {
                await provider.refreshCredentials();
            }

            const on_connect_error = (error: Error) => {
                let crtError = new CrtError(error);
                let failureCallbackData = { error: crtError } as OnConnectionFailedResult;
                this.emit('connection_failure', failureCallbackData);

                reject(crtError);
            };
            this.connection.once('error', on_connect_error);

            this.connection.once('connect', (connack: mqtt.IConnackPacket) => {
                this.connection.removeListener('error', on_connect_error);
                resolve(connack.sessionPresent);
            });
        });
    }

    /**
     * The connection will automatically reconnect. To cease reconnection attempts, call {@link disconnect}.
     * To resume the connection, call {@link connect}.
     * @deprecated
     */
    async reconnect() {
        return this.connect();
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
    async publish(topic: string, payload: Payload, qos: QoS, retain: boolean = false): Promise<MqttRequest> {
        // Skip payload since it can be several different types
        if (typeof(topic) !== 'string') {
            return Promise.reject("topic is not a string");
        }
        if (typeof(qos) !== 'number') {
            return Promise.reject("qos is not a number");
        }
        if (typeof(retain) !== 'boolean') {
            return Promise.reject('retain is not a boolean');
        }

        let payload_data = normalize_payload(payload);
        return new Promise((resolve, reject) => {
            this.connection.publish(topic, payload_data, { qos: qos, retain: retain }, (error, packet) => {
                if (error) {
                    reject(new CrtError(error));
                    return this.on_error(error);
                }

                let id = undefined;
                if (qos != QoS.AtMostOnce) {
                    id = (packet as mqtt.IPublishPacket).messageId;
                }
                resolve({ packet_id: id });
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
    async subscribe(topic: string, qos: QoS, on_message?: OnMessageCallback): Promise<MqttSubscribeRequest> {
        if (typeof(topic) !== 'string') {
            return Promise.reject("topic is not a string");
        }
        if (typeof(qos) !== 'number') {
            return Promise.reject("qos is not a number");
        }

        this.subscriptions.insert(topic, on_message);
        return new Promise((resolve, reject) => {
            this.connection.subscribe(topic, { qos: qos }, (error, packet) => {
                if (error) {
                    reject(new CrtError(error))
                    return this.on_error(error);
                }
                const sub = (packet as mqtt.ISubscriptionGrant[])[0];
                resolve({ topic: sub.topic, qos: sub.qos });
            });
        });
    }

    /**
     * Unsubscribe from a topic filter (async).
     * The client sends an UNSUBSCRIBE packet, and the server responds with an UNSUBACK.
     * @param topic The topic filter to unsubscribe from. May contain wildcards.
     * @returns Promise which returns a {@link MqttRequest} which will contain the packet id
     *          of the UNSUBSCRIBE packet being acknowledged. Promise is resolved when an
     *          UNSUBACK is received from the server or is rejected when an exception occurs.
     */
    async unsubscribe(topic: string): Promise<MqttRequest> {
        if (typeof(topic) !== 'string') {
            return Promise.reject("topic is not a string");
        }

        this.subscriptions.remove(topic);
        return new Promise((resolve, reject) => {
            this.connection.unsubscribe(topic, undefined, (error?: Error, packet?: mqtt.Packet) => {
                if (error) {
                    reject(new CrtError(error));
                    return this.on_error(error);
                }
                resolve({
                    packet_id: packet
                        ? (packet as mqtt.IUnsubackPacket).messageId
                        : undefined,
                });
            });

        });
    }

    /**
     * Close the connection (async).
     * @returns Promise which completes when the connection is closed.
     */
    async disconnect() {
        this.desiredState = MqttBrowserClientState.Stopped;

        /* If the user wants to disconnect, stop the recurrent connection task */
        if (this.reconnectTask) {
            clearTimeout(this.reconnectTask);
            this.reconnectTask = undefined;
        }

        return new Promise((resolve) => {
            /*
             * The original implementation did not force the disconnect so in our update to fix the promise resolution,
             * we need to keep that contract.
             */
            this.connection.end(false, {}, resolve);
        });
    }

    private on_connect = (connack: mqtt.IConnackPacket) => {
        this.on_online(connack.sessionPresent);
    }

    private on_online = (session_present: boolean) => {
        this.currentState = MqttBrowserClientState.Connected;

        if (++this.connection_count == 1) {
            this.emit('connect', session_present);
        } else {
            /** Reset reconnect times after reconnect succeed. */
            this.reset_reconnect_times();
            this.emit('resume', 0, session_present);
        }

        // Call connection success every time we connect, whether it is a first connect or a reconnect
        let successCallbackData = { session_present: session_present } as OnConnectionSuccessResult;
        this.emit('connection_success', successCallbackData);
    }

    private on_close = () => {
        let lastError : Error | undefined = this.lastError;

        /*
         * Only emit an interruption event if we were connected, otherwise we just failed to reconnect after
         * a disconnection.
         */
        if (this.currentState == MqttBrowserClientState.Connected) {
            this.currentState = MqttBrowserClientState.Stopped;
            this.emit('interrupt', -1);

            /* Did we intend to disconnect? If so, then emit the event */
            if (this.desiredState == MqttBrowserClientState.Stopped) {
                this.emit("closed");
            }
        }

        /* Only try and reconnect if our desired state is connected, or in other words, no one has called disconnect() */
        if (this.desiredState == MqttBrowserClientState.Connected) {
            let crtError = new CrtError(lastError?.toString() ?? "connectionFailure")
            let failureCallbackData = { error: crtError } as OnConnectionFailedResult;
            this.emit('connection_failure', failureCallbackData);

            const waitTime = this.get_reconnect_time_sec();
            this.reconnectTask = setTimeout(() => {
                    /** Emit reconnect after backoff time */
                    this.reconnect_count++;
                    this.connection.reconnect();
                },
                waitTime * 1000);
        }

        this.lastError = undefined;
    }

    private on_disconnected = () => {
        this.emit('disconnect');

        /**
         * This shouldn't ever occur, but in THEORY it could be possible to have on_disconnected called with the intent
         * to disconnect without on_close called first. This would properly emit 'closed' should that unlikely event occur.
         */
        if (this.currentState == MqttBrowserClientState.Connected && this.desiredState == MqttBrowserClientState.Stopped) {
            let closedCallbackData = {} as OnConnectionClosedResult;
            this.emit("closed", closedCallbackData);
        }
    }

    private on_error = (error: Error) => {
        this.lastError = error;
        this.emit('error', new CrtError(error))
    }

    private on_message = (topic: string, payload: Buffer, packet: mqtt.IPublishPacket) => {
        // pass payload as ArrayBuffer
        const array_buffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength)

        const callback = this.subscriptions.find(topic);
        if (callback) {
            callback(topic, array_buffer, packet.dup, packet.qos, packet.retain);
        }
        this.emit('message', topic, array_buffer, packet.dup, packet.qos, packet.retain);
    }

    private reset_reconnect_times() {
        this.reconnect_count = 0;
    }

    /**
     * Returns seconds until next reconnect attempt.
     */
    private get_reconnect_time_sec(): number {
        if (this.reconnect_min_sec == 0 && this.reconnect_max_sec == 0) {
            return 0;
        }

        // Uses "FullJitter" backoff algorithm, described here:
        // https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
        // We slightly vary the algorithm described on the page,
        // which takes (base,cap) and may result in 0.
        // But we take (min,max) as parameters, and don't don't allow results less than min.
        const cap = this.reconnect_max_sec - this.reconnect_min_sec;
        const base = Math.max(this.reconnect_min_sec, 1);
        /** Use Math.pow() since IE does not support ** operator */
        const sleep = Math.random() * Math.min(cap, base * Math.pow(2, this.reconnect_count));
        return this.reconnect_min_sec + sleep;
    }
}
