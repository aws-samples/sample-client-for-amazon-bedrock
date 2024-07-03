/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * @packageDocumentation
 * @module mqtt5
 */

import * as mqtt5_packet from "./mqtt5_packet";
import { ICrtError } from "./error";

/**
 * Mqtt behavior settings that are dynamically negotiated as part of the CONNECT/CONNACK exchange.
 *
 * While you can infer all of these values from a combination of
 *   1. defaults as specified in the mqtt5 spec
 *   1. your CONNECT settings
 *   1. the CONNACK from the broker
 *
 * the client instead does the combining for you and emits a NegotiatedSettings object with final, authoritative values.
 *
 * Negotiated settings are communicated with every successful connection establishment.
 */
export interface NegotiatedSettings {

    /**
     * The maximum QoS allowed for publishes on this connection instance
     */
    maximumQos: mqtt5_packet.QoS;

    /**
     * The amount of time in seconds the server will retain the MQTT session after a disconnect.
     */
    sessionExpiryInterval: number;

    /**
     * The number of in-flight QoS 1 and QoS2 publications the server is willing to process concurrently.
     */
    receiveMaximumFromServer: number;

    /**
     * The maximum packet size the server is willing to accept.
     */
    maximumPacketSizeToServer: number;

    /**
     * the maximum allowed topic alias value on publishes sent from client to server
     */
    topicAliasMaximumToServer: number;

    /**
     * the maximum allowed topic alias value on publishes sent from server to client
     */
    topicAliasMaximumToClient: number;

    /**
     * The maximum amount of time in seconds between client packets.  The client should use PINGREQs to ensure this
     * limit is not breached.  The server will disconnect the client for inactivity if no MQTT packet is received
     * in a time interval equal to 1.5 x this value.
     */
    serverKeepAlive: number;

    /**
     * Whether the server supports retained messages.
     */
    retainAvailable: boolean;

    /**
     * Whether the server supports wildcard subscriptions.
     */
    wildcardSubscriptionsAvailable: boolean;

    /**
     * Whether the server supports subscription identifiers
     */
    subscriptionIdentifiersAvailable: boolean;

    /**
     * Whether the server supports shared subscriptions
     */
    sharedSubscriptionsAvailable: boolean;

    /**
     * Whether the client has rejoined an existing session.
     */
    rejoinedSession: boolean;

    /**
     * The final client id in use by the newly-established connection.  This will be the configured client id if one
     * was given in the configuration, otherwise, if no client id was specified, this will be the client id assigned
     * by the server.  Reconnection attempts will always use the auto-assigned client id, allowing for auto-assigned
     * session resumption.
     */
    clientId: string;
}

/**
 * Controls how the MQTT5 client should behave with respect to MQTT sessions.
 */
export enum ClientSessionBehavior {

    /** Maps to Clean */
    Default = 0,

    /**
     * Always ask for a clean session when connecting
     */
    Clean = 1,

    /**
     * Always attempt to rejoin an existing session after an initial connection success.
     *
     * Session rejoin requires an appropriate non-zero session expiry interval in the client's CONNECT options.
     */
    RejoinPostSuccess = 2,

    /**
     * Always attempt to rejoin an existing session.  Since the client does not yet support durable session persistence,
     * this option is not guaranteed to be spec compliant because any unacknowledged qos1 publishes (which are
     * part of the client session state) will not be present on the initial connection.  Until we support
     * durable session resumption, this option is technically spec-breaking, but useful.
     */
    RejoinAlways = 3,
}

/**
 * Controls how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
 * timepoints for a large set of reconnecting clients.
 *
 * See [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
 */
export enum RetryJitterType {

    /**
     * Maps to Full
     */
    Default = 0,

    /**
     * Do not perform any randomization on the reconnect delay:
     * ```NextReconnectDelay = CurrentExponentialBackoffValue```
     */
    None = 1,

    /**
     * Fully random between no delay and the current exponential backoff value.
     * ```NextReconnectDelay = Random(0, CurrentExponentialBackoffValue)```
     */
    Full = 2,

    /**
     * ```NextReconnectDelay = Min(MaxReconnectDelay, Random(MinReconnectDelay, 3 * CurrentReconnectDelay)```
     */
    Decorrelated = 3,
}

/**
 * An enumeration that controls how the client applies topic aliasing to outbound publish packets.
 *
 * Topic alias behavior is described in https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901113
 */
export enum OutboundTopicAliasBehaviorType {

    /**
     * Maps to Disabled.  This keeps the client from being broken (by default) if the broker
     * topic aliasing implementation has a problem.
     */
    Default = 0,

    /**
     * Outbound aliasing is the user's responsibility.  Client will cache and use
     * previously-established aliases if they fall within the negotiated limits of the connection.
     *
     * The user must still always submit a full topic in their publishes because disconnections disrupt
     * topic alias mappings unpredictably.  The client will properly use a requested alias when the most-recently-seen
     * binding for a topic alias value matches the alias and topic in the publish packet.
     */
    Manual = 1,

    /**
     * (Recommended) The client will use an LRU cache to drive alias usage.
     *
     * Manually setting a topic alias will be ignored (the LRU cache is authoritative)
     */
    LRU = 2,

    /**
     * Completely disable outbound topic aliasing.
     */
    Disabled = 3,
}

/**
 * An enumeration that controls whether or not the client allows the broker to send publishes that use topic
 * aliasing.
 *
 * Topic alias behavior is described in https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901113
 */
export enum InboundTopicAliasBehaviorType {

    /**
     * Maps to Disabled.  This keeps the client from being broken (by default) if the broker
     * topic aliasing implementation has a problem.
     */
    Default = 0,

    /**
     * Allow the server to send PUBLISH packets to the client that use topic aliasing
     */
    Enabled = 1,

    /**
     * Forbid the server from sending PUBLISH packets to the client that use topic aliasing
     */
    Disabled = 2,
}

/**
 * Configuration for all client topic aliasing behavior.
 */
export interface TopicAliasingOptions {

    /**
     * Controls what kind of outbound topic aliasing behavior the client should attempt to use.
     *
     * If topic aliasing is not supported by the server, this setting has no effect and any attempts to directly
     * manipulate the topic alias id in outbound publishes will be ignored.
     *
     * If left undefined, then outbound topic aliasing is disabled.
     */
    outboundBehavior?: OutboundTopicAliasBehaviorType,

    /**
     * If outbound topic aliasing is set to LRU, this controls the maximum size of the cache.  If outbound topic
     * aliasing is set to LRU and this is zero or undefined, a sensible default is used (25).  If outbound topic
     * aliasing is not set to LRU, then this setting has no effect.
     *
     * The final size of the cache is determined by the minimum of this setting and the value of the
     * topic_alias_maximum property of the received CONNACK.  If the received CONNACK does not have an explicit
     * positive value for that field, outbound topic aliasing is disabled for the duration of that connection.
     */
    outboundCacheMaxSize?: number,

    /**
     * Controls whether or not the client allows the broker to use topic aliasing when sending publishes.  Even if
     * inbound topic aliasing is enabled, it is up to the server to choose whether or not to use it.
     *
     * If left undefined, then inbound topic aliasing is disabled.
     *
     * This field has no effect in the browser implementation.
     */
    inboundBehavior?: InboundTopicAliasBehaviorType,

    /**
     * If inbound topic aliasing is enabled, this will control the size of the inbound alias cache.  If inbound
     * aliases are enabled and this is zero or undefined, then a sensible default will be used (25).  If inbound
     * aliases are disabled, this setting has no effect.
     *
     * Behaviorally, this value overrides anything present in the topic_alias_maximum field of
     * the CONNECT packet options.
     *
     * This field has no effect in the browser implementation.
     */
    inboundCacheMaxSize?: number,
}

/* MQTT5 Event types */

/**
 * Payload of the Stopped event for the MQTT5 client.
 */
export interface StoppedEvent {
}

/**
 * Payload of the AttemptingConnect event for the MQTT5 client.
 */
export interface AttemptingConnectEvent {
}

/**
 * Payload of the ConnectionSuccess event for the MQTT5 client.
 */
export interface ConnectionSuccessEvent {

    /**
     * CONNACK packet received from the server.
     */
    connack: mqtt5_packet.ConnackPacket;

    /**
     * Final MQTT5 connection settings negotiated with the server.
     */
    settings: NegotiatedSettings;
}

/**
 * Payload of the ConnectionFailure event for the MQTT5 client.
 */
export interface ConnectionFailureEvent {

    /**
     * Description of why the connection attempt failed.
     */
    error: ICrtError;

    /**
     * If the connection failure was indicated by the server's CONNACK response, the CONNACK packet received from
     * the server.
     */
    connack?: mqtt5_packet.ConnackPacket;
}

/**
 * Payload of the Disconnection event for the MQTT5 client.
 */
export interface DisconnectionEvent {

    /**
     * Best-guess description of why the disconnection occurred.
     */
    error: ICrtError;

    /**
     * If the disconnection event was due to a server-side DISCONNECT packet, the DISCONNECT packet received from
     * the server.
     */
    disconnect?: mqtt5_packet.DisconnectPacket;
}

/**
 * Payload of the MessageReceived event for the MQTT5 client.
 */
export interface MessageReceivedEvent {

    /**
     * PUBLISH packet received from the server
     */
    message: mqtt5_packet.PublishPacket;
}

/**
 * Client Error event listener signature
 */
export type ErrorEventListener = (error: ICrtError) => void;

/**
 * Client Stopped lifecycle event listener signature
 */
export type StoppedEventListener = (eventData:StoppedEvent) => void;

/**
 * Client AttemptingConnect lifecycle event listener signature
 */
export type AttemptingConnectEventListener = (eventData: AttemptingConnectEvent) => void;

/**
 * Client ConnectionSuccess lifecycle event listener signature
 */
export type ConnectionSuccessEventListener = (eventData: ConnectionSuccessEvent) => void;

/**
 * Client ConnectionFailure lifecycle event listener signature
 */
export type ConnectionFailureEventListener = (eventData: ConnectionFailureEvent) => void;

/**
 * Client Disconnection lifecycle event listener signature
 */
export type DisconnectionEventListener = (eventData: DisconnectionEvent) => void;

/**
 * Message received event listener signature
 */
export type MessageReceivedEventListener = (eventData: MessageReceivedEvent) => void;

/**
 * Polymorphic success result for publish actions:
 *
 * * QoS 0 - resolves to undefined
 * * QoS 1 - resolves to a {@link PubackPacket}
 * * QoS 2 - (not yet supported) would resolve to a Pubcomp or a Pubrec
 */
export type PublishCompletionResult = mqtt5_packet.PubackPacket | undefined;

/**
 * Shared MQTT5 client interface across browser and node.
 *
 * Common event manipulation patterns have explicit functions separate from the EventListener interface because
 * creating an abstract event listening interface in typescript eludes me.
 */
export interface IMqtt5Client {

    /**
     * Triggers cleanup of native resources associated with the MQTT5 client.  Once this has been invoked, callbacks
     * and events are not guaranteed to be received.
     *
     * On the browser, the implementation is an empty function.
     *
     * On Node, this must be called when finished with a client; otherwise, native resources will leak.  It is not safe
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
     */
    close() : void;

    /**
     * Notifies the MQTT5 client that you want it to maintain connectivity to the configured endpoint.
     * The client will attempt to stay connected using the properties of the reconnect-related parameters
     * in the mqtt5 client configuration.
     *
     * This is an asynchronous operation.
     */
    start() : void;

    /**
     * Notifies the MQTT5 client that you want it to end connectivity to the configured endpoint, disconnecting any
     * existing connection and halting reconnection attempts.
     *
     * This is an asynchronous operation.  Once the process completes, no further events will be emitted until the client
     * has {@link start} invoked.
     *
     * @param disconnectPacket (optional) properties of a DISCONNECT packet to send as part of the shutdown process
     */
    stop(packet?: mqtt5_packet.DisconnectPacket) : void;

    /**
     * Subscribe to one or more topic filters by queuing a SUBSCRIBE packet to be sent to the server.
     *
     * @param packet SUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the SUBACK response
     */
    subscribe(packet: mqtt5_packet.SubscribePacket) : Promise<mqtt5_packet.SubackPacket>;

    /**
     * Unsubscribe from one or more topic filters by queuing an UNSUBSCRIBE packet to be sent to the server.
     *
     * @param packet UNSUBSCRIBE packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the UNSUBACK response
     */
    unsubscribe(packet: mqtt5_packet.UnsubscribePacket) : Promise<mqtt5_packet.UnsubackPacket>;

    /**
     * Send a message to subscribing clients by queuing a PUBLISH packet to be sent to the server.
     *
     * @param packet PUBLISH packet to send to the server
     * @returns a promise that will be rejected with an error or resolved with the PUBACK response
     */
    publish(packet: mqtt5_packet.PublishPacket) : Promise<PublishCompletionResult>;

}
