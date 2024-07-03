"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RECONNECT_MIN_SEC = exports.DEFAULT_RECONNECT_MAX_SEC = exports.MqttWill = exports.QoS = void 0;
/**
 * Quality of service control for mqtt publish operations
 *
 * @category MQTT
 */
var QoS;
(function (QoS) {
    /**
     * QoS 0 - At most once delivery
     * The message is delivered according to the capabilities of the underlying network.
     * No response is sent by the receiver and no retry is performed by the sender.
     * The message arrives at the receiver either once or not at all.
     */
    QoS[QoS["AtMostOnce"] = 0] = "AtMostOnce";
    /**
     * QoS 1 - At least once delivery
     * This quality of service ensures that the message arrives at the receiver at least once.
     */
    QoS[QoS["AtLeastOnce"] = 1] = "AtLeastOnce";
    /**
     * QoS 2 - Exactly once delivery

     * This is the highest quality of service, for use when neither loss nor
     * duplication of messages are acceptable. There is an increased overhead
     * associated with this quality of service.

     * Note that, while this client supports QoS 2, the AWS IoT Core service
     * does not support QoS 2 at time of writing (May 2020).
     */
    QoS[QoS["ExactlyOnce"] = 2] = "ExactlyOnce";
})(QoS = exports.QoS || (exports.QoS = {}));
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
class MqttWill {
    constructor(
    /** Topic to publish Will message on. */
    topic, 
    /** QoS used when publishing the Will message. */
    qos, 
    /** Content of Will message. */
    payload, 
    /** Whether the Will message is to be retained when it is published. */
    retain = false) {
        this.topic = topic;
        this.qos = qos;
        this.payload = payload;
        this.retain = retain;
    }
}
exports.MqttWill = MqttWill;
/**
 * Const value for max reconnection back off time
 *
 * @category MQTT
 */
exports.DEFAULT_RECONNECT_MAX_SEC = 128;
/**
 * Const value for min reconnection back off time
 *
 * @category MQTT
 */
exports.DEFAULT_RECONNECT_MIN_SEC = 1;
//# sourceMappingURL=mqtt.js.map