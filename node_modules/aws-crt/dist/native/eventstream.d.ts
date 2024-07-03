import { BufferedEventEmitter } from "../common/event";
import * as io from "./io";
import * as cancel from "../common/cancel";
/**
 * Node.js specific eventstream rpc native bindings
 *
 * @packageDocumentation
 * @module eventstream
 * @mergeTarget
 *
 */
/**
 * Supported types for the value within an eventstream message header
 */
export declare enum HeaderType {
    /** Value is True. No actual value is transmitted on the wire. */
    BooleanTrue = 0,
    /** Value is True. No actual value is transmitted on the wire. */
    BooleanFalse = 1,
    /** Value is signed 8-bit int. */
    Byte = 2,
    /** Value is signed 16-bit int. */
    Int16 = 3,
    /** Value is signed 32-bit int. */
    Int32 = 4,
    /** Value is signed 64-bit int. */
    Int64 = 5,
    /** Value is raw bytes. */
    ByteBuffer = 6,
    /** Value is a str.  Transmitted on the wire as utf-8. */
    String = 7,
    /** Value is a posix timestamp (seconds since Unix epoch).  Transmitted on the wire as a 64-bit int. */
    Timestamp = 8,
    /** Value is a UUID. Transmitted on the wire as 16 bytes. */
    UUID = 9
}
/**
 * Union type for message payloads.
 *
 * Payloads are allowed to be any of the these types in an outbound message.
 * Payloads will always be ArrayBuffers when emitting received messages.
 */
export type Payload = string | ArrayBuffer | ArrayBufferView;
type HeaderValue = undefined | /* BooleanTrue, BooleanFalse */ number | /* byte, int16, int32, timestamp */ string | /* string */ Payload;
/**
 * Wrapper class for event stream message headers.  Similar to HTTP, a header is a name-value pair.  Unlike HTTP, the
 * value's wire format varies depending on a type annotation.  We provide static builder functions to help
 * ensure correct type agreement (type annotation matches actual value) at construction time.  Getting the header
 * value requires the use of a safe conversion function.
 */
export declare class Header {
    name: string;
    type: HeaderType;
    value?: HeaderValue;
    /** @internal */
    constructor(name: string, type: HeaderType, value?: HeaderValue);
    private static validateHeaderName;
    /**
     * Create a new boolean-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newBoolean(name: string, value: boolean): Header;
    /**
     * Create a new byte-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByte(name: string, value: number): Header;
    /**
     * Create a new 16-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt16(name: string, value: number): Header;
    /**
     * Create a new 32-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt32(name: string, value: number): Header;
    /**
     * Create a new 64-bit-integer-valued message header.  number cannot represent a full 64-bit integer range but
     * its usage is so common that this exists for convenience.  Internally, we always track 64 bit integers as
     * bigints.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromNumber(name: string, value: number): Header;
    /**
     * Create a new 64-bit-integer-valued message header from a big integer.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromBigint(name: string, value: bigint): Header;
    /**
     * Create a new byte-buffer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByteBuffer(name: string, value: Payload): Header;
    /**
     * Create a new string-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newString(name: string, value: string): Header;
    /**
     * Create a new timestamp-valued message header from an integral value in seconds since epoch.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromSecondsSinceEpoch(name: string, secondsSinceEpoch: number): Header;
    /**
     * Create a new timestamp-valued message header from a date.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromDate(name: string, date: Date): Header;
    /**
     * Create a new UUID-valued message header.
     * WIP
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newUUID(name: string, value: ArrayBuffer): Header;
    private toValue;
    /**
     * All conversion functions require the header's type to be appropriately matching.  There are no error-prone
     * flexible conversion helpers.
     */
    /**
     * Returns a boolean header's value.
     */
    asBoolean(): boolean;
    /**
     * Returns a byte header's value.
     */
    asByte(): number;
    /**
     * Returns a 16-bit integer header's value.
     */
    asInt16(): number;
    /**
     * Returns a 32-bit integer header's value.
     */
    asInt32(): number;
    /**
     * Returns a 64-bit integer header's value.
     */
    asInt64(): bigint;
    /**
     * Returns a byte buffer header's value.
     */
    asByteBuffer(): Payload;
    /**
     * Returns a string header's value.
     */
    asString(): string;
    /**
     * Returns a timestamp header's value (as seconds since epoch).
     */
    asTimestamp(): number;
    /**
     * Returns a UUID header's value.
     */
    asUUID(): ArrayBuffer;
}
/**
 * Flags for messages in the event-stream RPC protocol.
 *
 * Flags may be XORed together.
 * Not all flags can be used with all message types, consult documentation.
 */
export declare enum MessageFlags {
    /** Nothing */
    None = 0,
    /**
     * Connection accepted
     *
     * If this flag is absent from a {@link MessageType.ConnectAck ConnectAck} message, the connection has been
     * rejected.
     */
    ConnectionAccepted = 1,
    /**
     * Terminate stream
     *
     * This message may be used with any message type.
     * The sender will close their connection after the message is written to the wire.
     * The receiver will close their connection after delivering the message to the user.
     */
    TerminateStream = 2
}
/**
 *
 * Types of messages in the event-stream RPC protocol.
 * The {@link MessageType.ApplicationMessage Application} and {@link MessageType.ApplicationError Error} message types
 * may only be sent on streams, and will never arrive as a protocol message (stream-id 0).
 *
 * For all other message types, they may only be sent as protocol messages
 * (stream-id 0), and will never arrive as a stream message.
 *
 * Different message types expect specific headers and flags, consult documentation.
 */
export declare enum MessageType {
    /** Application message */
    ApplicationMessage = 0,
    /** Application error */
    ApplicationError = 1,
    /** Ping */
    Ping = 2,
    /** Ping response */
    PingResponse = 3,
    /** Connect */
    Connect = 4,
    /**
     * Connect acknowledgement
     *
     * If the {@link MessageFlags.ConnectionAccepted ConnectionAccepted} flag is not present, the connection has been rejected.
     */
    ConnectAck = 5,
    /**
     * Protocol error
     */
    ProtocolError = 6,
    /**
     * Internal error
     */
    InternalError = 7
}
/**
 * Wrapper type for all event stream messages, whether they are protocol or application-level.
 */
export interface Message {
    /**
     * Type of message this is
     */
    type: MessageType;
    /**
     * Flags indicating additional boolean message properties
     */
    flags?: MessageFlags;
    /**
     * Message headers associated with this message
     */
    headers?: Array<Header>;
    /**
     * Actual message payload
     */
    payload?: Payload;
}
/**
 * Eventstream client connection configuration options.
 */
export interface ClientConnectionOptions {
    /**
     * Name of the host to connect to
     */
    hostName: string;
    /**
     * Port of the host to connect to
     */
    port: number;
    /**
     * Optional, additional socket options for the desired connection
     */
    socketOptions?: io.SocketOptions;
    /**
     * TLS context for the desired connection
     */
    tlsCtx?: io.ClientTlsContext;
}
/**
 * Options for opening a connection to an eventstream server
 */
export interface ConnectOptions {
    /**
     * Optional controller that allows the cancellation of asynchronous eventstream operations
     */
    cancelController?: cancel.ICancelController;
}
/**
 * Options for sending a protocol message over the client connection.
 */
export interface ProtocolMessageOptions {
    /**
     * Protocol message to send
     */
    message: Message;
    /**
     * Optional controller that allows the cancellation of asynchronous eventstream operations
     */
    cancelController?: cancel.ICancelController;
}
/**
 * Options for activating an event stream within the client connection.
 */
export interface ActivateStreamOptions {
    /**
     * Name of the operation that should be associated with this stream.
     */
    operation: string;
    /**
     * Application message to send as part of activating the stream.
     */
    message: Message;
    /**
     * Optional controller that allows the cancellation of asynchronous eventstream operations
     */
    cancelController?: cancel.ICancelController;
}
/**
 * Options for sending an application message within an event stream
 */
export interface StreamMessageOptions {
    /**
     * Application message to send.
     */
    message: Message;
    /**
     * Optional controller that allows the cancellation of asynchronous eventstream operations
     */
    cancelController?: cancel.ICancelController;
}
/**
 * Event emitted when an event stream connection has been fully shut down.  The connection is unusable afterwards, but
 * close() must still be called in order to release the native resources.
 */
export interface DisconnectionEvent {
    /**
     * Native error code.  Convert to a descriptive string with error_code_to_string()
     */
    errorCode: number;
}
/**
 * Event emitted when a message is received on an event stream connection.  When emitted by the connection, this
 * is a protocol message.  When emitted by a stream, it is an application message.
 */
export interface MessageEvent {
    /**
     * Event stream message received by the connection/stream.
     */
    message: Message;
}
/**
 * Signature for a handler that listens to event stream message events.
 */
export type MessageListener = (eventData: MessageEvent) => void;
/**
 * Signature for a handler that listens to event stream disconnection events.
 */
export type DisconnectionListener = (eventData: DisconnectionEvent) => void;
declare const ClientConnection_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
/**
 * Wrapper for a network connection that fulfills the client-side event stream RPC protocol contract.
 *
 * The user **must** call close() on a connection once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
export declare class ClientConnection extends ClientConnection_base {
    /**
     * Configures and creates a new ClientConnection instance
     *
     * @param config configuration options for the event stream connection
     */
    constructor(config: ClientConnectionOptions);
    /**
     * Shuts down the connection (if active) and begins the process to release native resources associated with it by
     * having the native binding release the only reference to the extern object representing the connection.  Once
     * close() has been called, no more events will be emitted and all public API invocations will trigger an exception.
     *
     * Ultimately, the native resources will not be released until the connection has fully shut down and that
     * shutdown event has reached the libuv event loop.
     *
     * This function **must** be called for every ClientConnection instance or native resources will leak.
     */
    close(): void;
    /**
     * Attempts to open a network connection to the configured remote endpoint.  Returned promise will be fulfilled if
     * the transport-level connection is successfully established, and rejected otherwise.
     *
     * connect() may only be called once.
     */
    connect(options: ConnectOptions): Promise<void>;
    /**
     * Attempts to send an event stream protocol message over an open connection.
     *
     * @param options configuration -- including the message itself -- for sending a protocol message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    sendProtocolMessage(options: ProtocolMessageOptions): Promise<void>;
    /**
     * Returns true if the connection is currently open and ready-to-use, false otherwise.
     *
     * Internal note: Our notion of "connected" is intentionally not an invocation of
     * aws_event_stream_rpc_client_connection_is_open() (whose status is an out-of-sync race condition vs. our
     * well-defined client state)
     */
    isConnected(): boolean;
    /**
     * Creates a new stream within the connection.
     */
    newStream(): ClientStream;
    /**
     * Event emitted when the connection is closed for any reason.
     *
     * Listener type: {@link DisconnectionListener}
     *
     * @event
     */
    static DISCONNECTION: string;
    /**
     * Event emitted when a protocol message is received from the remote endpoint
     *
     * Listener type: {@link MessageListener}
     *
     * @event
     */
    static PROTOCOL_MESSAGE: string;
    on(event: 'disconnection', listener: DisconnectionListener): this;
    on(event: 'protocolMessage', listener: MessageListener): this;
    private static _s_on_connection_setup;
    private static _s_on_disconnect;
    private static _s_on_protocol_message;
    private static _s_on_connection_send_protocol_message_completion;
    private state;
}
/**
 * Event emitted when the stream has ended.  At most one stream ended event will ever be emitted by a single
 * stream.
 */
export interface StreamEndedEvent {
}
/**
 * Signature for a handler that listens to stream ended events.
 */
export type StreamEndedListener = (eventData: StreamEndedEvent) => void;
declare const ClientStream_base: {
    new (...args: any[]): {
        _handle: any;
        _super(handle: any): void;
        native_handle(): any;
    };
} & typeof BufferedEventEmitter;
/**
 * Wrapper for an individual stream within an eventstream connection.
 *
 * The user **must** call close() on a stream once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
export declare class ClientStream extends ClientStream_base {
    constructor(connection: ClientConnection);
    /**
     * Shuts down the stream (if active) and begins the process to release native resources associated with it by
     * having the native binding release the only reference to the extern object representing the stream.  Once
     * close() has been called, no more events will be emitted and all public API invocations will trigger an exception.
     *
     * Ultimately, the native resources will not be released until the native stream has fully shut down and that
     * shutdown event has reached the libuv event loop.
     *
     * This function **must** be called for every ClientStream instance or native resources will leak.
     */
    close(): void;
    /**
     * Activates the stream, allowing it to start sending and receiving messages.  The promise completes when
     * the activation message has been written to the wire.
     *
     * activate() may only be called once.
     *
     * @param options -- configuration data for stream activation, including operation name and initial message
     */
    activate(options: ActivateStreamOptions): Promise<void>;
    /**
     * Attempts to send an event stream message.
     *
     * @param options configuration -- including the message itself -- for sending a message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    sendMessage(options: StreamMessageOptions): Promise<void>;
    /**
     * Returns true if the stream is currently active and ready-to-use, false otherwise.
     */
    isActive(): boolean;
    /**
     * Event emitted when the stream is shut down for any reason.
     *
     * Listener type: {@link StreamEndedListener}
     *
     * @event
     */
    static ENDED: string;
    /**
     * Event emitted when a stream message is received from the remote endpoint
     *
     * Listener type: {@link MessageListener}
     *
     * @event
     */
    static MESSAGE: string;
    on(event: 'ended', listener: StreamEndedListener): this;
    on(event: 'message', listener: MessageListener): this;
    private static _s_on_stream_activated;
    private static _s_on_stream_send_message_completion;
    private static _s_on_stream_ended;
    private static _s_on_stream_message;
    private state;
}
export {};
