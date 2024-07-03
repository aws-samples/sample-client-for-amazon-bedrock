/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Module for the configuration of MQTT5 clients to connect to AWS IoT
 *
 * @packageDocumentation
 */

import * as mqtt5 from "./mqtt5";
import * as mqtt5_packet from "../common/mqtt5_packet";
import * as auth from "./auth";
import * as iot_shared from "../common/aws_iot_shared";
import { CrtError } from "./error";

export { MqttConnectCustomAuthConfig } from '../common/aws_iot_shared';

/**
 * Websocket-specific MQTT5 connection AWS IoT configuration options
 *
 * @category IoT
 */
export interface WebsocketSigv4Config {

    /**
     * Sources the AWS Credentials used to sign the websocket connection handshake.  If not provided, the
     * default credentials provider chain is used.
     */
    credentialsProvider: auth.CredentialsProvider;

    /**
     * AWS region the websocket connection is being established in.  Must match the region embedded in the
     * endpoint.  If not provided, pattern-matching logic is used to extract the region from the endpoint.
     * Use this option if the pattern-matching logic has not yet been updated to handle new endpoint formats.
     */
    region?: string;
}

/**
 * Builder pattern class to create an {@link mqtt5.Mqtt5ClientConfig} which can then be used to create
 * an {@link mqtt5.Mqtt5Client}, configured for use with AWS IoT.
 *
 * [MQTT5 Client User Guide](https://www.github.com/awslabs/aws-crt-nodejs/blob/main/MQTT5-UserGuide.md)
 *
 * @category IoT
 */
export class AwsIotMqtt5ClientConfigBuilder {

    private static DEFAULT_WEBSOCKET_MQTT_PORT : number = 443;
    private static DEFAULT_KEEP_ALIVE : 1200;

    private config: mqtt5.Mqtt5ClientConfig;
    private customAuthConfig?: iot_shared.MqttConnectCustomAuthConfig;

    private constructor(hostName : string, port: number, websocketConfig: mqtt5.Mqtt5WebsocketConfig) {
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
    static newWebsocketMqttBuilderWithSigv4Auth(hostName : string, sigv4Config: WebsocketSigv4Config) : AwsIotMqtt5ClientConfigBuilder {

        if (sigv4Config == null || sigv4Config == undefined) {
            throw new CrtError("AwsIotMqtt5ClientConfigBuilder newWebsocketMqttBuilderWithSigv4Auth: sigv4Config not defined");
        }

        let region : string = sigv4Config.region ?? iot_shared.extractRegionFromEndpoint(hostName);

        let websocketConfig: mqtt5.Mqtt5WebsocketConfig = {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Sigv4,
                region: region,
                credentialsProvider: sigv4Config.credentialsProvider
            }
        };

        let builder = new AwsIotMqtt5ClientConfigBuilder(
            hostName,
            AwsIotMqtt5ClientConfigBuilder.DEFAULT_WEBSOCKET_MQTT_PORT,
            websocketConfig);

        return builder;
    }

    /**
     * Create a new MQTT5 client builder  that will create MQTT5 clients that connect to AWS IoT Core via websockets,
     * authenticating via a custom authenticator.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param customAuthConfig - AWS IoT custom auth configuration
     */
    static newWebsocketMqttBuilderWithCustomAuth(hostName : string, customAuthConfig: iot_shared.MqttConnectCustomAuthConfig) : AwsIotMqtt5ClientConfigBuilder {

        let websocketConfig: mqtt5.Mqtt5WebsocketConfig = {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Wss
            }
        };

        let builder = new AwsIotMqtt5ClientConfigBuilder(
            hostName,
            AwsIotMqtt5ClientConfigBuilder.DEFAULT_WEBSOCKET_MQTT_PORT,
            websocketConfig);

        builder.customAuthConfig = iot_shared.canonicalizeCustomAuthConfig(customAuthConfig);

        return builder;
    }

    /* Instance Methods for various config overrides */

    /**
     * Overrides the port to connect to on the IoT endpoint
     *
     * @param port The port to connect to on the IoT endpoint. Usually 8883 for MQTT, or 443 for websockets
     */
    withPort(port: number) : AwsIotMqtt5ClientConfigBuilder {
        this.config.port = port;
        return this;
    }

    /**
     * Overrides all configurable options with respect to the CONNECT packet sent by the client, including the will.
     * These connect properties will be used for every connection attempt made by the client.  Custom authentication
     * configuration will override the username and password values in this configuration.
     *
     * @param connectPacket all configurable options with respect to the CONNECT packet sent by the client
     */
    withConnectProperties(connectPacket: mqtt5_packet.ConnectPacket) : AwsIotMqtt5ClientConfigBuilder {
        this.config.connectProperties = connectPacket;
        return this;
    }

    /**
     * Overrides how the MQTT5 client should behave with respect to MQTT sessions.
     *
     * @param sessionBehavior how the MQTT5 client should behave with respect to MQTT sessions.
     */
    withSessionBehavior(sessionBehavior: mqtt5.ClientSessionBehavior) : AwsIotMqtt5ClientConfigBuilder {
        this.config.sessionBehavior = sessionBehavior;
        return this;
    }

    /**
     * Overrides how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
     * timepoints for a large set of reconnecting clients.
     *
     * @param retryJitterMode controls how the reconnect delay is modified in order to smooth out the distribution of
     * econnection attempt timepoints for a large set of reconnecting clients.
     */
    withRetryJitterMode(retryJitterMode: mqtt5.RetryJitterType) : AwsIotMqtt5ClientConfigBuilder {
        this.config.retryJitterMode = retryJitterMode;
        return this;
    }

    /**
     * Overrides the minimum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param minReconnectDelayMs minimum amount of time to wait to reconnect after a disconnect.
     */
    withMinReconnectDelayMs(minReconnectDelayMs : number) : AwsIotMqtt5ClientConfigBuilder {
        this.config.minReconnectDelayMs = minReconnectDelayMs;
        return this;
    }

    /**
     * Overrides the maximum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param maxReconnectDelayMs maximum amount of time to wait to reconnect after a disconnect.
     */
    withMaxReconnectDelayMs(maxReconnectDelayMs : number) : AwsIotMqtt5ClientConfigBuilder {
        this.config.maxReconnectDelayMs = maxReconnectDelayMs;
        return this;
    }

    /**
     * Overrides the amount of time that must elapse with an established connection before the reconnect delay is
     * reset to the minimum.  This helps alleviate bandwidth-waste in fast reconnect cycles due to permission
     * failures on operations.
     *
     * @param minConnectedTimeToResetReconnectDelayMs the amount of time that must elapse with an established
     * connection before the reconnect delay is reset to the minimum
     */
    withMinConnectedTimeToResetReconnectDelayMs(minConnectedTimeToResetReconnectDelayMs : number) : AwsIotMqtt5ClientConfigBuilder {
        this.config.minConnectedTimeToResetReconnectDelayMs = minConnectedTimeToResetReconnectDelayMs;
        return this;
    }

    /**
     * Overrides the overall time interval to wait to establish an MQTT connection.  If a complete MQTT connection
     * (from socket establishment all the way up to CONNACK receipt) has not been established before this timeout
     * expires, the connection attempt will be considered a failure.
     *
     * @param connectTimeoutMs overall time interval to wait to establish an MQTT connection
     */
    withConnectTimeoutMs(connectTimeoutMs: number) : AwsIotMqtt5ClientConfigBuilder {
        this.config.connectTimeoutMs = connectTimeoutMs;
        return this;
    }

    /**
     * Sets the opaque options set passed through to the underlying websocket implementation regardless of url factory.
     * Use this to control proxy settings amongst other things.
     *
     * @param options websocket transport options
     */
    withWebsocketTransportOptions(options: any) : AwsIotMqtt5ClientConfigBuilder {
        if (this.config.websocketOptions) {
            this.config.websocketOptions.wsOptions = options;
        }
        return this;
    }

    /**
     * Constructs an MQTT5 Client configuration object for creating mqtt5 clients.
     */
    build() : mqtt5.Mqtt5ClientConfig {
        // this is always set by the constructor, but check it to make typescript happy
        if (this.config.connectProperties) {
            this.config.connectProperties.username = iot_shared.buildMqtt5FinalUsername(this.customAuthConfig);
            if (this.customAuthConfig?.password) {
                this.config.connectProperties.password = this.customAuthConfig?.password;
            }
        }

        return this.config;
    }
}
