/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * This module is internal-only and not exported.
 *
 * @packageDocumentation
 * @module binding
 */

import { InputStream, TlsContextOptions } from "./io";
import {AwsSigningConfig, CognitoCredentialsProviderConfig, X509CredentialsConfig} from "./auth";
import { HttpHeader, HttpHeaders as CommonHttpHeaders } from "../common/http";
import { OnMessageCallback, QoS } from "../common/mqtt";
import { Mqtt5ClientConfig, Mqtt5Client, ClientStatistics, NegotiatedSettings } from "./mqtt5";
import * as mqtt5_packet from "../common/mqtt5_packet";
import { PublishCompletionResult } from "../common/mqtt5";
import * as eventstream from "./eventstream";
import { ConnectionStatistics } from "./mqtt";


/**
 * Type used to store pointers to CRT native resources
 * @internal
 */
type NativeHandle = any;

/**
 * Polymorphic union of types that we convert to byte sequences in native.
 */
export type StringLike = string | ArrayBuffer | ArrayBufferView;

/* common */
/** @internal */
export function native_memory(): number;
/** @internal */
export function native_memory_dump(): void;
/** @internal */
export function error_code_to_string(error_code: number): string;
/** @internal */
export function error_code_to_name(error_code: number): string;
/** @internal */
export function disable_threadsafe_function(): number;

/* IO */
/** @internal */
export function io_logging_enable(log_level: number): void;
/** @internal */
export function is_alpn_available(): boolean;
/* wraps aws_client_bootstrap #TODO: Wrap with ClassBinder */
/** @internal */
export function io_client_bootstrap_new(): NativeHandle;
/* wraps aws_tls_context #TODO: Wrap with ClassBinder */
/** @internal */
export function io_tls_ctx_new(
    min_tls_version: number,
    ca_filepath?: StringLike,
    ca_dirpath?: StringLike,
    certificate_authority?: StringLike,
    alpn_list?: StringLike,
    certificate_filepath?: StringLike,
    certificate?: StringLike,
    private_key_filepath?: StringLike,
    private_key?: StringLike,
    pkcs12_filepath?: StringLike,
    pkcs12_password?: StringLike,
    pkcs11_options?: TlsContextOptions.Pkcs11Options,
    windows_cert_store_path?: StringLike,
    verify_peer?: boolean,
): NativeHandle;
/* wraps aws_tls_connection_options #TODO: Wrap with ClassBinder */
/** @internal */
export function io_tls_connection_options_new(
    tls_ctx: NativeHandle,
    server_name?: StringLike,
    alpn_list?: StringLike
): NativeHandle;
/* wraps aws_socket_options #TODO: Wrap with ClassBinder */
/** @internal */
export function io_socket_options_new(
    type: number,
    domain: number,
    connect_timeout_ms: number,
    keep_alive_interval_sec: number,
    keep_alive_timeout_sec: number,
    keep_alive_max_failed_probes: number,
    keepalive: boolean
): NativeHandle;

/* wraps aws_input_stream #TODO: Wrap with ClassBinder */
/** @internal */
export function io_input_stream_new(capacity: number): NativeHandle;
/** @internal */
export function io_input_stream_append(stream: NativeHandle, data?: Buffer): void;

/* wraps aws_pkcs11_lib */
/** @internal */
export function io_pkcs11_lib_new(path: string, behavior: number): NativeHandle;
/** @internal */
export function io_pkcs11_lib_close(pkcs11_lib: NativeHandle): void;

/* Crypto */
/* wraps aws_hash structures #TODO: Wrap with ClassBinder */
/** @internal */
export function hash_md5_new(): void;
/** @internal */
export function hash_sha256_new(): void;
/** @internal */
export function hash_sha1_new(): void;
/** @internal */
export function hash_update(handle: NativeHandle, data: StringLike): void;
/** @internal */
export function hash_digest(handle: NativeHandle, truncate_to?: number): DataView;

/** @internal */
export function hash_md5_compute(data: StringLike, truncate_to?: number): DataView;
/** @internal */
export function hash_sha256_compute(data: StringLike, truncate_to?: number): DataView;
/** @internal */
export function hash_sha1_compute(data: StringLike, truncate_to?: number): DataView;

/** @internal */
export function hmac_md5_new(secret: StringLike): void;
/** @internal */
export function hmac_sha256_new(secret: StringLike): void;
/** @internal */
export function hmac_update(handle: NativeHandle, data: StringLike): void;
/** @internal */
export function hmac_digest(handle: NativeHandle, truncate_to?: number): DataView;

/** @internal */
export function hmac_md5_compute(secret: StringLike, data: StringLike, truncate_to?: number): DataView;
/** @internal */
export function hmac_sha256_compute(secret: StringLike, data: StringLike, truncate_to?: number): DataView;

/* Checksums */
/* wraps aws_checksums functions */

/** @internal */
export function checksums_crc32(data: StringLike, previous?: number): number;
/** @internal */
export function checksums_crc32c(data: StringLike, previous?: number): number;

/* MQTT5 Client */

/** @internal */
export function mqtt5_client_new(
    client: Mqtt5Client,
    config: Mqtt5ClientConfig,
    on_stopped_event_handler: (client: Mqtt5Client) => void,
    on_attempt_connect_handler: (client: Mqtt5Client) => void,
    on_connection_success_handler: (client: Mqtt5Client, connack: mqtt5_packet.ConnackPacket, settings: NegotiatedSettings) => void,
    on_connection_failure_handler: (client: Mqtt5Client, errorCode: number, connack?: mqtt5_packet.ConnackPacket) => void,
    on_disconnection_handler: (client: Mqtt5Client, errorCode: number, disconnect?: mqtt5_packet.DisconnectPacket) => void,
    on_message_received_handler: (client: Mqtt5Client, message: mqtt5_packet.PublishPacket) => void,
    client_bootstrap?: NativeHandle,
    socket_options?: NativeHandle,
    tls_ctx?: NativeHandle,
    proxy_options?: NativeHandle,
): NativeHandle;

/** @internal */
export function mqtt5_client_start(client: NativeHandle) : void;

/** @internal */
export function mqtt5_client_stop(client: NativeHandle, disconnect_packet?: mqtt5_packet.DisconnectPacket) : void;

/** @internal */
export function mqtt5_client_subscribe(client: NativeHandle, subscribe_packet: mqtt5_packet.SubscribePacket, on_resolution: (client: Mqtt5Client, errorCode: number, suback?: mqtt5_packet.SubackPacket) => void) : void;

/** @internal */
export function mqtt5_client_unsubscribe(client: NativeHandle, unsubscribe_packet: mqtt5_packet.UnsubscribePacket, on_resolution: (client: Mqtt5Client, errorCode: number, unsuback?: mqtt5_packet.UnsubackPacket) => void) : void;

/** @internal */
export function mqtt5_client_publish(client: NativeHandle, publish_packet: mqtt5_packet.PublishPacket, on_resolution: (client: Mqtt5Client, errorCode: number, result: PublishCompletionResult) => void) : void;

/** @internal */
export function mqtt5_client_get_queue_statistics(client: NativeHandle) : ClientStatistics;

/** @internal */
export function mqtt5_client_close(client: NativeHandle) : void;

/* MQTT Client */
/** @internal */
export function mqtt_client_new(client_bootstrap?: NativeHandle): NativeHandle;

/* MQTT Client Connection #TODO: Wrap with ClassBinder */
/** @internal */
export type mqtt_on_connect = (error_code: number, return_code: number, session_present: boolean) => void;

/** @internal */
export function mqtt_client_connection_new(
    client: NativeHandle,
    on_interrupted?: (error_code: number) => void,
    on_resumed?: (return_code: number, session_present: boolean) => void,
    on_success?: (return_code: number, session_present: boolean) => void,
    on_failure?: (error_code: number) => void,
    tls_ctx?: NativeHandle,
    will?: { topic: StringLike, payload: StringLike, qos: number, retain: boolean },
    username?: StringLike,
    password?: StringLike,
    use_websocket?: boolean,
    proxy_options?: NativeHandle,
    websocket_handshake_transform?: (request: HttpRequest, done: (error_code?: number) => void) => void,
    reconnect_min_sec?: number,
    reconnect_max_sec?: number,
): NativeHandle;

/** @internal */
export function mqtt_client_connection_connect(
    connection: NativeHandle,
    client_id: StringLike,
    server_name: StringLike,
    port: number,
    socket_options?: NativeHandle,
    keep_alive_time?: number,
    ping_timeout?: number,
    protocol_operation_timeout?: number,
    clean_session?: boolean,
    on_connect?: mqtt_on_connect,
): void;

/** @internal */
export function mqtt_client_connection_reconnect(connection: NativeHandle, on_connect: mqtt_on_connect): void;

/** @internal */
export function mqtt_client_connection_publish(
    connection: NativeHandle,
    topic: StringLike,
    payload: StringLike,
    qos: number,
    retain: boolean,
    on_publish?: (packet_id: number, error_code: number) => void,
): void;

/** @internal */
export function mqtt_client_connection_subscribe(
    connection: NativeHandle,
    topic: StringLike,
    qos: number,
    on_publish?: OnMessageCallback,
    on_suback?: (packet_id: number, topic: string, qos: QoS, error_code: number) => void,
): void;

/** @internal */
export function mqtt_client_connection_on_message(
    connection: NativeHandle,
    on_publish?: OnMessageCallback
): void;

/** @internal */
export function mqtt_client_connection_on_closed(
    connection: NativeHandle,
    on_closed?: () => void
): void;

/** @internal */
export function mqtt_client_connection_unsubscribe(
    connection: NativeHandle,
    topic: StringLike,
    on_unsuback?: (packet_id: number, error_code: number) => void,
): void;

/** @internal */
export function mqtt_client_connection_disconnect(connection: NativeHandle, on_disconnect?: () => void): void;

/** @internal */
export function mqtt_client_connection_close(connection: NativeHandle): void;

/** @internal */
export function mqtt_client_connection_get_queue_statistics(connection: NativeHandle) : ConnectionStatistics;

/* HTTP */
/* wraps aws_http_proxy_options #TODO: Wrap with ClassBinder */
/** @internal */
export function http_proxy_options_new(
    host_name: StringLike,
    port: number,
    auth_method?: number,
    username?: StringLike,
    password?: StringLike,
    tls_options?: NativeHandle,
    connection_type? : number,
): NativeHandle;

/* wraps aws_http_connection #TODO: Wrap with ClassBinder */
/** @internal */
export function http_connection_new(
    bootstrap: NativeHandle | undefined,
    on_setup: (handle: any, error_code: number) => void,
    on_shutdown: (handle: any, error_code: number) => void,
    host_name: StringLike,
    port: number,
    socket_options?: NativeHandle,
    tls_options?: NativeHandle,
    proxy_options?: NativeHandle,
): NativeHandle;

/** @internal */
export function http_connection_close(connection: NativeHandle): void;

/* wraps aws_http_stream #TODO: Wrap with ClassBinder */
/** @internal */
export function http_stream_new(
    stream: NativeHandle,
    request: HttpRequest,
    on_complete: (error_code: Number) => void,
    on_response: (status_code: Number, headers: HttpHeader[]) => void,
    on_body: (data: ArrayBuffer) => void,
): NativeHandle;

/** @internal */
export function http_stream_activate(stream: NativeHandle): void;

/** @internal */
export function http_stream_close(stream: NativeHandle): void;

/* wraps aws_http_connection_manager #TODO: Wrap with ClassBinder */
/** @internal */
export function http_connection_manager_new(
    bootstrap: NativeHandle | undefined,
    host: StringLike,
    port: number,
    max_connections: number,
    window_size: number,
    socket_options?: NativeHandle,
    tls_options?: NativeHandle,
    proxy_options?: NativeHandle,
    on_shutdown?: () => void,
): NativeHandle;

/** @internal */
export function http_connection_manager_close(manager: NativeHandle): void;

/** @internal */
export function http_connection_manager_acquire(
    manager: NativeHandle,
    on_acquired: (handle: any, error_code: number) => void,
): void;

/** @internal */
export function http_connection_manager_release(manager: NativeHandle, connection: NativeHandle): void;

/**
 * A collection of HTTP headers
 *
 * @module http
 * @category HTTP
 */
export class HttpHeaders implements CommonHttpHeaders {
    /** Construct from a collection of [name, value] pairs */
    constructor(headers?: HttpHeader[]);

    public readonly length: number;

    /**
     * Gets the first value for the given name, ignoring any additional values
     * @param name - The header name to look for
     * @param default_value - Value returned if no values are found for the given name
     * @return The first header value, or default if no values exist
     */
    public get(key: string): string;
    /**
     * Get the list of values for the given name
     * @param name - The header name to look for
     * @return List of values, or empty list if none exist
     */
    public get_values(key: string): string[];

    /** @internal */
    public get_index(index: number): HttpHeader;

    /**
     * Iterator. Allows for:
     * let headers = new HttpHeaders();
     * ...
     * for (const header of headers) { }
    */
    public [Symbol.iterator](): Iterator<HttpHeader>;

    /**
     * Add a name/value pair
     * @param name - The header name
     * @param value - The header value
    */
    public add(key: string, value: string): void;

    /**
     * Set a name/value pair, replacing any existing values for the name
     * @param name - The header name
     * @param value - The header value
    */
    public set(key: string, value: string): void;

    /**
     * Removes all values for the given name
     * @param name - The header to remove all values for
     */
    public remove(key: string): void;

    /**
     * Removes a specific name/value pair
     * @param name - The header name to remove
     * @param value - The header value to remove
     */
    public remove_value(key: string, value: string): void;

    /** Clears the entire header set */
    public clear(): void;

    /** @internal */
    public _flatten(): HttpHeader[];
}

/**
 * Definition for an outgoing HTTP request.
 *
 * The request may be transformed (ex: signing the request) before its data is eventually sent.
 *
 * @internal
 */
export class HttpRequest {
    constructor(method: string, path: string, headers?: HttpHeaders, body?: InputStream);

    /** HTTP request method (verb). Default value is "GET". */
    public method: string;
    /** HTTP path-and-query value. Default value is "/". */
    public path: string;
    /** Optional headers. */
    public readonly headers: HttpHeaders;
    /** Optional body as a stream */
    public body: InputStream;
}

export class AwsCredentialsProvider {
    protected constructor();

    static newDefault(bootstrap?: NativeHandle): AwsCredentialsProvider;
    static newStatic(access_key: StringLike, secret_key: StringLike, session_token?: StringLike): AwsCredentialsProvider;
    static newCognito(config: CognitoCredentialsProviderConfig, tlsContext : NativeHandle, bootstrap?: NativeHandle, httpProxyOptions?: NativeHandle): AwsCredentialsProvider;
    static newX509(config: X509CredentialsConfig, tlsContext : NativeHandle, httpProxyOptions?: NativeHandle): AwsCredentialsProvider;
}

/** @internal */
export function aws_sign_request(
    request: HttpRequest,
    config: AwsSigningConfig,
    on_complete: (error_code: number) => void
): void;

/** @internal */
export function aws_verify_sigv4a_signing(
    request: HttpRequest,
    config: AwsSigningConfig,
    expected_canonical_request: StringLike,
    signature: StringLike,
    ecc_key_pub_x: StringLike,
    ecc_key_pub_y: StringLike
): boolean;

/** @internal */
export function event_stream_client_connection_new(
    connection: eventstream.ClientConnection,
    config: eventstream.ClientConnectionOptions,
    on_disconnect_handler: (connection: eventstream.ClientConnection, errorCode: number) => void,
    on_protocol_message_handler: (connection: eventstream.ClientConnection, message: eventstream.Message) => void,
    socket_options?: NativeHandle,
    tls_ctx?: NativeHandle,
) : NativeHandle;

/** @internal */
export function event_stream_client_connection_close(connection: NativeHandle) : void;

/** @internal */
export function event_stream_client_connection_close_internal(connection: NativeHandle) : void;

/** @internal */
export function event_stream_client_connection_connect(
    connection: NativeHandle,
    completion_callback: (connection: eventstream.ClientConnection, errorCode: number) => void
) : void;

/** @internal */
export function event_stream_client_connection_send_protocol_message(
    connection: NativeHandle,
    options: eventstream.ProtocolMessageOptions,
    completion_callback: (errorCode: number) => void
) : void;

/** @internal */
export function event_stream_client_stream_new(
    stream: eventstream.ClientStream,
    connection: NativeHandle,
    on_stream_ended_handler: (stream: eventstream.ClientStream, errorCode: number) => void,
    on_stream_message_handler: (stream: eventstream.ClientStream, message: eventstream.Message) => void,
) : NativeHandle;

/** @internal */
export function event_stream_client_stream_close(stream: NativeHandle) : void;

/** @internal */
export function event_stream_client_stream_activate(
    stream: NativeHandle,
    options: eventstream.ActivateStreamOptions,
    completion_callback: (stream: eventstream.ClientStream, errorCode: number) => void
) : void;

/** @internal */
export function event_stream_client_stream_send_message(
    stream: NativeHandle,
    options: eventstream.StreamMessageOptions,
    completion_callback: (errorCode: number) => void
) : void;

export const cRuntime: string;
export const CRuntimeType: {
    NON_LINUX: string,
    MUSL: string,
    GLIBC: string
};
