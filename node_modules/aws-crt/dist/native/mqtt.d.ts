import { NativeResource } from "./native_resource";
import { BufferedEventEmitter } from '../common/event';
import { CrtError } from './error';
import * as io from "./io";
import { HttpProxyOptions, HttpRequest } from './http';
export { HttpProxyOptions } from './http';
import { QoS, Payload, MqttRequest, MqttSubscribeRequest, MqttWill, OnMessageCallback, MqttConnectionConnected, MqttConnectionDisconnected, MqttConnectionResumed, OnConnectionSuccessResult, OnConnectionFailedResult, OnConnectionClosedResult } from "../common/mqtt";
export { QoS, Payload, MqttRequest, MqttSubscribeRequest, MqttWill, OnMessageCallback, MqttConnectionConnected, MqttConnectionDisconnected, MqttConnectionResumed, OnConnectionSuccessResult, OnConnectionFailedResult, OnConnectionClosedResult } from "../common/mqtt";
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
export type MqttConnectionSucess = (callback_data: OnConnectionSuccessResult) => void;
/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has been
 * connected successfully.
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
 * MQTT client
 *
 * @category MQTT
 */
export declare class MqttClient extends NativeResource {
    readonly bootstrap: io.ClientBootstrap | undefined;
    /**
     * @param bootstrap The {@link io.ClientBootstrap} to use for socket connections.  Leave undefined to use the
     *          default system-wide bootstrap (recommended).
     */
    constructor(bootstrap?: io.ClientBootstrap | undefined);
    /**
     * Creates a new {@link MqttClientConnection}
     * @param config Configuration for the mqtt connection
     * @returns A new connection
     */
    new_connection(config: MqttConnectionConfig): MqttClientConnection;
}
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
    /** Socket options */
    socket_options: io.SocketOptions;
    /** If true, connect to MQTT over websockets */
    use_websocket?: boolean;
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
    /**
     * TLS context for secure socket connections.
     * If None is provided, then an unencrypted connection is used.
     */
    tls_ctx?: io.ClientTlsContext;
    /** Optional proxy options */
    proxy_options?: HttpProxyOptions;
    /**
     * Optional function to transform websocket handshake request.
     * If provided, function is called each time a websocket connection is attempted.
     * The function may modify the HTTP request before it is sent to the server.
     */
    websocket_handshake_transform?: (request: HttpRequest, done: (error_code?: number) => void) => void;
}
/**
 * Information about the connection's queue of operations
 */
export interface ConnectionStatistics {
    /**
     * Total number of operations submitted to the connection that have not yet been completed.  Unacked operations
     * are a subset of this.
     */
    incompleteOperationCount: number;
    /**
     * Total packet size of operations submitted to the connection that have not yet been completed.  Unacked operations
     * are a subset of this.
     */
    incompleteOperationSize: number;
    /**
     * Total number of operations that have been sent to the server and are waiting for a corresponding ACK before
     * they can be completed.
     */
    unackedOperationCount: number;
    /**
     * Total packet size of operations that have been sent to the server and are waiting for a corresponding ACK before
     * they can be completed.
     */
    unackedOperationSize: number;
}
declare const MqttClientConnection_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
/**
 * MQTT client connection
 *
 * @category MQTT
 */
export declare class MqttClientConnection extends MqttClientConnection_base {
    readonly client: MqttClient;
    private config;
    readonly tls_ctx?: io.ClientTlsContext;
    /**
     * @param client The client that owns this connection
     * @param config The configuration for this connection
     */
    constructor(client: MqttClient, config: MqttConnectionConfig);
    private close;
    /**
     * Emitted when the connection successfully establishes itself for the first time
     *
     * @event
     */
    static CONNECT: string;
    /**
     * Emitted when connection has disconnected successfully.
     *
     * @event
     */
    static DISCONNECT: string;
    /**
     * Emitted when an error occurs.  The error will contain the error
     * code and message.
     *
     * @event
     */
    static ERROR: string;
    /**
     * Emitted when the connection is dropped unexpectedly. The error will contain the error
     * code and message.  The underlying mqtt implementation will attempt to reconnect.
     *
     * @event
     */
    static INTERRUPT: string;
    /**
     * Emitted when the connection reconnects (after an interrupt). Only triggers on connections after the initial one.
     *
     * @event
     */
    static RESUME: string;
    /**
     * Emitted when any MQTT publish message arrives.
     *
     * @event
     */
    static MESSAGE: string;
    /**
     * Emitted on every successful connect and reconnect.
     * Will contain a number with the connection reason code and
     * a boolean indicating whether the connection resumed a session.
     *
     * @event
     */
    static CONNECTION_SUCCESS: string;
    /**
     * Emitted on an unsuccessful connect and reconnect.
     * Will contain an error code indicating the reason for the unsuccessful connection.
     *
     * @event
     */
    static CONNECTION_FAILURE: string;
    /**
     * Emitted when the MQTT connection was disconnected and shutdown successfully.
     *
     * @event
     */
    static CLOSED: string;
    on(event: 'connect', listener: MqttConnectionConnected): this;
    on(event: 'disconnect', listener: MqttConnectionDisconnected): this;
    on(event: 'error', listener: MqttConnectionError): this;
    on(event: 'interrupt', listener: MqttConnectionInterrupted): this;
    on(event: 'resume', listener: MqttConnectionResumed): this;
    on(event: 'message', listener: OnMessageCallback): this;
    on(event: 'connection_success', listener: MqttConnectionSucess): this;
    on(event: 'connection_failure', listener: MqttConnectionFailure): this;
    on(event: 'closed', listener: MqttConnectionClosed): this;
    /**
     * Open the actual connection to the server (async).
     * @returns A Promise which completes whether the connection succeeds or fails.
     *          If connection fails, the Promise will reject with an exception.
     *          If connection succeeds, the Promise will return a boolean that is
     *          true for resuming an existing session, or false if the session is new
     */
    connect(): Promise<boolean>;
    /**
     * The connection will automatically reconnect when disconnected, removing the need for this function.
     * To cease automatic reconnection attempts, call {@link disconnect}.
     * @deprecated
     */
    reconnect(): Promise<boolean>;
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
    publish(topic: string, payload: Payload, qos: QoS, retain?: boolean): Promise<MqttRequest>;
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
    subscribe(topic: string, qos: QoS, on_message?: OnMessageCallback): Promise<MqttSubscribeRequest>;
    /**
     * Unsubscribe from a topic filter (async).
     * The client sends an UNSUBSCRIBE packet, and the server responds with an UNSUBACK.
     * @param topic The topic filter to unsubscribe from. May contain wildcards.
     * @returns Promise wihch returns a {@link MqttRequest} which will contain the packet id
     *          of the UNSUBSCRIBE packet being acknowledged. Promise is resolved when an
     *          UNSUBACK is received from the server or is rejected when an exception occurs.
     */
    unsubscribe(topic: string): Promise<MqttRequest>;
    /**
     * Close the connection (async).
     *
     * Will free all native resources, rendering the connection unusable after the disconnect() call.
     *
     * @returns Promise which completes when the connection is closed.
    */
    disconnect(): Promise<void>;
    /**
     * Queries a small set of numerical statistics about the current state of the connection's operation queue
     *
     * @group Node-only
     */
    getOperationalStatistics(): ConnectionStatistics;
    /**
     * Queries a small set of numerical statistics about the current state of the connection's operation queue
     * @deprecated use getOperationalStatistics instead
     *
     * @group Node-only
     */
    getQueueStatistics(): ConnectionStatistics;
    private _reject;
    private _on_connection_failure;
    private _on_connection_success;
    private _on_connection_interrupted;
    private _on_connection_resumed;
    private _on_any_publish;
    private _on_connection_closed;
    private _on_connect_callback;
    private _on_puback_callback;
    private _on_suback_callback;
    private _on_unsuback_callback;
    private _on_disconnect_callback;
}
