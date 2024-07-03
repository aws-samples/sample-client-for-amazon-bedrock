/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Module for AWS IoT configuration and connection establishment
 *
 * @packageDocumentation
 */

import { MqttClientConnection, MqttConnectionConfig, MqttWill} from "./mqtt";
import { DEFAULT_RECONNECT_MIN_SEC, DEFAULT_RECONNECT_MAX_SEC} from "../common/mqtt"
import * as io from "./io";
import { TlsContextOptions } from "./io";
import * as platform from '../common/platform';
import { HttpProxyOptions } from "./http";
import { WebsocketOptionsBase } from "../common/auth";
import { CrtError } from "./error";

import {
    aws_sign_request,
    AwsCredentialsProvider,
    AwsSignatureType,
    AwsSignedBodyValue,
    AwsSigningAlgorithm,
    AwsSigningConfig
} from "./auth";
import * as iot_shared from "../common/aws_iot_shared"

/**
 * Websocket-specific mqtt connection configuration options
 *
 * @category IoT
 */
export interface WebsocketConfig extends WebsocketOptionsBase{
    /** Sources the AWS Credentials used to sign the websocket connection handshake */
    credentials_provider: AwsCredentialsProvider;

    /** (Optional) http proxy configuration */
    proxy_options?: HttpProxyOptions;

    /** AWS region the websocket connection is being established in.  Must match the region embedded in the
     * endpoint.
     */
    region: string;

    /** (Optional)  TLS configuration to use when establishing the connection */
    tls_ctx_options?: TlsContextOptions;
}

/**
 * Builder functions to create a {@link MqttConnectionConfig} which can then be used to create
 * a {@link MqttClientConnection}, configured for use with AWS IoT.
 *
 * @category IoT
 */
export class AwsIotMqttConnectionConfigBuilder {
    private params: MqttConnectionConfig
    private is_using_custom_authorizer: boolean

    private constructor(private tls_ctx_options: TlsContextOptions) {
        this.params = {
            client_id: '',
            host_name: '',
            socket_options: new io.SocketOptions(),
            port: 8883,
            use_websocket: false,
            clean_session: false,
            keep_alive: undefined,
            will: undefined,
            username: "",
            password: undefined,
            tls_ctx: undefined,
            reconnect_min_sec: DEFAULT_RECONNECT_MIN_SEC,
            reconnect_max_sec: DEFAULT_RECONNECT_MAX_SEC
        };
        this.is_using_custom_authorizer = false
    }

    /**
     * Create a new builder with mTLS file paths
     * @param cert_path - Path to certificate, in PEM format
     * @param key_path - Path to private key, in PEM format
     */
    static new_mtls_builder_from_path(cert_path: string, key_path: string) {
        let builder = new AwsIotMqttConnectionConfigBuilder(TlsContextOptions.create_client_with_mtls_from_path(cert_path, key_path));
        builder.params.port = 8883;

        if (io.is_alpn_available()) {
            builder.tls_ctx_options.alpn_list.unshift('x-amzn-mqtt-ca');
        }

        return builder;
    }

    /**
     * Create a new builder with mTLS cert pair in memory
     * @param cert - Certificate, in PEM format
     * @param private_key - Private key, in PEM format
     */
    static new_mtls_builder(cert: string, private_key: string) {
        let builder = new AwsIotMqttConnectionConfigBuilder(TlsContextOptions.create_client_with_mtls(cert, private_key));
        builder.params.port = 8883;

        if (io.is_alpn_available()) {
            builder.tls_ctx_options.alpn_list.unshift('x-amzn-mqtt-ca');
        }

        return builder;
    }

    /**
     * Create a new builder with mTLS using a PKCS#11 library for private key operations.
     *
     * NOTE: This configuration only works on Unix devices.
     * @param pkcs11_options - PKCS#11 options.
     */
    static new_mtls_pkcs11_builder(pkcs11_options: TlsContextOptions.Pkcs11Options) {
        let builder = new AwsIotMqttConnectionConfigBuilder(TlsContextOptions.create_client_with_mtls_pkcs11(pkcs11_options));
        builder.params.port = 8883;

        if (io.is_alpn_available()) {
            builder.tls_ctx_options.alpn_list.unshift('x-amzn-mqtt-ca');
        }

        return builder;
    }

    /**
     * Create a new builder with mTLS using a PKCS#12 file for private key operations.
     *
     * Note: This configuration only works on MacOS devices.
     *
     * @param pkcs12_options - The PKCS#12 options to use in the builder.
     */
    static new_mtls_pkcs12_builder(pkcs12_options: io.Pkcs12Options) {
        let builder = new AwsIotMqttConnectionConfigBuilder(TlsContextOptions.create_client_with_mtls_pkcs12_from_path(
            pkcs12_options.pkcs12_file, pkcs12_options.pkcs12_password));
        builder.params.port = 8883;

        if (io.is_alpn_available()) {
            builder.tls_ctx_options.alpn_list.unshift('x-amzn-mqtt-ca');
        }

        return builder;
    }

    /**
     * Create a new builder with mTLS using a certificate in a Windows certificate store.
     *
     * NOTE: This configuration only works on Windows devices.
     * @param certificate_path - Path to certificate in a Windows certificate store.
     *      The path must use backslashes and end with the certificate's thumbprint.
     *      Example: `CurrentUser\MY\A11F8A9B5DF5B98BA3508FBCA575D09570E0D2C6`
     */
     static new_mtls_windows_cert_store_path_builder(certificate_path: string) {
        let builder = new AwsIotMqttConnectionConfigBuilder(TlsContextOptions.create_client_with_mtls_windows_cert_store_path(certificate_path));
        builder.params.port = 8883;

        if (io.is_alpn_available()) {
            builder.tls_ctx_options.alpn_list.unshift('x-amzn-mqtt-ca');
        }

        return builder;
    }

    /**
     * Creates a new builder with default Tls options. This requires setting the connection details manually.
     */
    static new_default_builder() {
        let ctx_options = new io.TlsContextOptions();
        let builder = new AwsIotMqttConnectionConfigBuilder(ctx_options);
        return builder;
    }

    static new_websocket_builder(...args: any[]) {
        return this.new_with_websockets(...args);
    }

    private static configure_websocket_handshake(builder: AwsIotMqttConnectionConfigBuilder, options?: WebsocketConfig) {
        if (options) {
            if (builder == null || builder == undefined) {
                throw new CrtError("AwsIotMqttConnectionConfigBuilder configure_websocket_handshake: builder not defined");
            }

            builder.params.websocket_handshake_transform = async (request, done) => {
                const signing_config = options.create_signing_config?.()
                    ?? {
                    algorithm: AwsSigningAlgorithm.SigV4,
                    signature_type: AwsSignatureType.HttpRequestViaQueryParams,
                    provider: options.credentials_provider,
                    region: options.region,
                    service: options.service ?? "iotdevicegateway",
                    signed_body_value: AwsSignedBodyValue.EmptySha256,
                    omit_session_token: true,
                };

                try {
                    await aws_sign_request(request, signing_config as AwsSigningConfig);
                    done();
                } catch (error) {
                    if (error instanceof CrtError) {
                        done(error.error_code);
                    } else {
                        done(3); /* TODO: AWS_ERROR_UNKNOWN */
                    }
                }
            };
        }

        return builder;
    }

    /**
     * Configures the connection to use MQTT over websockets. Forces the port to 443.
     */
    static new_with_websockets(options?: WebsocketConfig) {
        let tls_ctx_options = options?.tls_ctx_options;

        if (!tls_ctx_options) {
            tls_ctx_options = new TlsContextOptions();
            tls_ctx_options.alpn_list = [];
        }

        let builder = new AwsIotMqttConnectionConfigBuilder(tls_ctx_options);

        builder.params.use_websocket = true;
        builder.params.proxy_options = options?.proxy_options;

        if (builder.tls_ctx_options) {
            builder.params.port = 443;
        }

        this.configure_websocket_handshake(builder, options);

        return builder;
    }

    /**
     * For API compatibility with the browser version. Alias for {@link new_with_websockets}.
     *
     * @returns a new websocket connection builder object with default TLS configuration
     */
    static new_builder_for_websocket() {
        return this.new_with_websockets();
    }

    /**
     * Overrides the default system trust store.
     * @param ca_dirpath - Only used on Unix-style systems where all trust anchors are
     * stored in a directory (e.g. /etc/ssl/certs).
     * @param ca_filepath - Single file containing all trust CAs, in PEM format
     */
    with_certificate_authority_from_path(ca_dirpath?: string, ca_filepath?: string) {
        this.tls_ctx_options.override_default_trust_store_from_path(ca_dirpath, ca_filepath);
        return this;
    }

    /**
     * Overrides the default system trust store.
     * @param ca - Buffer containing all trust CAs, in PEM format
     */
    with_certificate_authority(ca: string) {
        this.tls_ctx_options.override_default_trust_store(ca);
        return this;
    }

    /**
     * Configures the IoT endpoint for this connection
     * @param endpoint The IoT endpoint to connect to
     */
    with_endpoint(endpoint: string) {
        this.params.host_name = endpoint;
        return this;
    }

    /**
     * The port to connect to on the IoT endpoint
     * @param port The port to connect to on the IoT endpoint. Usually 8883 for MQTT, or 443 for websockets
     */
    with_port(port: number) {
        this.params.port = port;
        return this;
    }

    /**
     * Configures the client_id to use to connect to the IoT Core service
     * @param client_id The client id for this connection. Needs to be unique across all devices/clients.
     */
    with_client_id(client_id: string) {
        this.params.client_id = client_id;
        return this;
    }

    /**
     * Determines whether or not the service should try to resume prior subscriptions, if it has any
     * @param clean_session true if the session should drop prior subscriptions when this client connects, false to resume the session
     */
    with_clean_session(clean_session: boolean) {
        this.params.clean_session = clean_session;
        return this;
    }

    /**
     * Configures MQTT keep-alive via PING messages. Note that this is not TCP keepalive.
     * @param keep_alive How often in seconds to send an MQTT PING message to the service to keep the connection alive
     */
    with_keep_alive_seconds(keep_alive: number) {
        this.params.keep_alive = keep_alive;
        return this;
    }

    /**
     * Configures the TCP socket timeout (in milliseconds)
     * @param timeout_ms TCP socket timeout
     * @deprecated
     */
    with_timeout_ms(timeout_ms: number) {
        this.with_ping_timeout_ms(timeout_ms);
        return this;
    }

    /**
     * Configures the PINGREQ response timeout (in milliseconds)
     * @param ping_timeout PINGREQ response timeout
     */
    with_ping_timeout_ms(ping_timeout: number) {
        this.params.ping_timeout = ping_timeout;
        return this;
    }

    /**
     * Configures the protocol operation timeout (in milliseconds)
     * @param protocol_operation_timeout protocol operation timeout
     */
    with_protocol_operation_timeout_ms(protocol_operation_timeout: number) {
        this.params.protocol_operation_timeout = protocol_operation_timeout;
        return this;
    }

    /**
     * Configures the will message to be sent when this client disconnects
     * @param will The will topic, qos, and message
     */
    with_will(will: MqttWill) {
        this.params.will = will;
        return this;
    }

    /**
     * Configures the common settings for the socket to use when opening a connection to the server
     * @param socket_options The socket settings
     */
    with_socket_options(socket_options: io.SocketOptions) {
        this.params.socket_options = socket_options;
        return this;
    }

    /**
     * Configures AWS credentials (usually from Cognito) for this connection
     * @param aws_region The service region to connect to
     * @param aws_access_id IAM Access ID
     * @param aws_secret_key IAM Secret Key
     * @param aws_sts_token STS token from Cognito (optional)
     */
    with_credentials(aws_region: string, aws_access_id: string, aws_secret_key: string, aws_sts_token?: string) {
        return AwsIotMqttConnectionConfigBuilder.configure_websocket_handshake(this, {
            credentials_provider: AwsCredentialsProvider.newStatic(aws_access_id, aws_secret_key, aws_sts_token),
            region: aws_region,
            service: "iotdevicegateway",
        });
    }

    /**
     * Configure the http proxy options to use to establish the connection
     * @param proxy_options proxy options to use to establish the mqtt connection
     */
    with_http_proxy_options(proxy_options: HttpProxyOptions) {
        this.params.proxy_options = proxy_options;
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
     *                    key associated with the custom authorizer and the result placed in the token_signature argument.
     */
    with_custom_authorizer(username : string, authorizer_name : string, authorizer_signature : string, password : string, token_key_name? : string, token_value? : string) {
        this.is_using_custom_authorizer = true;
        let uri_encoded_signature = iot_shared.canonicalizeCustomAuthTokenSignature(authorizer_signature);
        let username_string = iot_shared.populate_username_string_with_custom_authorizer(
            "", username, authorizer_name, uri_encoded_signature, this.params.username, token_key_name, token_value);
        this.params.username = username_string;
        this.params.password = password;
        if (!this.params.use_websocket) {
            this.tls_ctx_options.alpn_list = ["mqtt"];
        }
        this.params.port = 443;
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
     * Configure the max reconnection period (in second). The reonnection period will
     * be set in range of [reconnect_min_sec,reconnect_max_sec].
     * @param reconnect_max_sec max reconnection period
     */
    with_reconnect_max_sec(max_sec: number) {
        this.params.reconnect_max_sec = max_sec;
        return this;
    }

    /**
     * Configure the min reconnection period (in second). The reonnection period will
     * be set in range of [reconnect_min_sec,reconnect_max_sec].
     * @param reconnect_min_sec min reconnection period
     */
    with_reconnect_min_sec(min_sec: number) {
        this.params.reconnect_min_sec = min_sec;
        return this;
    }

    /**
     * Returns the configured MqttConnectionConfig.  On the first invocation of this function, the TLS context is cached
     * and re-used on all subsequent calls to build().
     * @returns The configured MqttConnectionConfig
     */
    build() {
        if (this.params.client_id === undefined || this.params.host_name === undefined) {
            throw 'client_id and endpoint are required';
        }

        // Check to see if a custom authorizer is being used but not through the builder
        if (this.is_using_custom_authorizer == false) {
            if (iot_shared.is_string_and_not_empty(this.params.username)) {
                if (this.params.username?.indexOf("x-amz-customauthorizer-name=") != -1 || this.params.username?.indexOf("x-amz-customauthorizer-signature=") != -1) {
                    this.is_using_custom_authorizer = true;
                }
            }
        }

        // Is the user trying to connect using a custom authorizer?
        if (this.is_using_custom_authorizer == true) {
            if (this.params.port != 443) {
                console.log("Warning: Attempting to connect to authorizer with unsupported port. Port is not 443...");
            }
        }

        /*
         * By caching and reusing the TLS context we get an enormous memory savings on a per-connection basis.
         * The tradeoff is that you can't modify TLS options in between calls to build.
         * Previously we were making a new one with every single connection which had a huge negative impact on large
         * scale tests.
         */
        if (this.params.tls_ctx === undefined) {
            this.params.tls_ctx = new io.ClientTlsContext(this.tls_ctx_options);
        }

        // Add the metrics string
        if (iot_shared.is_string_and_not_empty(this.params.username) == false) {
            this.params.username = "?SDK=NodeJSv2&Version="
        } else {
            if (this.params.username?.indexOf("?") != -1) {
                this.params.username += "&SDK=NodeJSv2&Version="
            } else {
                this.params.username += "?SDK=NodeJSv2&Version="
            }
        }
        this.params.username += platform.crt_version()

        return this.params;
    }
}
