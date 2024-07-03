/**
 *
 * A module containing support for mqtt connection establishment and operations.
 *
 * @packageDocumentation
 * @module mqtt
 */
import { ICrtError } from './error';
/**
 * Quality of service control for mqtt publish operations
 *
 * @category MQTT
 */
export declare enum QoS {
    /**
     * QoS 0 - At most once delivery
     * The message is delivered according to the capabilities of the underlying network.
     * No response is sent by the receiver and no retry is performed by the sender.
     * The message arrives at the receiver either once or not at all.
     */
    AtMostOnce = 0,
    /**
     * QoS 1 - At least once delivery
     * This quality of service ensures that the message arrives at the receiver at least once.
     */
    AtLeastOnce = 1,
    /**
     * QoS 2 - Exactly once delivery

     * This is the highest quality of service, for use when neither loss nor
     * duplication of messages are acceptable. There is an increased overhead
     * associated with this quality of service.

     * Note that, while this client supports QoS 2, the AWS IoT Core service
     * does not support QoS 2 at time of writing (May 2020).
     */
    ExactlyOnce = 2
}
/**
 * Possible types of data to send via publish.
 *
 * An ArrayBuffer will send its bytes without transformation.
 * An ArrayBufferView (DataView, Uint8Array, etc) will send its bytes without transformation.
 * A String will be sent with utf-8 encoding.
 * An Object will be sent as a JSON string with utf-8 encoding.
 *
 * @category MQTT
 */
export type Payload = string | Record<string, unknown> | ArrayBuffer | ArrayBufferView;
/**
 * Function called upon receipt of a Publish message on a subscribed topic.
 *
 * @param topic The topic to which the message was published.
 * @param payload The payload data.
 * @param dup DUP flag. If true, this might be re-delivery of an earlier
 *            attempt to send the message.
 * @param qos Quality of Service used to deliver the message.
 * @param retain Retain flag. If true, the message was sent as a result of
 *               a new subscription being made by the client. *
 *
 * @category MQTT
 */
export type OnMessageCallback = (topic: string, payload: ArrayBuffer, dup: boolean, qos: QoS, retain: boolean) => void;
/**
 * Every request sent returns an MqttRequest
 *
 * @category MQTT
 */
export interface MqttRequest {
    /** Packet ID being acknowledged when the request completes */
    packet_id?: number;
}
/**
 * The data returned from an on_connection_success callback
 *
 * @category MQTT
 */
export interface OnConnectionSuccessResult {
    /**
     * A boolean indicating if the connection resumed a session.
     */
    session_present: boolean;
    /**
     * An optional connect return code received from the server, if a connect return code was returned.
     */
    reason_code?: number;
}
/**
 * The data returned from an on_connection_failed callback
 *
 * @category MQTT
 */
export interface OnConnectionFailedResult {
    /**
     * Error description of the error that occurred
     */
    error: ICrtError;
}
/**
 * The data returned from the on_connection_closed callback
 *
 * @category MQTT
 */
export interface OnConnectionClosedResult {
}
/**
 * Subscription SUBACK result
 *
 * @category MQTT
 */
export interface MqttSubscribeRequest extends MqttRequest {
    /** Topic filter of the SUBSCRIBE packet being acknowledged */
    topic: string;
    /** Maximum QoS granted by the server. This may be lower than the requested QoS. */
    qos: QoS;
    /** If an error occurred, the error code */
    error_code?: number;
}
/**
 * A Will message is published by the server if a client is lost unexpectedly.
 *
 * The Will message is stored on the server when a client connects.
 * It is published if the client connection is lost without the server
 * receiving a DISCONNECT packet.
 *
 * [MQTT - 3.1.2 - 8]
 *
 * @category MQTT
 */
export declare class MqttWill {
    /** Topic to publish Will message on. */
    readonly topic: string;
    /** QoS used when publishing the Will message. */
    readonly qos: QoS;
    /** Content of Will message. */
    readonly payload: Payload;
    /** Whether the Will message is to be retained when it is published. */
    readonly retain: boolean;
    constructor(
    /** Topic to publish Will message on. */
    topic: string, 
    /** QoS used when publishing the Will message. */
    qos: QoS, 
    /** Content of Will message. */
    payload: Payload, 
    /** Whether the Will message is to be retained when it is published. */
    retain?: boolean);
}
/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection reaches an initial
 * connected state
 *
 * @param session_present true if the reconnection went to an existing session, false if this is a clean session
 *
 * @category MQTT
 */
export type MqttConnectionConnected = (session_present: boolean) => void;
/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection has fully disconnected
 * by user request
 *
 * @category MQTT
 */
export type MqttConnectionDisconnected = () => void;
/**
 * Listener signature for event emitted from an {@link MqttClientConnection} when the connection successfully
 * reestablishes itself after an interruption
 *
 * @param return_code MQTT connect return code (should be 0 for a successful reconnection)
 * @param session_present true if the reconnection went to an existing session, false if this is a clean session
 *
 * @category MQTT
 */
export type MqttConnectionResumed = (return_code: number, session_present: boolean) => void;
/**
 * Const value for max reconnection back off time
 *
 * @category MQTT
 */
export declare const DEFAULT_RECONNECT_MAX_SEC = 128;
/**
 * Const value for min reconnection back off time
 *
 * @category MQTT
 */
export declare const DEFAULT_RECONNECT_MIN_SEC = 1;
