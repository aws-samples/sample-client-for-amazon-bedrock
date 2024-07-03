import { BufferedEventEmitter } from '../common/event';
import * as io from "./io";
import * as http from './http';
import * as mqtt5_packet from "../common/mqtt5_packet";
import * as mqtt5 from "../common/mqtt5";
export { HttpProxyOptions } from './http';
export * from "../common/mqtt5";
export * from '../common/mqtt5_packet';
/**
 * Websocket handshake http request transformation function signature
 */
export type WebsocketHandshakeTransform = (request: http.HttpRequest, done: (error_code?: number) => void) => void;
/**
 * Information about the client's queue of operations
 */
export interface ClientStatistics {
    /**
     * Total number of operations submitted to the client that have not yet been completed.  Unacked operations
     * are a subset of this.
     */
    incompleteOperationCount: number;
    /**
     * Total packet size of operations submitted to the client that have not yet been completed.  Unacked operations
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
/**
 * Controls how disconnects affect the queued and in-progress operations tracked by the client.  Also controls
 * how operations are handled while the client is not connected.  In particular, if the client is not connected,
 * then any operation that would be failed on disconnect (according to these rules) will be rejected.
 */
export declare enum ClientOperationQueueBehavior {
    /** Same as FailQos0PublishOnDisconnect */
    Default = 0,
    /**
     * Re-queues QoS 1+ publishes on disconnect; un-acked publishes go to the front while unprocessed publishes stay
     * in place.  All other operations (QoS 0 publishes, subscribe, unsubscribe) are failed.
     */
    FailNonQos1PublishOnDisconnect = 1,
    /**
     * QoS 0 publishes that are not complete at the time of disconnection are failed.  Un-acked QoS 1+ publishes are
     * re-queued at the head of the line for immediate retransmission on a session resumption.  All other operations
     * are requeued in original order behind any retransmissions.
     */
    FailQos0PublishOnDisconnect = 2,
    /**
     * All operations that are not complete at the time of disconnection are failed, except operations that
     * the MQTT5 spec requires to be retransmitted (un-acked QoS1+ publishes).
     */
    FailAllOnDisconnect = 3
}
/**
 * Additional controls for client behavior with respect to operation validation and flow control; these checks
 * go beyond the MQTT5 spec to respect limits of specific MQTT brokers.
 */
export declare enum ClientExtendedValidationAndFlowControl {
    /**
     * Do not do any additional validation or flow control
     */
    None = 0,
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
    AwsIotCoreDefaults = 1
}
/**
 * Configuration options for mqtt5 client creation.
 */
export interface Mqtt5ClientConfig {
    /**
     * Host name of the MQTT server to connect to.
     */
    hostName: string;
    /**
     * Network port of the MQTT server to connect to.
     */
    port: number;
    /**
     * Controls how the MQTT5 client should behave with respect to MQTT sessions.
     */
    sessionBehavior?: mqtt5.ClientSessionBehavior;
    /**
     * Controls how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
     * timepoints for a large set of reconnecting clients.
     */
    retryJitterMode?: mqtt5.RetryJitterType;
    /**
     * Minimum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed with jitter
     * after each connection failure.
     */
    minReconnectDelayMs?: number;
    /**
     * Maximum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed with jitter
     * after each connection failure.
     */
    maxReconnectDelayMs?: number;
    /**
     * Amount of time that must elapse with an established connection before the reconnect delay is reset to the minimum.
     * This helps alleviate bandwidth-waste in fast reconnect cycles due to permission failures on operations.
     */
    minConnectedTimeToResetReconnectDelayMs?: number;
    /**
     * Time interval to wait after sending a CONNECT request for a CONNACK to arrive.  If one does not arrive, the
     * connection will be shut down.
     */
    connackTimeoutMs?: number;
    /**
     * All configurable options with respect to the CONNECT packet sent by the client, including the will.  These
     * connect properties will be used for every connection attempt made by the client.
     */
    connectProperties?: mqtt5_packet.ConnectPacket;
    /**
     * Controls how disconnects affect the queued and in-progress operations tracked by the client.  Also controls
     * how new operations are handled while the client is not connected.  In particular, if the client is not connected,
     * then any operation that would be failed on disconnect (according to these rules) will also be rejected.
     *
     * @group Node-only
     */
    offlineQueueBehavior?: ClientOperationQueueBehavior;
    /**
     * Time interval to wait after sending a PINGREQ for a PINGRESP to arrive.  If one does not arrive, the client will
     * close the current connection.
     *
     * @group Node-only
     */
    pingTimeoutMs?: number;
    /**
     * Time interval to wait for an ack after sending a QoS 1+ PUBLISH, SUBSCRIBE, or UNSUBSCRIBE before
     * failing the operation.
     *
     * @group Node-only
     */
    ackTimeoutSeconds?: number;
    /**
     * Additional controls for client behavior with respect to topic alias usage.
     *
     * If this setting is left undefined, then topic aliasing behavior will be disabled.
     */
    topicAliasingOptions?: mqtt5.TopicAliasingOptions;
    /**
     * Client bootstrap to use.  In almost all cases, this can be left undefined.
     *
     * @group Node-only
     */
    clientBootstrap?: io.ClientBootstrap;
    /**
     * Controls socket properties of the underlying MQTT connections made by the client.  Leave undefined to use
     * defaults (no TCP keep alive, 10 second socket timeout).
     *
     * @group Node-only
     */
    socketOptions?: io.SocketOptions;
    /**
     * TLS context for secure socket connections.
     * If undefined, then a plaintext connection will be used.
     *
     * @group Node-only
     */
    tlsCtx?: io.ClientTlsContext;
    /**
     * This callback allows a custom transformation of the HTTP request that acts as the websocket handshake.
     * Websockets will be used if this is set to a valid transformation callback.  To use websockets but not perform
     * a transformation, just set this as a trivial completion callback.  If undefined, the connection will be made
     * with direct MQTT.
     *
     * @group Node-only
     */
    websocketHandshakeTransform?: WebsocketHandshakeTransform;
    /**
     * Configures (tunneling) HTTP proxy usage when establishing MQTT connections
     *
     * @group Node-only
     */
    httpProxyOptions?: http.HttpProxyOptions;
    /**
     * Additional controls for client behavior with respect to operation validation and flow control; these checks
     * go beyond the base MQTT5 spec to respect limits of specific MQTT brokers.
     *
     * @group Node-only
     */
    extendedValidationAndFlowControlOptions?: ClientExtendedValidationAndFlowControl;
}
declare const Mqtt5Client_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
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
export declare class Mqtt5Client extends Mqtt5Client_base implements mqtt5.IMqtt5Client {
    /**
     * Client constructor
     *
     * @param config The configuration for this client
     */
    constructor(config: Mqtt5ClientConfig);
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
    close(): void;
    /**
     * Notifies the MQTT5 client that you want it to maintain connectivity to the configured endpoint.
     * The client will attempt to stay connected using the properties of the reconnect-related parameters
     * in the mqtt5 client configuration.
     *
     * This is an asynchronous operation.
     */
    start(): void;
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
    stop(disconnectPacket?: mqtt5_packet.DisconnectPacket): void;
    /**
     * Subscribe to one or more topic filters by queuing a SUBSCRIBE packet to be sent to the server.
     *
     * @param packet SUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the SUBACK response
     */
    subscribe(packet: mqtt5_packet.SubscribePacket): Promise<mqtt5_packet.SubackPacket>;
    /**
     * Unsubscribe from one or more topic filters by queuing an UNSUBSCRIBE packet to be sent to the server.
     *
     * @param packet UNSUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the UNSUBACK response
     */
    unsubscribe(packet: mqtt5_packet.UnsubscribePacket): Promise<mqtt5_packet.UnsubackPacket>;
    /**
     * Send a message to subscribing clients by queuing a PUBLISH packet to be sent to the server.
     *
     * @param packet PUBLISH packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the PUBACK response (QoS 1) or
     * undefined (QoS 0)
     */
    publish(packet: mqtt5_packet.PublishPacket): Promise<mqtt5.PublishCompletionResult>;
    /**
     * Queries a small set of numerical statistics about the current state of the client's operation queue
     *
     * @group Node-only
     */
    getOperationalStatistics(): ClientStatistics;
    /**
     * Queries a small set of numerical statistics about the current state of the client's operation queue
     * @deprecated use getOperationalStatistics instead
     *
     * @group Node-only
     */
    getQueueStatistics(): ClientStatistics;
    /**
     * Event emitted when the client encounters a serious error condition, such as invalid input, napi failures, and
     * other potentially unrecoverable situations.
     *
     * Listener type: {@link ErrorEventListener}
     *
     * @event
     */
    static ERROR: string;
    /**
     * Event emitted when an MQTT PUBLISH packet is received by the client.
     *
     * Listener type: {@link MessageReceivedEventListener}
     *
     * @event
     */
    static MESSAGE_RECEIVED: string;
    /**
     * Event emitted when the client begins a connection attempt.
     *
     * Listener type: {@link AttemptingConnectEventListener}
     *
     * @event
     */
    static ATTEMPTING_CONNECT: string;
    /**
     * Event emitted when the client successfully establishes an MQTT connection.  Only emitted after
     * an {@link ATTEMPTING_CONNECT attemptingConnect} event.
     *
     * Listener type: {@link ConnectionSuccessEventListener}
     *
     * @event
     */
    static CONNECTION_SUCCESS: string;
    /**
     * Event emitted when the client fails to establish an MQTT connection.  Only emitted after
     * an {@link ATTEMPTING_CONNECT attemptingConnect} event.
     *
     * Listener type: {@link ConnectionFailureEventListener}
     *
     * @event
     */
    static CONNECTION_FAILURE: string;
    /**
     * Event emitted when the client's current connection is closed for any reason.  Only emitted after
     * a {@link CONNECTION_SUCCESS connectionSuccess} event.
     *
     * Listener type: {@link DisconnectionEventListener}
     *
     * @event
     */
    static DISCONNECTION: string;
    /**
     * Event emitted when the client finishes shutdown as a result of the user invoking {@link stop}.
     *
     * Listener type: {@link StoppedEventListener}
     *
     * @event
     */
    static STOPPED: string;
    /**
     * Registers a listener for the client's {@link ERROR error} event.  An {@link ERROR error} event is emitted when
     * the client encounters a serious error condition, such as invalid input, napi failures, and other potentially
     * unrecoverable situations.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'error', listener: mqtt5.ErrorEventListener): this;
    /**
     * Registers a listener for the client's {@link MESSAGE_RECEIVED messageReceived} event.  A
     * {@link MESSAGE_RECEIVED messageReceived} event is emitted when an MQTT PUBLISH packet is received by the
     * client.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'messageReceived', listener: mqtt5.MessageReceivedEventListener): this;
    /**
     * Registers a listener for the client's {@link ATTEMPTING_CONNECT attemptingConnect} event.  A
     * {@link ATTEMPTING_CONNECT attemptingConnect} event is emitted every time the client begins a connection attempt.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'attemptingConnect', listener: mqtt5.AttemptingConnectEventListener): this;
    /**
     * Registers a listener for the client's {@link CONNECTION_SUCCESS connectionSuccess} event.  A
     * {@link CONNECTION_SUCCESS connectionSuccess} event is emitted every time the client successfully establishes
     * an MQTT connection.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'connectionSuccess', listener: mqtt5.ConnectionSuccessEventListener): this;
    /**
     * Registers a listener for the client's {@link CONNECTION_FAILURE connectionFailure} event.  A
     * {@link CONNECTION_FAILURE connectionFailure} event is emitted every time the client fails to establish an
     * MQTT connection.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'connectionFailure', listener: mqtt5.ConnectionFailureEventListener): this;
    /**
     * Registers a listener for the client's {@link DISCONNECTION disconnection} event.  A
     * {@link DISCONNECTION disconnection} event is emitted when the client's current MQTT connection is closed
     * for any reason.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'disconnection', listener: mqtt5.DisconnectionEventListener): this;
    /**
     * Registers a listener for the client's {@link STOPPED stopped} event.  A
     * {@link STOPPED stopped} event is emitted when the client finishes shutdown as a
     * result of the user invoking {@link stop}.
     *
     * @param event the type of event to listen to
     * @param listener the event listener to add
     */
    on(event: 'stopped', listener: mqtt5.StoppedEventListener): this;
    private static _s_on_stopped;
    private static _s_on_attempting_connect;
    private static _s_on_connection_success;
    private static _s_on_connection_failure;
    private static _s_on_disconnection;
    private static _s_on_suback_callback;
    private static _s_on_unsuback_callback;
    private static _s_on_puback_callback;
    private static _s_on_message_received;
}
