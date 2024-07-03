"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboundTopicAliasBehaviorType = exports.OutboundTopicAliasBehaviorType = exports.RetryJitterType = exports.ClientSessionBehavior = void 0;
/**
 * Controls how the MQTT5 client should behave with respect to MQTT sessions.
 */
var ClientSessionBehavior;
(function (ClientSessionBehavior) {
    /** Maps to Clean */
    ClientSessionBehavior[ClientSessionBehavior["Default"] = 0] = "Default";
    /**
     * Always ask for a clean session when connecting
     */
    ClientSessionBehavior[ClientSessionBehavior["Clean"] = 1] = "Clean";
    /**
     * Always attempt to rejoin an existing session after an initial connection success.
     *
     * Session rejoin requires an appropriate non-zero session expiry interval in the client's CONNECT options.
     */
    ClientSessionBehavior[ClientSessionBehavior["RejoinPostSuccess"] = 2] = "RejoinPostSuccess";
    /**
     * Always attempt to rejoin an existing session.  Since the client does not yet support durable session persistence,
     * this option is not guaranteed to be spec compliant because any unacknowledged qos1 publishes (which are
     * part of the client session state) will not be present on the initial connection.  Until we support
     * durable session resumption, this option is technically spec-breaking, but useful.
     */
    ClientSessionBehavior[ClientSessionBehavior["RejoinAlways"] = 3] = "RejoinAlways";
})(ClientSessionBehavior = exports.ClientSessionBehavior || (exports.ClientSessionBehavior = {}));
/**
 * Controls how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
 * timepoints for a large set of reconnecting clients.
 *
 * See [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
 */
var RetryJitterType;
(function (RetryJitterType) {
    /**
     * Maps to Full
     */
    RetryJitterType[RetryJitterType["Default"] = 0] = "Default";
    /**
     * Do not perform any randomization on the reconnect delay:
     * ```NextReconnectDelay = CurrentExponentialBackoffValue```
     */
    RetryJitterType[RetryJitterType["None"] = 1] = "None";
    /**
     * Fully random between no delay and the current exponential backoff value.
     * ```NextReconnectDelay = Random(0, CurrentExponentialBackoffValue)```
     */
    RetryJitterType[RetryJitterType["Full"] = 2] = "Full";
    /**
     * ```NextReconnectDelay = Min(MaxReconnectDelay, Random(MinReconnectDelay, 3 * CurrentReconnectDelay)```
     */
    RetryJitterType[RetryJitterType["Decorrelated"] = 3] = "Decorrelated";
})(RetryJitterType = exports.RetryJitterType || (exports.RetryJitterType = {}));
/**
 * An enumeration that controls how the client applies topic aliasing to outbound publish packets.
 *
 * Topic alias behavior is described in https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901113
 */
var OutboundTopicAliasBehaviorType;
(function (OutboundTopicAliasBehaviorType) {
    /**
     * Maps to Disabled.  This keeps the client from being broken (by default) if the broker
     * topic aliasing implementation has a problem.
     */
    OutboundTopicAliasBehaviorType[OutboundTopicAliasBehaviorType["Default"] = 0] = "Default";
    /**
     * Outbound aliasing is the user's responsibility.  Client will cache and use
     * previously-established aliases if they fall within the negotiated limits of the connection.
     *
     * The user must still always submit a full topic in their publishes because disconnections disrupt
     * topic alias mappings unpredictably.  The client will properly use a requested alias when the most-recently-seen
     * binding for a topic alias value matches the alias and topic in the publish packet.
     */
    OutboundTopicAliasBehaviorType[OutboundTopicAliasBehaviorType["Manual"] = 1] = "Manual";
    /**
     * (Recommended) The client will use an LRU cache to drive alias usage.
     *
     * Manually setting a topic alias will be ignored (the LRU cache is authoritative)
     */
    OutboundTopicAliasBehaviorType[OutboundTopicAliasBehaviorType["LRU"] = 2] = "LRU";
    /**
     * Completely disable outbound topic aliasing.
     */
    OutboundTopicAliasBehaviorType[OutboundTopicAliasBehaviorType["Disabled"] = 3] = "Disabled";
})(OutboundTopicAliasBehaviorType = exports.OutboundTopicAliasBehaviorType || (exports.OutboundTopicAliasBehaviorType = {}));
/**
 * An enumeration that controls whether or not the client allows the broker to send publishes that use topic
 * aliasing.
 *
 * Topic alias behavior is described in https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901113
 */
var InboundTopicAliasBehaviorType;
(function (InboundTopicAliasBehaviorType) {
    /**
     * Maps to Disabled.  This keeps the client from being broken (by default) if the broker
     * topic aliasing implementation has a problem.
     */
    InboundTopicAliasBehaviorType[InboundTopicAliasBehaviorType["Default"] = 0] = "Default";
    /**
     * Allow the server to send PUBLISH packets to the client that use topic aliasing
     */
    InboundTopicAliasBehaviorType[InboundTopicAliasBehaviorType["Enabled"] = 1] = "Enabled";
    /**
     * Forbid the server from sending PUBLISH packets to the client that use topic aliasing
     */
    InboundTopicAliasBehaviorType[InboundTopicAliasBehaviorType["Disabled"] = 2] = "Disabled";
})(InboundTopicAliasBehaviorType = exports.InboundTopicAliasBehaviorType || (exports.InboundTopicAliasBehaviorType = {}));
//# sourceMappingURL=mqtt5.js.map