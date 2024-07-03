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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsIotMqtt5ClientConfigBuilder = void 0;
/**
 * Module for the configuration of MQTT5 clients to connect to AWS IoT
 *
 * @packageDocumentation
 */
var mqtt5 = __importStar(require("./mqtt5"));
var iot_shared = __importStar(require("../common/aws_iot_shared"));
var error_1 = require("./error");
/**
 * Builder pattern class to create an {@link mqtt5.Mqtt5ClientConfig} which can then be used to create
 * an {@link mqtt5.Mqtt5Client}, configured for use with AWS IoT.
 *
 * [MQTT5 Client User Guide](https://www.github.com/awslabs/aws-crt-nodejs/blob/main/MQTT5-UserGuide.md)
 *
 * @category IoT
 */
var AwsIotMqtt5ClientConfigBuilder = /** @class */ (function () {
    function AwsIotMqtt5ClientConfigBuilder(hostName, port, websocketConfig) {
        this.config = {
            hostName: hostName,
            port: port,
            connectProperties: {
                keepAliveIntervalSeconds: AwsIotMqtt5ClientConfigBuilder.DEFAULT_KEEP_ALIVE
            },
            websocketOptions: websocketConfig
        };
    }
    /* Builders for difference connection methods to AWS IoT Core */
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via websockets,
     * using AWS Sigv4 signing to establish authenticate.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param sigv4Config - additional sigv4-oriented options to use
     */
    AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth = function (hostName, sigv4Config) {
        var _a;
        if (sigv4Config == null || sigv4Config == undefined) {
            throw new error_1.CrtError("AwsIotMqtt5ClientConfigBuilder newWebsocketMqttBuilderWithSigv4Auth: sigv4Config not defined");
        }
        var region = (_a = sigv4Config.region) !== null && _a !== void 0 ? _a : iot_shared.extractRegionFromEndpoint(hostName);
        var websocketConfig = {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Sigv4,
                region: region,
                credentialsProvider: sigv4Config.credentialsProvider
            }
        };
        var builder = new AwsIotMqtt5ClientConfigBuilder(hostName, AwsIotMqtt5ClientConfigBuilder.DEFAULT_WEBSOCKET_MQTT_PORT, websocketConfig);
        return builder;
    };
    /**
     * Create a new MQTT5 client builder  that will create MQTT5 clients that connect to AWS IoT Core via websockets,
     * authenticating via a custom authenticator.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param customAuthConfig - AWS IoT custom auth configuration
     */
    AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth = function (hostName, customAuthConfig) {
        var websocketConfig = {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Wss
            }
        };
        var builder = new AwsIotMqtt5ClientConfigBuilder(hostName, AwsIotMqtt5ClientConfigBuilder.DEFAULT_WEBSOCKET_MQTT_PORT, websocketConfig);
        builder.customAuthConfig = iot_shared.canonicalizeCustomAuthConfig(customAuthConfig);
        return builder;
    };
    /* Instance Methods for various config overrides */
    /**
     * Overrides the port to connect to on the IoT endpoint
     *
     * @param port The port to connect to on the IoT endpoint. Usually 8883 for MQTT, or 443 for websockets
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withPort = function (port) {
        this.config.port = port;
        return this;
    };
    /**
     * Overrides all configurable options with respect to the CONNECT packet sent by the client, including the will.
     * These connect properties will be used for every connection attempt made by the client.  Custom authentication
     * configuration will override the username and password values in this configuration.
     *
     * @param connectPacket all configurable options with respect to the CONNECT packet sent by the client
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withConnectProperties = function (connectPacket) {
        this.config.connectProperties = connectPacket;
        return this;
    };
    /**
     * Overrides how the MQTT5 client should behave with respect to MQTT sessions.
     *
     * @param sessionBehavior how the MQTT5 client should behave with respect to MQTT sessions.
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withSessionBehavior = function (sessionBehavior) {
        this.config.sessionBehavior = sessionBehavior;
        return this;
    };
    /**
     * Overrides how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
     * timepoints for a large set of reconnecting clients.
     *
     * @param retryJitterMode controls how the reconnect delay is modified in order to smooth out the distribution of
     * econnection attempt timepoints for a large set of reconnecting clients.
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withRetryJitterMode = function (retryJitterMode) {
        this.config.retryJitterMode = retryJitterMode;
        return this;
    };
    /**
     * Overrides the minimum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param minReconnectDelayMs minimum amount of time to wait to reconnect after a disconnect.
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withMinReconnectDelayMs = function (minReconnectDelayMs) {
        this.config.minReconnectDelayMs = minReconnectDelayMs;
        return this;
    };
    /**
     * Overrides the maximum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param maxReconnectDelayMs maximum amount of time to wait to reconnect after a disconnect.
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withMaxReconnectDelayMs = function (maxReconnectDelayMs) {
        this.config.maxReconnectDelayMs = maxReconnectDelayMs;
        return this;
    };
    /**
     * Overrides the amount of time that must elapse with an established connection before the reconnect delay is
     * reset to the minimum.  This helps alleviate bandwidth-waste in fast reconnect cycles due to permission
     * failures on operations.
     *
     * @param minConnectedTimeToResetReconnectDelayMs the amount of time that must elapse with an established
     * connection before the reconnect delay is reset to the minimum
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withMinConnectedTimeToResetReconnectDelayMs = function (minConnectedTimeToResetReconnectDelayMs) {
        this.config.minConnectedTimeToResetReconnectDelayMs = minConnectedTimeToResetReconnectDelayMs;
        return this;
    };
    /**
     * Overrides the overall time interval to wait to establish an MQTT connection.  If a complete MQTT connection
     * (from socket establishment all the way up to CONNACK receipt) has not been established before this timeout
     * expires, the connection attempt will be considered a failure.
     *
     * @param connectTimeoutMs overall time interval to wait to establish an MQTT connection
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withConnectTimeoutMs = function (connectTimeoutMs) {
        this.config.connectTimeoutMs = connectTimeoutMs;
        return this;
    };
    /**
     * Sets the opaque options set passed through to the underlying websocket implementation regardless of url factory.
     * Use this to control proxy settings amongst other things.
     *
     * @param options websocket transport options
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.withWebsocketTransportOptions = function (options) {
        if (this.config.websocketOptions) {
            this.config.websocketOptions.wsOptions = options;
        }
        return this;
    };
    /**
     * Constructs an MQTT5 Client configuration object for creating mqtt5 clients.
     */
    AwsIotMqtt5ClientConfigBuilder.prototype.build = function () {
        var _a, _b;
        // this is always set by the constructor, but check it to make typescript happy
        if (this.config.connectProperties) {
            this.config.connectProperties.username = iot_shared.buildMqtt5FinalUsername(this.customAuthConfig);
            if ((_a = this.customAuthConfig) === null || _a === void 0 ? void 0 : _a.password) {
                this.config.connectProperties.password = (_b = this.customAuthConfig) === null || _b === void 0 ? void 0 : _b.password;
            }
        }
        return this.config;
    };
    AwsIotMqtt5ClientConfigBuilder.DEFAULT_WEBSOCKET_MQTT_PORT = 443;
    return AwsIotMqtt5ClientConfigBuilder;
}());
exports.AwsIotMqtt5ClientConfigBuilder = AwsIotMqtt5ClientConfigBuilder;
//# sourceMappingURL=aws_iot_mqtt5.js.map