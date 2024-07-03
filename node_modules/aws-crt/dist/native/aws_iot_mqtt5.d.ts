/**
 * Module for the configuration of MQTT5 clients to connect to AWS IoT
 *
 * @packageDocumentation
 */
import * as mqtt5 from "./mqtt5";
import * as io from "./io";
import * as auth from "./auth";
import * as iot_shared from "../common/aws_iot_shared";
import * as http from "./http";
export { MqttConnectCustomAuthConfig } from '../common/aws_iot_shared';
/**
 * Websocket-specific MQTT5 client AWS IoT configuration options
 *
 * @category IoT
 */
export interface WebsocketSigv4Config {
    /**
     * Sources the AWS Credentials used to sign the websocket connection handshake.  If not provided, the
     * default credentials provider chain is used.
     */
    credentialsProvider?: auth.AwsCredentialsProvider;
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
export declare class AwsIotMqtt5ClientConfigBuilder {
    private tlsContextOptions;
    private static DEFAULT_WEBSOCKET_MQTT_PORT;
    private static DEFAULT_DIRECT_MQTT_PORT;
    private config;
    private customAuthConfig?;
    private constructor();
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via mutual TLS
     * using X509 certificate and key at the supplied file paths.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param certPath - Path to certificate, in PEM format
     * @param keyPath - Path to private key, in PEM format
     */
    static newDirectMqttBuilderWithMtlsFromPath(hostName: string, certPath: string, keyPath: string): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via mutual TLS
     * using in-memory X509 certificate and key.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param cert - Certificate, in PEM format
     * @param privateKey - Private key, in PEM format
     */
    static newDirectMqttBuilderWithMtlsFromMemory(hostName: string, cert: string, privateKey: string): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via mutual TLS
     * using a PKCS11 library for certificate and private key operations.
     *
     * NOTE: This configuration only works on Unix devices.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param pkcs11Options - PKCS#11 options.
     */
    static newDirectMqttBuilderWithMtlsFromPkcs11(hostName: string, pkcs11Options: io.TlsContextOptions.Pkcs11Options): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via mutual TLS
     * using a PKCS12 file.
     *
     * Note: This configuration only works on MacOS devices.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param pkcs12_options - The PKCS#12 options to use in the builder.
     */
    static newDirectMqttBuilderWithMtlsFromPkcs12(hostName: string, pkcs12_options: io.Pkcs12Options): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via mutual TLS
     * using a certificate entry in a Windows certificate store.
     *
     * NOTE: This configuration only works on Windows devices.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param certificatePath - Path to certificate in a Windows certificate store.
     *      The path must use backslashes and end with the certificate's thumbprint.
     *      Example: `CurrentUser\MY\A11F8A9B5DF5B98BA3508FBCA575D09570E0D2C6`
     */
    static newDirectMqttBuilderWithMtlsFromWindowsCertStorePath(hostName: string, certificatePath: string): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via TLS,
     * authenticating via a custom authenticator.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param customAuthConfig - AWS IoT custom auth configuration
     */
    static newDirectMqttBuilderWithCustomAuth(hostName: string, customAuthConfig: iot_shared.MqttConnectCustomAuthConfig): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via websockets,
     * using AWS Sigv4 signing to establish authenticate.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param options - additional sigv4-oriented options to use
     */
    static newWebsocketMqttBuilderWithSigv4Auth(hostName: string, options?: WebsocketSigv4Config): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Create a new MQTT5 client builder that will create MQTT5 clients that connect to AWS IoT Core via websockets,
     * authenticating via a custom authenticator.
     *
     * @param hostName - AWS IoT endpoint to connect to
     * @param customAuthConfig - AWS IoT custom auth configuration
     */
    static newWebsocketMqttBuilderWithCustomAuth(hostName: string, customAuthConfig: iot_shared.MqttConnectCustomAuthConfig): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the default system trust store.
     *
     * @param caDirpath - Only used on Unix-style systems where all trust anchors are
     * stored in a directory (e.g. /etc/ssl/certs).
     * @param caFilepath - Single file containing all trust CAs, in PEM format
     */
    withCertificateAuthorityFromPath(caDirpath?: string, caFilepath?: string): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the default system trust store.
     *
     * @param ca - Buffer containing all trust CAs, in PEM format
     */
    withCertificateAuthority(ca: string): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the IoT endpoint port to connect to.
     *
     * @param port The IoT endpoint port to connect to. Usually 8883 for MQTT, or 443 for websockets
     */
    withPort(port: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides all configurable options with respect to the CONNECT packet sent by the client, including the will.
     * These connect properties will be used for every connection attempt made by the client.  Custom authentication
     * configuration will override the username and password values in this configuration.
     *
     * @param connectPacket all configurable options with respect to the CONNECT packet sent by the client
     */
    withConnectProperties(connectPacket: mqtt5.ConnectPacket): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides how the MQTT5 client should behave with respect to MQTT sessions.
     *
     * @param sessionBehavior how the MQTT5 client should behave with respect to MQTT sessions.
     */
    withSessionBehavior(sessionBehavior: mqtt5.ClientSessionBehavior): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides how the reconnect delay is modified in order to smooth out the distribution of reconnection attempt
     * timepoints for a large set of reconnecting clients.
     *
     * @param retryJitterMode controls how the reconnect delay is modified in order to smooth out the distribution of
     * econnection attempt timepoints for a large set of reconnecting clients.
     */
    withRetryJitterMode(retryJitterMode: mqtt5.RetryJitterType): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the minimum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param minReconnectDelayMs minimum amount of time to wait to reconnect after a disconnect.
     */
    withMinReconnectDelayMs(minReconnectDelayMs?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the maximum amount of time to wait to reconnect after a disconnect.  Exponential backoff is performed
     * with controllable jitter after each connection failure.
     *
     * @param maxReconnectDelayMs maximum amount of time to wait to reconnect after a disconnect.
     */
    withMaxReconnectDelayMs(maxReconnectDelayMs?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the amount of time that must elapse with an established connection before the reconnect delay is
     * reset to the minimum.  This helps alleviate bandwidth-waste in fast reconnect cycles due to permission
     * failures on operations.
     *
     * @param minConnectedTimeToResetReconnectDelayMs the amount of time that must elapse with an established
     * connection before the reconnect delay is reset to the minimum
     */
    withMinConnectedTimeToResetReconnectDelayMs(minConnectedTimeToResetReconnectDelayMs?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the time interval to wait after sending a CONNECT request for a CONNACK to arrive.  If one does not
     * arrive, the connection will be shut down.
     *
     * @param connackTimeoutMs time interval to wait after sending a CONNECT request for a CONNACK to arrive
     */
    withConnackTimeoutMs(connackTimeoutMs?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides how disconnects affect the queued and in-progress operations tracked by the client.  Also controls
     * how new operations are handled while the client is not connected.  In particular, if the client is not connected,
     * then any operation that would be failed on disconnect (according to these rules) will also be rejected.
     *
     * @param offlineQueueBehavior how disconnects affect the queued and in-progress operations tracked by the client
     *
     * @group Node-only
     */
    withOfflineQueueBehavior(offlineQueueBehavior: mqtt5.ClientOperationQueueBehavior): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the time interval to wait after sending a PINGREQ for a PINGRESP to arrive.  If one does not arrive,
     * the client will close the current connection.
     *
     * @param pingTimeoutMs time interval to wait after sending a PINGREQ for a PINGRESP to arrive
     *
     * @group Node-only
     */
    withPingTimeoutMs(pingTimeoutMs?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the time interval to wait for an ack after sending a QoS 1+ PUBLISH, SUBSCRIBE, or UNSUBSCRIBE before
     * failing the operation.  Defaults to no timeout.
     *
     * @param ackTimeoutSeconds the time interval to wait for an ack after sending a QoS 1+ PUBLISH, SUBSCRIBE,
     * or UNSUBSCRIBE before failing the operation
     *
     * @group Node-only
     */
    withAckTimeoutSeconds(ackTimeoutSeconds?: number): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides the socket properties of the underlying MQTT connections made by the client.  Leave undefined to use
     * defaults (no TCP keep alive, 10 second socket timeout).
     *
     * @param socketOptions socket properties of the underlying MQTT connections made by the client
     *
     * @group Node-only
     */
    withSocketOptions(socketOptions: io.SocketOptions): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides (tunneling) HTTP proxy usage when establishing MQTT connections.
     *
     * @param httpProxyOptions HTTP proxy options to use when establishing MQTT connections
     *
     * @group Node-only
     */
    withHttpProxyOptions(httpProxyOptions: http.HttpProxyOptions): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides additional controls for client behavior with respect to operation validation and flow control; these
     * checks go beyond the base MQTT5 spec to respect limits of specific MQTT brokers.
     *
     * @param extendedValidationAndFlowControlOptions additional controls for client behavior with respect to operation
     * validation and flow control
     *
     * @group Node-only
     */
    withExtendedValidationAndFlowControlOptions(extendedValidationAndFlowControlOptions: mqtt5.ClientExtendedValidationAndFlowControl): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Overrides how the MQTT5 client should behave with respect to topic aliasing
     *
     * @param topicAliasingOptions how the MQTT5 client should behave with respect to topic aliasing
     */
    withTopicAliasingOptions(topicAliasingOptions: mqtt5.TopicAliasingOptions): AwsIotMqtt5ClientConfigBuilder;
    /**
     * Constructs an MQTT5 Client configuration object for creating mqtt5 clients.
     */
    build(): mqtt5.Mqtt5ClientConfig;
}
