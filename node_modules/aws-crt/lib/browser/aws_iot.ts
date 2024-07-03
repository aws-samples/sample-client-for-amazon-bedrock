/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Module for AWS IoT configuration and connection establishment
 *
 * @packageDocumentation
 */

import { CredentialsProvider, StaticCredentialProvider} from "./auth"
import { SocketOptions } from "./io";
import { MqttClientConnection, MqttConnectionConfig, MqttWill } from "./mqtt";
import * as platform from "../common/platform";
import * as iot_shared from "../common/aws_iot_shared"

/**
 * Builder functions to create a {@link MqttConnectionConfig} which can then be used to create
 * a {@link MqttClientConnection}, configured for use with AWS IoT.
 *
 * @category IoT
 */
export class AwsIotMqttConnectionConfigBuilder {
    private params: MqttConnectionConfig

    private constructor() {
        this.params = {
            client_id: '',
            host_name: '',
            socket_options: new SocketOptions(),
            port: 443,
            clean_session: false,
            keep_alive: undefined,
            will: undefined,
            username: '',
            password: undefined,
            websocket: {},
            credentials_provider: undefined
        };
    }

    /**
     * For API compatibility with the native version. Does not set up mTLS.
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_mtls_builder(...args: any[]) {
        return AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket();
    }

    /**
     * For API compatibility with the native version. Alias for {@link new_builder_for_websocket}.
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_default_builder() {
        return AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket();
    }

    /**
     * For API compatibility with the native version. Alias for {@link new_with_websockets}.
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_websocket_builder(...args: any[]) {
        return this.new_with_websockets(...args);
    }

    /**
     * For API compatibility with the native version. Alias for {@link new_builder_for_websocket}.
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_with_websockets(...args: any[]) {
        return AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket();
    }


    /**
     * Creates a new builder using MQTT over websockets (the only option in browser)
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_builder_for_websocket() {
        let builder = new AwsIotMqttConnectionConfigBuilder();
        return builder;
    }

    /**
     * Configures the IoT endpoint for this connection
     * @param endpoint The IoT endpoint to connect to
     *
     * @returns this builder object
     */
    with_endpoint(endpoint: string) {
        this.params.host_name = endpoint;
        return this;
    }

    /**
     * The client id to use for this connection
     * @param client_id The client id to use for this connection
     *
     * @returns this builder object
     */
    with_client_id(client_id: string) {
        this.params.client_id = client_id;
        return this;
    }

    /**
     * The port to connect to on the IoT endpoint
     * @param port The port to connect to on the IoT endpoint. Usually 8883 for MQTT, or 443 for websockets
     *
     * @returns this builder object
     */
    with_port(port: number) {
        this.params.port = port;
        return this;
    }

    /**
     * Determines whether or not the service should try to resume prior subscriptions, if it has any
     * @param clean_session true if the session should drop prior subscriptions when this client connects, false to resume the session
     *
     * @returns this builder object
     */
    with_clean_session(clean_session: boolean) {
        this.params.clean_session = clean_session;
        return this;
    }

    /**
     * Configures the connection to use MQTT over websockets. No-op in the browser.
     *
     * @returns this builder object
     */
    with_use_websockets() {
        /* no-op, but valid in the browser */
        return this;
    }

    /**
     * Configures MQTT keep-alive via PING messages. Note that this is not TCP keepalive.
     * @param keep_alive How often in seconds to send an MQTT PING message to the service to keep the connection alive
     *
     * @returns this builder object
     */
    with_keep_alive_seconds(keep_alive: number) {
        this.params.keep_alive = keep_alive;
        return this;
    }

    /**
     * Configures the TCP socket timeout (in milliseconds)
     * @param timeout_ms TCP socket timeout
     * @deprecated in favor of socket options
     *
     * @returns this builder object
     */
    with_timeout_ms(timeout_ms: number) {
        this.with_ping_timeout_ms(timeout_ms);
        return this;
    }

    /**
     * Configures the PINGREQ response timeout (in milliseconds)
     * @param ping_timeout PINGREQ response timeout
     *
     * @returns this builder object
     */
    with_ping_timeout_ms(ping_timeout: number) {
        this.params.ping_timeout = ping_timeout;
        return this;
    }

    /**
     * Configures the will message to be sent when this client disconnects
     * @param will The will topic, qos, and message
     *
     * @returns this builder object
     */
    with_will(will: MqttWill) {
        this.params.will = will;
        return this;
    }

    /**
     * Configures the common settings for the socket to use when opening a connection to the server
     * @param socket_options The socket settings
     *
     * @returns this builder object
     */
    with_socket_options(socket_options: SocketOptions) {
        this.params.socket_options = socket_options;
        return this;
    }

    /**
     * Allows additional headers to be sent when establishing a websocket connection. Useful for custom authentication.
     * @param headers Additional headers to send during websocket connect
     *
     * @returns this builder object
     */
    with_websocket_headers(headers: { [index: string]: string }) {
        this.params.websocket = {
            headers: headers
        };
        return this;
    }

    /**
     * Configures Static AWS credentials for this connection.
     * Please note that the static credential will fail when the web session expired.
     * @param aws_region The service region to connect to
     * @param aws_access_id IAM Access ID
     * @param aws_secret_key IAM Secret Key
     * @param aws_sts_token session credentials token (optional)
     *
     * @returns this builder object
     */
     with_credentials(aws_region: string, aws_access_id: string, aws_secret_key: string, aws_sts_token?: string) {
        const provider = new StaticCredentialProvider(
            { aws_region: aws_region,
              aws_access_id: aws_access_id,
              aws_secret_key: aws_secret_key,
              aws_sts_token: aws_sts_token});
        this.params.credentials_provider = provider;
        return this;
    }

    /**
     * Configures credentials provider (currently support for AWS Cognito Credential Provider) for this connection
     * @param customer_provider credential provider used to update credential when session expired (optional)
     *
     * @returns this builder object
     */
    with_credential_provider( customer_provider : CredentialsProvider) {
        this.params.credentials_provider = customer_provider;
        return this;
    }

    /**
     * Sets the custom authorizer settings. This function will modify the username, port, and TLS options.
     *
     * @param username The username to use with the custom authorizer. If an empty string is passed, it will
     *                 check to see if a username has already been set (via WithUsername function). If no
     *                 username is set then no username will be passed with the MQTT connection.
     * @param authorizer_name The name of the custom authorizer. If an empty string is passed, then
     *                       'x-amz-customauthorizer-name' will not be added with the MQTT connection.  It is strongly
     *                       recommended to URL-encode this value; the SDK will not do so for you.
     * @param authorizer_signature The signature of the custom authorizer. If an empty string is passed, then
     *                            'x-amz-customauthorizer-signature' will not be added with the MQTT connection.
     *                            The signature must be based on the private key associated with the custom authorizer.
     *                            The signature must be base64 encoded.
     *                            Required if the custom authorizer has signing enabled.
     * @param password The password to use with the custom authorizer. If null is passed, then no password will
     *                 be set.
     * @param token_key_name Key used to extract the custom authorizer token from MQTT username query-string properties.
     *                       Required if the custom authorizer has signing enabled.  It is strongly suggested to URL-encode
     *                       this value; the SDK will not do so for you.
     * @param token_value An opaque token value.
     *                    Required if the custom authorizer has signing enabled. This value must be signed by the private
     *                    key associated with the custom authorizer and the result placed in the authorizer_signature argument.
     */
    with_custom_authorizer(username : string, authorizer_name : string, authorizer_signature : string, password : string, token_key_name? : string, token_value? : string) {
        let uri_encoded_signature = iot_shared.canonicalizeCustomAuthTokenSignature(authorizer_signature);
        let username_string = iot_shared.populate_username_string_with_custom_authorizer(
            "", username, authorizer_name, uri_encoded_signature, this.params.username, token_key_name, token_value);
        this.params.username = username_string;
        this.params.password = password;
        // Tells the websocket connection we are using a custom authorizer
        if (this.params.websocket) {
             this.params.websocket.protocol = "wss-custom-auth";
        }
        return this;
    }

    /**
     * Sets username for the connection
     *
     * @param username the username that will be passed with the MQTT connection
     */
    with_username(username : string) {
        this.params.username = username;
        return this;
    }

    /**
     * Sets password for the connection
     *
     * @param password the password that will be passed with the MQTT connection
     */
    with_password(password : string) {
        this.params.password = password;
        return this;
    }

    /**
     * Configure the max reconnection period (in second). The reconnection period will
     * be set in range of [reconnect_min_sec,reconnect_max_sec].
     * @param reconnect_max_sec max reconnection period
     */
    with_reconnect_max_sec(max_sec: number) {
        this.params.reconnect_max_sec = max_sec;
        return this;
    }

    /**
     * Configure the min reconnection period (in second). The reconnection period will
     * be set in range of [reconnect_min_sec,reconnect_max_sec].
     * @param reconnect_min_sec min reconnection period
     */
    with_reconnect_min_sec(min_sec: number) {
        this.params.reconnect_min_sec = min_sec;
        return this;
    }

    /**
     * Returns the configured MqttConnectionConfig
     * @returns The configured MqttConnectionConfig
     */
    build() {
        if (this.params.client_id === undefined || this.params.host_name === undefined) {
            throw 'client_id and endpoint are required';
        }

        // Add the metrics string
        if (this.params.username == undefined || this.params.username == null || this.params.username == "") {
            this.params.username = "?SDK=NodeJSv2&Version="
        } else {
            if (this.params.username.indexOf("?") != -1) {
                this.params.username += "&SDK=NodeJSv2&Version="
            } else {
                this.params.username += "?SDK=NodeJSv2&Version="
            }
        }
        this.params.username += platform.crt_version()

        return this.params;
    }
}
