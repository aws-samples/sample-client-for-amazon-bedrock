"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketType = exports.RetainHandlingType = exports.QoS = exports.PayloadFormatIndicator = exports.isSuccessfulPubackReasonCode = exports.PubackReasonCode = exports.isSuccessfulUnsubackReasonCode = exports.UnsubackReasonCode = exports.isSuccessfulSubackReasonCode = exports.SubackReasonCode = exports.isSuccessfulDisconnectReasonCode = exports.DisconnectReasonCode = exports.isSuccessfulConnectReasonCode = exports.ConnectReasonCode = void 0;
/**
 * Server return code for connect attempts.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901079) encoding values.
 */
var ConnectReasonCode;
(function (ConnectReasonCode) {
    /**
     * Returned when the connection is accepted.
     */
    ConnectReasonCode[ConnectReasonCode["Success"] = 0] = "Success";
    /**
     * Returned when the server has a failure but does not want to specify a reason or none
     * of the other reason codes apply.
     */
    ConnectReasonCode[ConnectReasonCode["UnspecifiedError"] = 128] = "UnspecifiedError";
    /**
     * Returned when data in the CONNECT packet could not be correctly parsed by the server.
     */
    ConnectReasonCode[ConnectReasonCode["MalformedPacket"] = 129] = "MalformedPacket";
    /**
     * Returned when data in the CONNECT packet does not conform to the MQTT5 specification requirements.
     */
    ConnectReasonCode[ConnectReasonCode["ProtocolError"] = 130] = "ProtocolError";
    /**
     * Returned when the CONNECT packet is valid but was not accepted by the server.
     */
    ConnectReasonCode[ConnectReasonCode["ImplementationSpecificError"] = 131] = "ImplementationSpecificError";
    /**
     * Returned when the server does not support MQTT5 protocol version specified in the connection.
     */
    ConnectReasonCode[ConnectReasonCode["UnsupportedProtocolVersion"] = 132] = "UnsupportedProtocolVersion";
    /**
     * Returned when the client identifier in the CONNECT packet is a valid string but not one that
     * is allowed on the server.
     */
    ConnectReasonCode[ConnectReasonCode["ClientIdentifierNotValid"] = 133] = "ClientIdentifierNotValid";
    /**
     * Returned when the server does not accept the username and/or password specified by the client
     * in the connection packet.
     */
    ConnectReasonCode[ConnectReasonCode["BadUsernameOrPassword"] = 134] = "BadUsernameOrPassword";
    /**
     * Returned when the client is not authorized to connect to the server.
     */
    ConnectReasonCode[ConnectReasonCode["NotAuthorized"] = 135] = "NotAuthorized";
    /**
     * Returned when the MQTT5 server is not available.
     */
    ConnectReasonCode[ConnectReasonCode["ServerUnavailable"] = 136] = "ServerUnavailable";
    /**
     * Returned when the server is too busy to make a connection. It is recommended that the client try again later.
     */
    ConnectReasonCode[ConnectReasonCode["ServerBusy"] = 137] = "ServerBusy";
    /**
     * Returned when the client has been banned by the server.
     */
    ConnectReasonCode[ConnectReasonCode["Banned"] = 138] = "Banned";
    /**
     * Returned when the authentication method used in the connection is either not supported on the server or it does
     * not match the authentication method currently in use in the CONNECT packet.
     */
    ConnectReasonCode[ConnectReasonCode["BadAuthenticationMethod"] = 140] = "BadAuthenticationMethod";
    /**
     * Returned when the Will topic name sent in the connection packet is correctly formed, but is not accepted by
     * the server.
     */
    ConnectReasonCode[ConnectReasonCode["TopicNameInvalid"] = 144] = "TopicNameInvalid";
    /**
     * Returned when the connection packet exceeded the maximum permissible size on the server.
     */
    ConnectReasonCode[ConnectReasonCode["PacketTooLarge"] = 149] = "PacketTooLarge";
    /**
     * Returned when the quota limits set on the server have been met and/or exceeded.
     */
    ConnectReasonCode[ConnectReasonCode["QuotaExceeded"] = 151] = "QuotaExceeded";
    /**
     * Returned when the Will payload in the CONNECT packet does not match the specified payload format indicator.
     */
    ConnectReasonCode[ConnectReasonCode["PayloadFormatInvalid"] = 153] = "PayloadFormatInvalid";
    /**
     * Returned when the server does not retain messages but the connection packet on the client had Will retain enabled.
     */
    ConnectReasonCode[ConnectReasonCode["RetainNotSupported"] = 154] = "RetainNotSupported";
    /**
     * Returned when the server does not support the QOS setting in the Will QOS in the connection packet.
     */
    ConnectReasonCode[ConnectReasonCode["QosNotSupported"] = 155] = "QosNotSupported";
    /**
     * Returned when the server is telling the client to temporarily use another server instead of the one they
     * are trying to connect to.
     */
    ConnectReasonCode[ConnectReasonCode["UseAnotherServer"] = 156] = "UseAnotherServer";
    /**
     * Returned when the server is telling the client to permanently use another server instead of the one they
     * are trying to connect to.
     */
    ConnectReasonCode[ConnectReasonCode["ServerMoved"] = 157] = "ServerMoved";
    /**
     * Returned when the server connection rate limit has been exceeded.
     */
    ConnectReasonCode[ConnectReasonCode["ConnectionRateExceeded"] = 159] = "ConnectionRateExceeded";
})(ConnectReasonCode = exports.ConnectReasonCode || (exports.ConnectReasonCode = {}));
/**
 * Determines if a reason code represents a successful connect operation
 *
 * @param reasonCode reason code to check success for
 */
function isSuccessfulConnectReasonCode(reasonCode) {
    return reasonCode < 128;
}
exports.isSuccessfulConnectReasonCode = isSuccessfulConnectReasonCode;
/**
 * Reason code inside DISCONNECT packets.  Helps determine why a connection was terminated.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901208) encoding values.
 */
var DisconnectReasonCode;
(function (DisconnectReasonCode) {
    /**
     * Returned when the remote endpoint wishes to disconnect normally. Will not trigger the publish of a Will message if a
     * Will message was configured on the connection.
     *
     * May be sent by the client or server.
     */
    DisconnectReasonCode[DisconnectReasonCode["NormalDisconnection"] = 0] = "NormalDisconnection";
    /**
     * Returns that the client wants to disconnect but requires that the server publish the Will message configured
     * on the connection.
     *
     * May only be sent by the client.
     */
    DisconnectReasonCode[DisconnectReasonCode["DisconnectWithWillMessage"] = 4] = "DisconnectWithWillMessage";
    /**
     * Returned when the connection was closed but the sender does not want to specify a reason or none
     * of the other reason codes apply.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["UnspecifiedError"] = 128] = "UnspecifiedError";
    /**
     * Indicates the remote endpoint received a packet that does not conform to the MQTT specification.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["MalformedPacket"] = 129] = "MalformedPacket";
    /**
     * Returned when an unexpected or out-of-order packet was received by the remote endpoint.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ProtocolError"] = 130] = "ProtocolError";
    /**
     * Returned when a valid packet was received by the remote endpoint, but could not be processed by the current implementation.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ImplementationSpecificError"] = 131] = "ImplementationSpecificError";
    /**
     * Returned when the remote endpoint received a packet that represented an operation that was not authorized within
     * the current connection.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["NotAuthorized"] = 135] = "NotAuthorized";
    /**
     * Returned when the server is busy and cannot continue processing packets from the client.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ServerBusy"] = 137] = "ServerBusy";
    /**
     * Returned when the server is shutting down.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ServerShuttingDown"] = 139] = "ServerShuttingDown";
    /**
     * Returned when the server closes the connection because no packet from the client has been received in
     * 1.5 times the KeepAlive time set when the connection was established.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["KeepAliveTimeout"] = 141] = "KeepAliveTimeout";
    /**
     * Returned when the server has established another connection with the same client ID as a client's current
     * connection, causing the current client to become disconnected.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["SessionTakenOver"] = 142] = "SessionTakenOver";
    /**
     * Returned when the topic filter name is correctly formed but not accepted by the server.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["TopicFilterInvalid"] = 143] = "TopicFilterInvalid";
    /**
     * Returned when topic name is correctly formed, but is not accepted.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["TopicNameInvalid"] = 144] = "TopicNameInvalid";
    /**
     * Returned when the remote endpoint reached a state where there were more in-progress QoS1+ publishes then the
     * limit it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ReceiveMaximumExceeded"] = 147] = "ReceiveMaximumExceeded";
    /**
     * Returned when the remote endpoint receives a PUBLISH packet that contained a topic alias greater than the
     * maximum topic alias limit that it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["TopicAliasInvalid"] = 148] = "TopicAliasInvalid";
    /**
     * Returned when the remote endpoint received a packet whose size was greater than the maximum packet size limit
     * it established for itself when the connection was opened.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["PacketTooLarge"] = 149] = "PacketTooLarge";
    /**
     * Returned when the remote endpoint's incoming data rate was too high.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["MessageRateTooHigh"] = 150] = "MessageRateTooHigh";
    /**
     * Returned when an internal quota of the remote endpoint was exceeded.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["QuotaExceeded"] = 151] = "QuotaExceeded";
    /**
     * Returned when the connection was closed due to an administrative action.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["AdministrativeAction"] = 152] = "AdministrativeAction";
    /**
     * Returned when the remote endpoint received a packet where payload format did not match the format specified
     * by the payload format indicator.
     *
     * May be sent by the client or the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["PayloadFormatInvalid"] = 153] = "PayloadFormatInvalid";
    /**
     * Returned when the server does not support retained messages.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["RetainNotSupported"] = 154] = "RetainNotSupported";
    /**
     * Returned when the client sends a QOS that is greater than the maximum QOS established when the connection was
     * opened.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["QosNotSupported"] = 155] = "QosNotSupported";
    /**
     * Returned by the server to tell the client to temporarily use a different server.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["UseAnotherServer"] = 156] = "UseAnotherServer";
    /**
     * Returned by the server to tell the client to permanently use a different server.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ServerMoved"] = 157] = "ServerMoved";
    /**
     * Returned by the server to tell the client that shared subscriptions are not supported on the server.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["SharedSubscriptionsNotSupported"] = 158] = "SharedSubscriptionsNotSupported";
    /**
     * Returned when the server disconnects the client due to the connection rate being too high.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["ConnectionRateExceeded"] = 159] = "ConnectionRateExceeded";
    /**
     * Returned by the server when the maximum connection time authorized for the connection was exceeded.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["MaximumConnectTime"] = 160] = "MaximumConnectTime";
    /**
     * Returned by the server when it received a SUBSCRIBE packet with a subscription identifier, but the server does
     * not support subscription identifiers.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["SubscriptionIdentifiersNotSupported"] = 161] = "SubscriptionIdentifiersNotSupported";
    /**
     * Returned by the server when it received a SUBSCRIBE packet with a wildcard topic filter, but the server does
     * not support wildcard topic filters.
     *
     * May only be sent by the server.
     */
    DisconnectReasonCode[DisconnectReasonCode["WildcardSubscriptionsNotSupported"] = 162] = "WildcardSubscriptionsNotSupported";
})(DisconnectReasonCode = exports.DisconnectReasonCode || (exports.DisconnectReasonCode = {}));
/**
 * Determines if a reason code represents a successful disconnect operation
 *
 * @param reasonCode reason code to check success for
 */
function isSuccessfulDisconnectReasonCode(reasonCode) {
    return reasonCode < 128;
}
exports.isSuccessfulDisconnectReasonCode = isSuccessfulDisconnectReasonCode;
/**
 * Reason codes inside SUBACK packet payloads that specify the results for each subscription in the associated
 * SUBSCRIBE packet.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901178) encoding values.
 */
var SubackReasonCode;
(function (SubackReasonCode) {
    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 0.
     */
    SubackReasonCode[SubackReasonCode["GrantedQoS0"] = 0] = "GrantedQoS0";
    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 1.
     */
    SubackReasonCode[SubackReasonCode["GrantedQoS1"] = 1] = "GrantedQoS1";
    /**
     * Returned when the subscription was accepted and the maximum QOS sent will be QOS 2.
     */
    SubackReasonCode[SubackReasonCode["GrantedQoS2"] = 2] = "GrantedQoS2";
    /**
     * Returned when the connection was closed but the sender does not want to specify a reason or none
     * of the other reason codes apply.
     */
    SubackReasonCode[SubackReasonCode["UnspecifiedError"] = 128] = "UnspecifiedError";
    /**
     * Returned when the subscription was valid but the server did not accept it.
     */
    SubackReasonCode[SubackReasonCode["ImplementationSpecificError"] = 131] = "ImplementationSpecificError";
    /**
     * Returned when the client was not authorized to make the subscription on the server.
     */
    SubackReasonCode[SubackReasonCode["NotAuthorized"] = 135] = "NotAuthorized";
    /**
     * Returned when the subscription topic filter was correctly formed but not allowed for the client.
     */
    SubackReasonCode[SubackReasonCode["TopicFilterInvalid"] = 143] = "TopicFilterInvalid";
    /**
     * Returned when the packet identifier was already in use on the server.
     */
    SubackReasonCode[SubackReasonCode["PacketIdentifierInUse"] = 145] = "PacketIdentifierInUse";
    /**
     * Returned when a subscribe-related quota set on the server was exceeded.
     */
    SubackReasonCode[SubackReasonCode["QuotaExceeded"] = 151] = "QuotaExceeded";
    /**
     * Returned when the subscription's topic filter was a shared subscription and the server does not support
     * shared subscriptions.
     */
    SubackReasonCode[SubackReasonCode["SharedSubscriptionsNotSupported"] = 158] = "SharedSubscriptionsNotSupported";
    /**
     * Returned when the SUBSCRIBE packet contained a subscription identifier and the server does not support
     * subscription identifiers.
     */
    SubackReasonCode[SubackReasonCode["SubscriptionIdentifiersNotSupported"] = 161] = "SubscriptionIdentifiersNotSupported";
    /**
     * Returned when the subscription's topic filter contains a wildcard but the server does not support
     * wildcard subscriptions.
     */
    SubackReasonCode[SubackReasonCode["WildcardSubscriptionsNotSupported"] = 162] = "WildcardSubscriptionsNotSupported";
})(SubackReasonCode = exports.SubackReasonCode || (exports.SubackReasonCode = {}));
/**
 * Determines if a reason code represents a successful subscribe operation
 *
 * @param reasonCode reason code to check success for
 */
function isSuccessfulSubackReasonCode(reasonCode) {
    return reasonCode < 128;
}
exports.isSuccessfulSubackReasonCode = isSuccessfulSubackReasonCode;
/**
 * Reason codes inside UNSUBACK packet payloads that specify the results for each topic filter in the associated
 * UNSUBSCRIBE packet.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901194) encoding values.
 */
var UnsubackReasonCode;
(function (UnsubackReasonCode) {
    /**
     * Returned when the unsubscribe was successful and the client is no longer subscribed to the topic filter on the server.
     */
    UnsubackReasonCode[UnsubackReasonCode["Success"] = 0] = "Success";
    /**
     * Returned when the topic filter did not match one of the client's existing subscriptions on the server.
     */
    UnsubackReasonCode[UnsubackReasonCode["NoSubscriptionExisted"] = 17] = "NoSubscriptionExisted";
    /**
     * Returned when the unsubscribe of the topic filter was not accepted and the server does not want to specify a
     * reason or none of the other reason codes apply.
     */
    UnsubackReasonCode[UnsubackReasonCode["UnspecifiedError"] = 128] = "UnspecifiedError";
    /**
     * Returned when the topic filter was valid but the server does not accept an unsubscribe for it.
     */
    UnsubackReasonCode[UnsubackReasonCode["ImplementationSpecificError"] = 131] = "ImplementationSpecificError";
    /**
     * Returned when the client was not authorized to unsubscribe from that topic filter on the server.
     */
    UnsubackReasonCode[UnsubackReasonCode["NotAuthorized"] = 135] = "NotAuthorized";
    /**
     * Returned when the topic filter was correctly formed but is not allowed for the client on the server.
     */
    UnsubackReasonCode[UnsubackReasonCode["TopicFilterInvalid"] = 143] = "TopicFilterInvalid";
    /**
     * Returned when the packet identifier was already in use on the server.
     */
    UnsubackReasonCode[UnsubackReasonCode["PacketIdentifierInUse"] = 145] = "PacketIdentifierInUse";
})(UnsubackReasonCode = exports.UnsubackReasonCode || (exports.UnsubackReasonCode = {}));
/**
 * Determines if a reason code represents a successful unsubscribe operation
 *
 * @param reasonCode reason code to check success for
 */
function isSuccessfulUnsubackReasonCode(reasonCode) {
    return reasonCode < 128;
}
exports.isSuccessfulUnsubackReasonCode = isSuccessfulUnsubackReasonCode;
/**
 * Reason code inside PUBACK packets that indicates the result of the associated PUBLISH request.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901124) encoding values.
 */
var PubackReasonCode;
(function (PubackReasonCode) {
    /**
     * Returned when the (QoS 1) publish was accepted by the recipient.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["Success"] = 0] = "Success";
    /**
     * Returned when the (QoS 1) publish was accepted but there were no matching subscribers.
     *
     * May only be sent by the server.
     */
    PubackReasonCode[PubackReasonCode["NoMatchingSubscribers"] = 16] = "NoMatchingSubscribers";
    /**
     * Returned when the (QoS 1) publish was not accepted and the receiver does not want to specify a reason or none
     * of the other reason codes apply.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["UnspecifiedError"] = 128] = "UnspecifiedError";
    /**
     * Returned when the (QoS 1) publish was valid but the receiver was not willing to accept it.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["ImplementationSpecificError"] = 131] = "ImplementationSpecificError";
    /**
     * Returned when the (QoS 1) publish was not authorized by the receiver.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["NotAuthorized"] = 135] = "NotAuthorized";
    /**
     * Returned when the topic name was valid but the receiver was not willing to accept it.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["TopicNameInvalid"] = 144] = "TopicNameInvalid";
    /**
     * Returned when the packet identifier used in the associated PUBLISH was already in use.
     * This can indicate a mismatch in the session state between client and server.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["PacketIdentifierInUse"] = 145] = "PacketIdentifierInUse";
    /**
     * Returned when the associated PUBLISH failed because an internal quota on the recipient was exceeded.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["QuotaExceeded"] = 151] = "QuotaExceeded";
    /**
     * Returned when the PUBLISH packet's payload format did not match its payload format indicator property.
     *
     * May be sent by the client or the server.
     */
    PubackReasonCode[PubackReasonCode["PayloadFormatInvalid"] = 153] = "PayloadFormatInvalid";
})(PubackReasonCode = exports.PubackReasonCode || (exports.PubackReasonCode = {}));
/**
 * Determines if a reason code represents a successful QoS 1 publish operation
 *
 * @param reasonCode reason code to check success for
 */
function isSuccessfulPubackReasonCode(reasonCode) {
    return reasonCode < 128;
}
exports.isSuccessfulPubackReasonCode = isSuccessfulPubackReasonCode;
/**
 * Optional property describing a PUBLISH payload's format.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901111) encoding values.
 */
var PayloadFormatIndicator;
(function (PayloadFormatIndicator) {
    /**
     * The payload is arbitrary binary data
     */
    PayloadFormatIndicator[PayloadFormatIndicator["Bytes"] = 0] = "Bytes";
    /**
     * The payload is a well-formed utf-8 string value.
     */
    PayloadFormatIndicator[PayloadFormatIndicator["Utf8"] = 1] = "Utf8";
})(PayloadFormatIndicator = exports.PayloadFormatIndicator || (exports.PayloadFormatIndicator = {}));
/**
 * MQTT message delivery quality of service.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901234) encoding values.
 */
var QoS;
(function (QoS) {
    /**
     * The message is delivered according to the capabilities of the underlying network. No response is sent by the
     * receiver and no retry is performed by the sender. The message arrives at the receiver either once or not at all.
     */
    QoS[QoS["AtMostOnce"] = 0] = "AtMostOnce";
    /**
     * A level of service that ensures that the message arrives at the receiver at least once.
     */
    QoS[QoS["AtLeastOnce"] = 1] = "AtLeastOnce";
    /**
     * A level of service that ensures that the message arrives at the receiver exactly once.
     */
    QoS[QoS["ExactlyOnce"] = 2] = "ExactlyOnce";
})(QoS = exports.QoS || (exports.QoS = {}));
/**
 * Configures how retained messages should be handled when subscribing with a topic filter that matches topics with
 * associated retained messages.
 *
 * Enum values match [MQTT5 spec](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901169) encoding values.
 */
var RetainHandlingType;
(function (RetainHandlingType) {
    /**
     * The server should always send all retained messages on topics that match a subscription's filter.
     */
    RetainHandlingType[RetainHandlingType["SendOnSubscribe"] = 0] = "SendOnSubscribe";
    /**
     * The server should send retained messages on topics that match the subscription's filter, but only for the
     * first matching subscription, per session.
     */
    RetainHandlingType[RetainHandlingType["SendOnSubscribeIfNew"] = 1] = "SendOnSubscribeIfNew";
    /**
     * Subscriptions must not trigger any retained message publishes from the server.
     */
    RetainHandlingType[RetainHandlingType["DontSend"] = 2] = "DontSend";
})(RetainHandlingType = exports.RetainHandlingType || (exports.RetainHandlingType = {}));
/**
 * Packet type indicator that allows for basic polymorphism with user-received packets.  Enum values
 * match the mqtt spec's [packet type encoding](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901022) values.
 */
var PacketType;
(function (PacketType) {
    PacketType[PacketType["Connect"] = 1] = "Connect";
    PacketType[PacketType["Connack"] = 2] = "Connack";
    PacketType[PacketType["Publish"] = 3] = "Publish";
    PacketType[PacketType["Puback"] = 4] = "Puback";
    PacketType[PacketType["Pubrec"] = 5] = "Pubrec";
    PacketType[PacketType["Pubrel"] = 6] = "Pubrel";
    PacketType[PacketType["Pubcomp"] = 7] = "Pubcomp";
    PacketType[PacketType["Subscribe"] = 8] = "Subscribe";
    PacketType[PacketType["Suback"] = 9] = "Suback";
    PacketType[PacketType["Unsubscribe"] = 10] = "Unsubscribe";
    PacketType[PacketType["Unsuback"] = 11] = "Unsuback";
    PacketType[PacketType["Pingreq"] = 12] = "Pingreq";
    PacketType[PacketType["Pingresp"] = 13] = "Pingresp";
    PacketType[PacketType["Disconnect"] = 14] = "Disconnect";
    PacketType[PacketType["Auth"] = 15] = "Auth";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
//# sourceMappingURL=mqtt5_packet.js.map