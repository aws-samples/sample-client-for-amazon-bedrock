/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * @packageDocumentation
 * @module mqtt5
 */

/**
 * Data model for MQTT5 user properties.
 *
 * A user property is a name-value pair of utf-8 strings that can be added to mqtt5 packets.
 */
export interface UserProperty {
    name: string;
    value: string;
}

/**
 * Server return code for connect attempts.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901079) encoding values.
 */
export enum ConnectReasonCode {

    /**
     * Returned when the connection is accepted.
     */
    Success = 0,

    /**
     * Returned when the server has a failure but does not want to specify a reason or none
     * of the other reason codes apply.
     */
    UnspecifiedError = 128,

    /**
     * Returned when data in the CONNECT packet could not be correctly parsed by the server.
     */
    MalformedPacket = 129,

    /**
     * Returned when data in the CONNECT packet does not conform to the MQTT5 specification requirements.
     */
    ProtocolError = 130,

    /**
     * Returned when the CONNECT packet is valid but was not accepted by the server.
     */
    ImplementationSpecificError = 131,

    /**
     * Returned when the server does not support MQTT5 protocol version specified in the connection.
     */
    UnsupportedProtocolVersion = 132,

    /**
     * Returned when the client identifier in the CONNECT packet is a valid string but not one that
     * is allowed on the server.
     */
    ClientIdentifierNotValid = 133,

    /**
     * Returned when the server does not accept the username and/or password specified by the client
     * in the connection packet.
     */
    BadUsernameOrPassword = 134,

    /**
     * Returned when the client is not authorized to connect to the server.
     */
    NotAuthorized = 135,

    /**
     * Returned when the MQTT5 server is not available.
     */
    ServerUnavailable = 136,

    /**
     * Returned when the server is too busy to make a connection. It is recommended that the client try again later.
     */
    ServerBusy = 137,

    /**
     * Returned when the client has been banned by the server.
     */
    Banned = 138,

    /**
     * Returned when the authentication method used in the connection is either not supported on the server or it does
     * not match the authentication method currently in use in the CONNECT packet.
     */
    BadAuthenticationMethod = 140,

    /**
     * Returned when the Will topic name sent in the connection packet is correctly formed, but is not accepted by
     * the server.
     */
    TopicNameInvalid = 144,

    /**
     * Returned when the connection packet exceeded the maximum permissible size on the server.
     */
    PacketTooLarge = 149,

    /**
     * Returned when the quota limits set on the server have been met and/or exceeded.
     */
    QuotaExceeded = 151,

    /**
     * Returned when the Will payload in the CONNECT packet does not match the specified payload format indicator.
     */
    PayloadFormatInvalid = 153,

    /**
     * Returned when the server does not retain messages but the connection packet on the client had Will retain enabled.
     */
    RetainNotSupported = 154,

    /**
     * Returned when the server does not support the QOS setting in the Will QOS in the connection packet.
     */
    QosNotSupported = 155,

    /**
     * Returned when the server is telling the client to temporarily use another server instead of the one they
     * are trying to connect to.
     */
    UseAnotherServer = 156,

    /**
     * Returned when the server is telling the client to permanently use another server instead of the one they
     * are trying to connect to.
     */
    ServerMoved = 157,

    /**
     * Returned when the server connection rate limit has been exceeded.
     */
    ConnectionRateExceeded = 159,
}

/**
 * Determines if a reason code represents a successful connect operation
 *
 * @param reasonCode reason code to check success for
 */
export function isSuccessfulConnectReasonCode(reasonCode: ConnectReasonCode): boolean {
    return reasonCode < 128;
}

/**
 * Reason code inside DISCONNECT packets.  Helps determine why a connection was terminated.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901208) encoding values.
 */
export enum DisconnectReasonCode {

    /**
     * Returned when the remote endpoint wishes to disconnect normally. Will not trigger the publish of a Will message if a
     * Will message was configured on the connection.
     *
     * May be sent by the client or server.
     */
    NormalDisconnection = 0,

    /**
     * Returns that the client wants to disconnect but requires that the server publish the Will message configured
     * on the connection.
     *
     * May only be sent by the client.
     */
    DisconnectWithWillMessage = 4,

    /**
     * Returned when the connection was closed but the sender does not want to specify a reason or none
     * of the other reason codes apply.
     *
     * May be sent by the client or the server.
     */
    UnspecifiedError = 128,

    /**
     * Indicates the remote endpoint received a packet that does not conform to the MQTT specification.
     *
     * May be sent by the client or the server.
     */
    MalformedPacket = 129,

    /**
     * Returned when an unexpected or out-of-order packet was received by the remote endpoint.
     *
     * May be sent by the client or the server.
     */
    ProtocolError = 130,

    /**
     * Returned when a valid packet was received by the remote endpoint, but could not be processed by the current implementation.
     *
     * May be sent by the client or the server.
     */
    ImplementationSpecificError = 131,

    /**
     * Returned when the remote endpoint received a packet that represented an operation that was not authorized within
     * the current connection.
     *
     * May only be sent by the server.
     */
    NotAuthorized = 135,

    /**
     * Returned when the server is busy and cannot continue processing packets from the client.
     *
     * May only be sent by the server.
     */
    ServerBusy = 137,

    /**
     * Returned when the server is shutting down.
     *
     * May only be sent by the server.
     */
    ServerShuttingDown = 139,

    /**
     * Returned when the server closes the connection because no packet from the client has been received in
     * 1.5 times the KeepAlive time set when the connection was established.
     *
     * May only be sent by the server.
     */
    KeepAliveTimeout = 141,

    /**
     * Returned when the server has established another connection with the same client ID as a client's current
     * connection, causing the current client to become disconnected.
     *
     * May only be sent by the server.
     */
    SessionTakenOver = 142,

    /**
     * Returned when the topic filter name is correctly formed but not accepted by the server.
     *
     * May only be sent by the server.
     */
    TopicFilterInvalid = 143,

    /**
     * Returned when topic name is correctly formed, but is not accepted.
     *
     * May be sent by the client or the server.
     */
    TopicNameInvalid = 144,

    /**
     * Returned when the remote endpoint reached a state where there were more in-progress QoS1+ publishes then the
     * limit it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    ReceiveMaximumExceeded = 147,

    /**
     * Returned when the remote endpoint receives a PUBLISH packet that contained a topic alias greater than the
     * maximum topic alias limit that it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    TopicAliasInvalid = 148,

    /**
     * Returned when the remote endpoint received a packet whose size was greater than the maximum packet size limit
     * it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    PacketTooLarge = 149,

    /**
     * Returned when the remote endpoint's incoming data rate was too high.
     *
     * May be sent by the client or the server.
     */
    MessageRateTooHigh = 150,

    /**
     * Returned when an internal quota of the remote endpoint was exceeded.
     *
     * May be sent by the client or the server.
     */
    QuotaExceeded = 151,

    /**
     * Returned when the connection was closed due to an administrative action.
     *
     * May be sent by the client or the server.
     */
    AdministrativeAction = 152,

    /**
     * Returned when the remote endpoint received a packet where payload format did not match the format specified
     * by the payload format indicator.
     *
     * May be sent by the client or the server.
     */
    PayloadFormatInvalid = 153,

    /**
     * Returned when the server does not support retained messages.
     *
     * May only be sent by the server.
     */
    RetainNotSupported = 154,


    /**
     * Returned when the client sends a QOS that is greater than the maximum QOS established when the connection was
     * opened.
     *
     * May only be sent by the server.
     */
    QosNotSupported = 155,

    /**
     * Returned by the server to tell the client to temporarily use a different server.
     *
     * May only be sent by the server.
     */
    UseAnotherServer = 156,

    /**
     * Returned by the server to tell the client to permanently use a different server.
     *
     * May only be sent by the server.
     */
    ServerMoved = 157,

    /**
     * Returned by the server to tell the client that shared subscriptions are not supported on the server.
     *
     * May only be sent by the server.
     */
    SharedSubscriptionsNotSupported = 158,

    /**
     * Returned when the server disconnects the client due to the connection rate being too high.
     *
     * May only be sent by the server.
     */
    ConnectionRateExceeded = 159,

    /**
     * Returned by the server when the maximum connection time authorized for the connection was exceeded.
     *
     * May only be sent by the server.
     */
    MaximumConnectTime = 160,

    /**
     * Returned by the server when it received a SUBSCRIBE packet with a subscription identifier, but the server does
     * not support subscription identifiers.
     *
     * May only be sent by the server.
     */
    SubscriptionIdentifiersNotSupported = 161,

    /**
     * Returned by the server when it received a SUBSCRIBE packet with a wildcard topic filter, but the server does
     * not support wildcard topic filters.
     *
     * May only be sent by the server.
     */
    WildcardSubscriptionsNotSupported = 162,
}

/**
 * Determines if a reason code represents a successful disconnect operation
 *
 * @param reasonCode reason code to check success for
 */
export function isSuccessfulDisconnectReasonCode(reasonCode: DisconnectReasonCode): boolean {
    return reasonCode < 128;
}

/**
 * Reason codes inside SUBACK packet payloads that specify the results for each subscription in the associated
 * SUBSCRIBE packet.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901178) encoding values.
 */
export enum SubackReasonCode {

    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 0.
     */
    GrantedQoS0 = 0,

    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 1.
     */
    GrantedQoS1 = 1,

    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 2.
     */
    GrantedQoS2 = 2,


    /**
     * Returned when the connection was closed but the sender does not want to specify a reason or none
     * of the other reason codes apply.
     */
    UnspecifiedError = 128,

    /**
     * Returned when the subscription was valid but the server did not accept it.
     */
    ImplementationSpecificError = 131,

    /**
     * Returned when the client was not authorized to make the subscription on the server.
     */
    NotAuthorized = 135,

    /**
     * Returned when the subscription topic filter was correctly formed but not allowed for the client.
     */
    TopicFilterInvalid = 143,

    /**
     * Returned when the packet identifier was already in use on the server.
     */
    PacketIdentifierInUse = 145,

    /**
     * Returned when a subscribe-related quota set on the server was exceeded.
     */
    QuotaExceeded = 151,

    /**
     * Returned when the subscription's topic filter was a shared subscription and the server does not support
     * shared subscriptions.
     */
    SharedSubscriptionsNotSupported = 158,

    /**
     * Returned when the SUBSCRIBE packet contained a subscription identifier and the server does not support
     * subscription identifiers.
     */
    SubscriptionIdentifiersNotSupported = 161,

    /**
     * Returned when the subscription's topic filter contains a wildcard but the server does not support
     * wildcard subscriptions.
     */
    WildcardSubscriptionsNotSupported = 162,
}

/**
 * Determines if a reason code represents a successful subscribe operation
 *
 * @param reasonCode reason code to check success for
 */
export function isSuccessfulSubackReasonCode(reasonCode: SubackReasonCode): boolean {
    return reasonCode < 128;
}

/**
 * Reason codes inside UNSUBACK packet payloads that specify the results for each topic filter in the associated
 * UNSUBSCRIBE packet.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901194) encoding values.
 */
export enum UnsubackReasonCode {

    /**
     * Returned when the unsubscribe was successful and the client is no longer subscribed to the topic filter on the server.
     */
    Success = 0,

    /**
     * Returned when the topic filter did not match one of the client's existing subscriptions on the server.
     */
    NoSubscriptionExisted = 17,

    /**
     * Returned when the unsubscribe of the topic filter was not accepted and the server does not want to specify a
     * reason or none of the other reason codes apply.
     */
    UnspecifiedError = 128,

    /**
     * Returned when the topic filter was valid but the server does not accept an unsubscribe for it.
     */
    ImplementationSpecificError = 131,

    /**
     * Returned when the client was not authorized to unsubscribe from that topic filter on the server.
     */
    NotAuthorized = 135,

    /**
     * Returned when the topic filter was correctly formed but is not allowed for the client on the server.
     */
    TopicFilterInvalid = 143,

    /**
     * Returned when the packet identifier was already in use on the server.
     */
    PacketIdentifierInUse = 145,
}

/**
 * Determines if a reason code represents a successful unsubscribe operation
 *
 * @param reasonCode reason code to check success for
 */
export function isSuccessfulUnsubackReasonCode(reasonCode: UnsubackReasonCode): boolean {
    return reasonCode < 128;
}

/**
 * Reason code inside PUBACK packets that indicates the result of the associated PUBLISH request.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901124) encoding values.
 */
export enum PubackReasonCode {

    /**
     * Returned when the (QoS 1) publish was accepted by the recipient.
     *
     * May be sent by the client or the server.
     */
    Success = 0,

    /**
     * Returned when the (QoS 1) publish was accepted but there were no matching subscribers.
     *
     * May only be sent by the server.
     */
    NoMatchingSubscribers = 16,

    /**
     * Returned when the (QoS 1) publish was not accepted and the receiver does not want to specify a reason or none
     * of the other reason codes apply.
     *
     * May be sent by the client or the server.
     */
    UnspecifiedError = 128,

    /**
     * Returned when the (QoS 1) publish was valid but the receiver was not willing to accept it.
     *
     * May be sent by the client or the server.
     */
    ImplementationSpecificError = 131,

    /**
     * Returned when the (QoS 1) publish was not authorized by the receiver.
     *
     * May be sent by the client or the server.
     */
    NotAuthorized = 135,

    /**
     * Returned when the topic name was valid but the receiver was not willing to accept it.
     *
     * May be sent by the client or the server.
     */
    TopicNameInvalid = 144,

    /**
     * Returned when the packet identifier used in the associated PUBLISH was already in use.
     * This can indicate a mismatch in the session state between client and server.
     *
     * May be sent by the client or the server.
     */
    PacketIdentifierInUse = 145,

    /**
     * Returned when the associated PUBLISH failed because an internal quota on the recipient was exceeded.
     *
     * May be sent by the client or the server.
     */
    QuotaExceeded = 151,

    /**
     * Returned when the PUBLISH packet's payload format did not match its payload format indicator property.
     *
     * May be sent by the client or the server.
     */
    PayloadFormatInvalid = 153,
}

/**
 * Determines if a reason code represents a successful QoS 1 publish operation
 *
 * @param reasonCode reason code to check success for
 */
export function isSuccessfulPubackReasonCode(reasonCode: PubackReasonCode): boolean {
    return reasonCode < 128;
}

/**
 * Optional property describing a PUBLISH payload's format.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901111) encoding values.
 */
export enum PayloadFormatIndicator {

    /**
     * The payload is arbitrary binary data
     */
    Bytes = 0,

    /**
     * The payload is a well-formed utf-8 string value.
     */
    Utf8 = 1,
}

/**
 * Valid types for a PUBLISH packet's payload
 *
 * While the payload as input can be one of several types, the payload as output (via message receipt)
 * will always be an ArrayBuffer of binary data.
 */
export type Payload = string | Record<string, unknown> | ArrayBuffer | ArrayBufferView;

/**
 * Valid types for MQTT5 packet binary data fields (other than PUBLISH payload)
 */
export type BinaryData = ArrayBuffer | ArrayBufferView;

/**
 * MQTT message delivery quality of service.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901234) encoding values.
 */
export enum QoS {

    /**
     * The message is delivered according to the capabilities of the underlying network. No response is sent by the
     * receiver and no retry is performed by the sender. The message arrives at the receiver either once or not at all.
     */
    AtMostOnce = 0,

    /**
     * A level of service that ensures that the message arrives at the receiver at least once.
     */
    AtLeastOnce = 1,

    /**
     * A level of service that ensures that the message arrives at the receiver exactly once.
     */
    ExactlyOnce = 2,
}

/**
 * Configures how retained messages should be handled when subscribing with a topic filter that matches topics with
 * associated retained messages.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169) encoding values.
 */
export enum RetainHandlingType {

    /**
     * The server should always send all retained messages on topics that match a subscription's filter.
     */
    SendOnSubscribe = 0x00,

    /**
     * The server should send retained messages on topics that match the subscription's filter, but only for the
     * first matching subscription, per session.
     */
    SendOnSubscribeIfNew = 0x01,

    /**
     * Subscriptions must not trigger any retained message publishes from the server.
     */
    DontSend = 0x02,
}

/**
 * Packet type indicator that allows for basic polymorphism with user-received packets.  Enum values
 * match the mqtt spec's [packet type encoding](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901022) values.
 */
export enum PacketType {
    Connect = 1,
    Connack = 2,
    Publish = 3,
    Puback = 4,
    Pubrec = 5,
    Pubrel = 6,
    Pubcomp = 7,
    Subscribe = 8,
    Suback = 9,
    Unsubscribe = 10,
    Unsuback = 11,
    Pingreq = 12,
    Pingresp = 13,
    Disconnect = 14,
    Auth = 15,
}

/**
 * Common interface for all packet types.
 */
export interface IPacket {

    /**
     * Always set on packets coming from the client to the user.  Ignored if set on packets that come from the
     * user to the client.
     *
     * The primary use is to allow users to distinguish between packets in polymorphic situations (for example,
     * the result of a publish attempt which might be a Puback (QoS 1) or Pubcomp (QoS 2, when we support it).
     */
    type?: PacketType;

}

/**
 * Data model of an [MQTT5 PUBLISH](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901100) packet
 */
export interface PublishPacket extends IPacket {

    /**
     * Sent publishes - The topic this message should be published to.
     *
     * Received publishes - The topic this message was published to.
     *
     * See [MQTT5 Topic Name](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901107)
     */
    topicName: string;

    /**
     * The payload of the publish message.
     *
     * See [MQTT5 Publish Payload](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901119)
     */
    payload?: Payload;

    /**
     * Sent publishes - The MQTT quality of service level this message should be delivered with.
     *
     * Received publishes - The MQTT quality of service level this message was delivered at.
     *
     * See [MQTT5 QoS](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901103)
     */
    qos: QoS;

    /**
     * True if this is a retained message, false otherwise.
     *
     * Always set on received publishes; on sent publishes, undefined implies false.
     *
     * See [MQTT5 Retain](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901104)
     */
    retain?: boolean;

    /**
     * Property specifying the format of the payload data.  The mqtt5 client does not enforce or use this
     * value in a meaningful way.
     *
     * See [MQTT5 Payload Format Indicator](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901111)
     */
    payloadFormat?: PayloadFormatIndicator;

    /**
     * Sent publishes - indicates the maximum amount of time allowed to elapse for message delivery before the server
     * should instead delete the message (relative to a recipient).
     *
     * Received publishes - indicates the remaining amount of time (from the server's perspective) before the message would
     * have been deleted relative to the subscribing client.
     *
     * If left undefined, indicates no expiration timeout.
     *
     * See [MQTT5 Message Expiry Interval](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901112)
     */
    messageExpiryIntervalSeconds?: number;

    /**
     * Sent publishes - (Node only) topic alias to use, if possible, when encoding this packet.  Only used if the
     * client's outbound topic aliasing mode is set to Manual.
     *
     * Received publishes - topic alias used by the server when transmitting the publish to the client.
     *
     * See [MQTT5 Topic Alias](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901113)
     */
    topicAlias?: number;

    /**
     * Opaque topic string intended to assist with request/response implementations.  Not internally meaningful to
     * MQTT5 or this client.
     *
     * See [MQTT5 Response Topic](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901114)
     */
    responseTopic?: string;

    /**
     * Opaque binary data used to correlate between publish messages, as a potential method for request-response
     * implementation.  Not internally meaningful to MQTT5.
     *
     * See [MQTT5 Correlation Data](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901115)
     */
    correlationData?: BinaryData;

    /**
     * Sent publishes - ignored
     *
     * Received publishes - the subscription identifiers of all the subscriptions this message matched.
     *
     * See [MQTT5 Subscription Identifier](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901117)
     */
    subscriptionIdentifiers?: Array<number>;

    /**
     * Property specifying the content type of the payload.  Not internally meaningful to MQTT5.
     *
     * See [MQTT5 Content Type](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901118)
     */
    contentType?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901116)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 PUBACK](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901121) packet
 */
export interface PubackPacket extends IPacket {

    /**
     * Success indicator or failure reason for the associated PUBLISH packet.
     *
     * See [MQTT5 PUBACK Reason Code](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901124)
     */
    reasonCode: PubackReasonCode;

    /**
     * Additional diagnostic information about the result of the PUBLISH attempt.
     *
     * See [MQTT5 Reason String](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901127)
     */
    reasonString?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901128)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 CONNECT](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901033) packet.
 */
export interface ConnectPacket extends IPacket {

    /**
     * The maximum time interval, in seconds, that is permitted to elapse between the point at which the client
     * finishes transmitting one MQTT packet and the point it starts sending the next.  The client will use
     * PINGREQ packets to maintain this property.
     *
     * If the responding CONNACK contains a keep alive property value, then that is the negotiated keep alive value.
     * Otherwise, the keep alive sent by the client is the negotiated value.
     *
     * See [MQTT5 Keep Alive](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901045)
     */
    keepAliveIntervalSeconds: number;

    /**
     * A unique string identifying the client to the server.  Used to restore session state between connections.
     *
     * If left empty, the broker will auto-assign a unique client id.  When reconnecting, the mqtt5 client will
     * always use the auto-assigned client id.
     *
     * See [MQTT5 Client Identifier](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901059)
     */
    clientId?: string;

    /**
     * A string value that the server may use for client authentication and authorization.
     *
     * See [MQTT5 User Name](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901071)
     */
    username?: string;

    /**
     * Opaque binary data that the server may use for client authentication and authorization.
     *
     * See [MQTT5 Password](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901072)
     */
    password?: BinaryData;

    /**
     * A time interval, in seconds, that the client requests the server to persist this connection's MQTT session state
     * for.  Has no meaning if the client has not been configured to rejoin sessions.  Must be non-zero in order to
     * successfully rejoin a session.
     *
     * If the responding CONNACK contains a session expiry property value, then that is the negotiated session expiry
     * value.  Otherwise, the session expiry sent by the client is the negotiated value.
     *
     * See [MQTT5 Session Expiry Interval](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901048)
     */
    sessionExpiryIntervalSeconds?: number;

    /**
     * If set to true, requests that the server send response information in the subsequent CONNACK.  This response
     * information may be used to set up request-response implementations over MQTT, but doing so is outside
     * the scope of the MQTT5 spec and client.
     *
     * See [MQTT5 Request Response Information](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901052)
     */
    requestResponseInformation?: boolean;

    /**
     * If set to true, requests that the server send additional diagnostic information (via response string or
     * user properties) in DISCONNECT or CONNACK packets from the server.
     *
     * See [MQTT5 Request Problem Information](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901053)
     */
    requestProblemInformation?: boolean;

    /**
     * Notifies the server of the maximum number of in-flight Qos 1 and 2 messages the client is willing to handle.  If
     * omitted, then no limit is requested.
     *
     * See [MQTT5 Receive Maximum](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901049)
     */
    receiveMaximum?: number;

    /**
     * Notifies the server of the maximum packet size the client is willing to handle.  If
     * omitted, then no limit beyond the natural limits of MQTT packet size is requested.
     *
     * See [MQTT5 Maximum Packet Size](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901050)
     */
    maximumPacketSizeBytes?: number;

    /**
     * A time interval, in seconds, that the server should wait (for a session reconnection) before sending the
     * will message associated with the connection's session.  If omitted, the server will send the will when the
     * associated session is destroyed.  If the session is destroyed before a will delay interval has elapsed, then
     * the will must be sent at the time of session destruction.
     *
     * See [MQTT5 Will Delay Interval](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901062)
     */
    willDelayIntervalSeconds?: number;

    /**
     * The definition of a message to be published when the connection's session is destroyed by the server or when
     * the will delay interval has elapsed, whichever comes first.  If undefined, then nothing will be sent.
     *
     * See [MQTT5 Will](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901040)
     */
    will?: PublishPacket;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901054)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 CONNACK](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901074) packet.
 */
export interface ConnackPacket extends IPacket {

    /**
     * True if the client rejoined an existing session on the server, false otherwise.
     *
     * See [MQTT5 Session Present](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901078)
     */
    sessionPresent : boolean;

    /**
     * Indicates either success or the reason for failure for the connection attempt.
     *
     * See [MQTT5 Connect Reason Code](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901079)
     */
    reasonCode : ConnectReasonCode;

    /**
     * A time interval, in seconds, that the server will persist this connection's MQTT session state
     * for.  If present, this value overrides any session expiry specified in the preceding CONNECT packet.
     *
     * See [MQTT5 Session Expiry Interval](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901082)
     */
    sessionExpiryInterval?: number;

    /**
     * The maximum amount of in-flight QoS 1 or 2 messages that the server is willing to handle at once.  If omitted,
     * the limit is based on the valid MQTT packet id space (65535).
     *
     * See [MQTT5 Receive Maximum](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901083)
     */
    receiveMaximum?: number;

    /**
     * The maximum message delivery quality of service that the server will allow on this connection.
     *
     * See [MQTT5 Maximum QoS](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901084)
     */
    maximumQos?: QoS;

    /**
     * Indicates whether the server supports retained messages.  If undefined, retained messages are
     * supported.
     *
     * See [MQTT5 Retain Available](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901085)
     */
    retainAvailable?: boolean;

    /**
     * Specifies the maximum packet size, in bytes, that the server is willing to accept.  If undefined, there
     * is no limit beyond what is imposed by the MQTT spec itself.
     *
     * See [MQTT5 Maximum Packet Size](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901086)
     */
    maximumPacketSize?: number;

    /**
     * Specifies a client identifier assigned to this connection by the server.  Only valid when the client id of
     * the preceding CONNECT packet was left empty.
     *
     * See [MQTT5 Assigned Client Identifier](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901087)
     */
    assignedClientIdentifier?: string;

    /**
     * Specifies the maximum topic alias value that the server will accept from the client.
     *
     * See [MQTT5 Topic Alias Maximum](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901088)
     */
    topicAliasMaximum?: number;

    /**
     * Additional diagnostic information about the result of the connection attempt.
     *
     * See [MQTT5 Reason String](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901089)
     */
    reasonString?: string;

    /**
     * Indicates whether the server supports wildcard subscriptions.  If undefined, wildcard subscriptions
     * are supported.
     *
     * See [MQTT5 Wildcard Subscriptions Available](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901091)
     */
    wildcardSubscriptionsAvailable?: boolean;

    /**
     * Indicates whether the server supports subscription identifiers.  If undefined, subscription identifiers
     * are supported.
     *
     * See [MQTT5 Subscription Identifiers Available](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901092)
     */
    subscriptionIdentifiersAvailable?: boolean;

    /**
     * Indicates whether the server supports shared subscription topic filters.  If undefined, shared subscriptions
     * are supported.
     *
     * See [MQTT5 Shared Subscriptions Available](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901093)
     */
    sharedSubscriptionsAvailable?: boolean;

    /**
     * Server-requested override of the keep alive interval, in seconds.  If undefined, the keep alive value sent
     * by the client should be used.
     *
     * See [MQTT5 Server Keep Alive](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901094)
     */
    serverKeepAlive?: number;

    /**
     * A value that can be used in the creation of a response topic associated with this connection.  MQTT5-based
     * request/response is outside the purview of the MQTT5 spec and this client.
     *
     * See [MQTT5 Response Information](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901095)
     */
    responseInformation?: string;

    /**
     * Property indicating an alternate server that the client may temporarily or permanently attempt
     * to connect to instead of the configured endpoint.  Will only be set if the reason code indicates another
     * server may be used (ServerMoved, UseAnotherServer).
     *
     * See [MQTT5 Server Reference](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901096)
     */
    serverReference?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901090)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 DISCONNECT](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901205) packet.
 */
export interface DisconnectPacket extends IPacket {

    /**
     * Value indicating the reason that the sender is closing the connection
     *
     * See [MQTT5 Disconnect Reason Code](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901208)
     */
    reasonCode: DisconnectReasonCode;

    /**
     * Requests a change to the session expiry interval negotiated at connection time as part of the disconnect.  Only
     * valid for  DISCONNECT packets sent from client to server.  It is not valid to attempt to change session expiry
     * from zero to a non-zero value.
     *
     * See [MQTT5 Session Expiry Interval](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901211)
     */
    sessionExpiryIntervalSeconds?: number;

    /**
     * Additional diagnostic information about the reason that the sender is closing the connection
     *
     * See [MQTT5 Reason String](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901212)
     */
    reasonString?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901213)
     */
    userProperties?: Array<UserProperty>;

    /**
     * Property indicating an alternate server that the client may temporarily or permanently attempt
     * to connect to instead of the configured endpoint.  Will only be set if the reason code indicates another
     * server may be used (ServerMoved, UseAnotherServer).
     *
     * See [MQTT5 Server Reference](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901214)
     */
    serverReference?: string;
}

/**
 * Configures a single subscription within a Subscribe operation
 *
 * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
 */
export interface Subscription {
    /**
     * Topic filter to subscribe to
     *
     * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
     */
    topicFilter : string;

    /**
     * Maximum QoS on which the subscriber will accept publish messages.  Negotiated QoS may be different.
     *
     * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
     */
    qos : QoS;

    /**
     * Should the server not send publishes to a client when that client was the one who sent the publish?  If
     * undefined, this is assumed to be false.
     *
     * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
     */
    noLocal? : boolean;

    /**
     * Should messages sent due to this subscription keep the retain flag preserved on the message?  If undefined,
     * this is assumed to be false.
     *
     * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
     */
    retainAsPublished?: boolean;

    /**
     * Should retained messages on matching topics be sent in reaction to this subscription?  If undefined,
     * this is assumed to be RetainHandlingType.SendOnSubscribe.
     *
     * See [MQTT5 Subscription Options](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169)
     */
    retainHandlingType?: RetainHandlingType;
}

/**
 * Data model of an [MQTT5 SUBSCRIBE](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901161) packet.
 */
export interface SubscribePacket extends IPacket {

    /**
     * List of topic filter subscriptions that the client wishes to listen to
     *
     * See [MQTT5 Subscribe Payload](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901168)
     */
    subscriptions: Array<Subscription>;

    /**
     * A positive integer to associate with all subscriptions in this request.  Publish packets that match
     * a subscription in this request should include this identifier in the resulting message.
     *
     * See [MQTT5 Subscription Identifier](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901166)
     */
    subscriptionIdentifier?: number;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901167)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 SUBACK](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901171) packet.
 */
export interface SubackPacket extends IPacket {

    /**
     * A list of reason codes indicating the result of each individual subscription entry in the
     * associated SUBSCRIBE packet.
     *
     * See [MQTT5 Suback Payload](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901178)
     */
    reasonCodes: Array<SubackReasonCode>;

    /**
     * Additional diagnostic information about the result of the SUBSCRIBE attempt.
     *
     * See [MQTT5 Reason String](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901176)
     */
    reasonString?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901177)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 UNSUBSCRIBE](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901179) packet.
 */
export interface UnsubscribePacket extends IPacket {

    /**
     * List of topic filters that the client wishes to unsubscribe from.
     *
     * See [MQTT5 Unsubscribe Payload](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901185)
     */
    topicFilters: Array<string>;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901184)
     */
    userProperties?: Array<UserProperty>;
}

/**
 * Data model of an [MQTT5 UNSUBACK](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901187) packet.
 */
export interface UnsubackPacket extends IPacket {

    /**
     * A list of reason codes indicating the result of unsubscribing from each individual topic filter entry in the
     * associated UNSUBSCRIBE packet.
     *
     * See [MQTT5 Unsuback Payload](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901194)
     */
    reasonCodes: Array<UnsubackReasonCode>;

    /**
     * Additional diagnostic information about the result of the UNSUBSCRIBE attempt.
     *
     * See [MQTT5 Reason String](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901192)
     */
    reasonString?: string;

    /**
     * Set of MQTT5 user properties included with the packet.
     *
     * See [MQTT5 User Property](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901193)
     */
    userProperties?: Array<UserProperty>;
}
