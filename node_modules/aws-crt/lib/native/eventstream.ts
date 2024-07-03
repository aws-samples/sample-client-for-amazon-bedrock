/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import {NativeResourceMixin} from "./native_resource";
import {BufferedEventEmitter} from "../common/event";
import {CrtError} from "./error";
import * as io from "./io";
import * as eventstream_utils from "./eventstream_utils";
import * as cancel from "../common/cancel";
import * as promise from "../common/promise";
import crt_native from "./binding";

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
export enum HeaderType {

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
    UUID = 9,
}

/**
 * Union type for message payloads.
 *
 * Payloads are allowed to be any of the these types in an outbound message.
 * Payloads will always be ArrayBuffers when emitting received messages.
 */
export type Payload = string | ArrayBuffer | ArrayBufferView;

const AWS_MAXIMUM_EVENT_STREAM_HEADER_NAME_LENGTH : number = 127;

type HeaderValue =
    undefined |  /* BooleanTrue, BooleanFalse */
    number |  /* byte, int16, int32, timestamp */
    string |  /* string */
    Payload;  /* ByteBuffer, UUID (via ArrayBuffer), int64 */

/**
 * Wrapper class for event stream message headers.  Similar to HTTP, a header is a name-value pair.  Unlike HTTP, the
 * value's wire format varies depending on a type annotation.  We provide static builder functions to help
 * ensure correct type agreement (type annotation matches actual value) at construction time.  Getting the header
 * value requires the use of a safe conversion function.
 */
export class Header {

    /** @internal */
    constructor(public name: string, public type: HeaderType, public value?: HeaderValue) {}

    private static validateHeaderName(name: string) {
        if (name.length == 0 || name.length > AWS_MAXIMUM_EVENT_STREAM_HEADER_NAME_LENGTH) {
            throw new CrtError(`Event stream header name (${name}) is not valid`);
        }
    }

    /**
     * Create a new boolean-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newBoolean(name: string, value: boolean): Header {
        Header.validateHeaderName(name);

        if (value) {
            return new Header(name, HeaderType.BooleanTrue);
        } else {
            return new Header(name, HeaderType.BooleanFalse);
        }
    }

    /**
     * Create a new byte-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByte(name: string, value: number): Header {
        Header.validateHeaderName(name);

        if (value >= eventstream_utils.MIN_INT8 && value <= eventstream_utils.MAX_INT8 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Byte, value);
        }

        throw new CrtError(`Illegal value for eventstream byte-valued header: ${value}`);
    }

    /**
     * Create a new 16-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt16(name: string, value: number): Header {
        Header.validateHeaderName(name);

        if (value >= eventstream_utils.MIN_INT16 && value <= eventstream_utils.MAX_INT16 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int16, value);
        }

        throw new CrtError(`Illegal value for eventstream int16-valued header: ${value}`);
    }

    /**
     * Create a new 32-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt32(name: string, value: number): Header {
        Header.validateHeaderName(name);

        if (value >= eventstream_utils.MIN_INT32 && value <= eventstream_utils.MAX_INT32 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int32, value);
        }

        throw new CrtError(`Illegal value for eventstream int32-valued header: ${value}`);
    }

    /**
     * Create a new 64-bit-integer-valued message header.  number cannot represent a full 64-bit integer range but
     * its usage is so common that this exists for convenience.  Internally, we always track 64 bit integers as
     * bigints.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromNumber(name: string, value: number): Header {
        Header.validateHeaderName(name);

        if (Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int64, eventstream_utils.marshalInt64BigintAsBuffer(BigInt(value)));
        }

        throw new CrtError(`Illegal value for eventstream int64-valued header: ${value}`);
    }

    /**
     * Create a new 64-bit-integer-valued message header from a big integer.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromBigint(name: string, value: bigint): Header {
        Header.validateHeaderName(name);

        if (value >= eventstream_utils.MIN_INT64 && value <= eventstream_utils.MAX_INT64) {
            return new Header(name, HeaderType.Int64, eventstream_utils.marshalInt64BigintAsBuffer(value));
        }

        throw new CrtError(`Illegal value for eventstream int64-valued header: ${value}`);
    }

    /**
     * Create a new byte-buffer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByteBuffer(name: string, value: Payload): Header {
        Header.validateHeaderName(name);

        return new Header(name, HeaderType.ByteBuffer, value);
    }

    /**
     * Create a new string-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newString(name: string, value: string): Header {
        Header.validateHeaderName(name);

        return new Header(name, HeaderType.String, value);
    }

    /**
     * Create a new timestamp-valued message header from an integral value in seconds since epoch.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromSecondsSinceEpoch(name: string, secondsSinceEpoch: number): Header {
        Header.validateHeaderName(name);

        if (Number.isSafeInteger(secondsSinceEpoch) && secondsSinceEpoch >= 0) {
            return new Header(name, HeaderType.Timestamp, secondsSinceEpoch);
        }

        throw new CrtError(`Illegal value for eventstream timestamp-valued header: ${secondsSinceEpoch}`);
    }

    /**
     * Create a new timestamp-valued message header from a date.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromDate(name: string, date: Date): Header {
        Header.validateHeaderName(name);

        const secondsSinceEpoch: number = date.getTime();
        if (Number.isSafeInteger(secondsSinceEpoch)) {
            return new Header(name, HeaderType.Timestamp, secondsSinceEpoch);
        }

        throw new CrtError(`Illegal value for eventstream timestamp-valued header: ${date}`);
    }

    /**
     * Create a new UUID-valued message header.
     * WIP
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newUUID(name: string, value: ArrayBuffer): Header {
        Header.validateHeaderName(name);

        if (value.byteLength == 16) {
            return new Header(name, HeaderType.UUID, value);
        }

        throw new CrtError(`Illegal value for eventstream uuid-valued header: ${value}`);
    }

    private toValue(type: HeaderType): any {
        if (type != this.type) {
            throw new CrtError(`Header of type (${this.type}) cannot be converted to type (${type})`);
        }

        return this.value;
    }

    /**
     * All conversion functions require the header's type to be appropriately matching.  There are no error-prone
     * flexible conversion helpers.
     */

    /**
     * Returns a boolean header's value.
     */
    asBoolean(): boolean {
        switch (this.type) {
            case HeaderType.BooleanFalse:
                return false;
            case HeaderType.BooleanTrue:
                return true;
            default:
                throw new CrtError(`Header of type (${this.type}) cannot be converted to type (boolean)`);

        }
    }

    /**
     * Returns a byte header's value.
     */
    asByte(): number {
        return this.toValue(HeaderType.Byte) as number;
    }

    /**
     * Returns a 16-bit integer header's value.
     */
    asInt16(): number {
        return this.toValue(HeaderType.Int16) as number;
    }

    /**
     * Returns a 32-bit integer header's value.
     */
    asInt32(): number {
        return this.toValue(HeaderType.Int32) as number;
    }

    /**
     * Returns a 64-bit integer header's value.
     */
    asInt64(): bigint {
        return eventstream_utils.unmarshalInt64BigintFromBuffer(this.toValue(HeaderType.Int64) as ArrayBuffer);
    }

    /**
     * Returns a byte buffer header's value.
     */
    asByteBuffer(): Payload {
        return this.toValue(HeaderType.ByteBuffer) as Payload;
    }

    /**
     * Returns a string header's value.
     */
    asString(): string {
        return this.toValue(HeaderType.String) as string;
    }

    /**
     * Returns a timestamp header's value (as seconds since epoch).
     */
    asTimestamp(): number {
        return this.toValue(HeaderType.Timestamp) as number;
    }

    /**
     * Returns a UUID header's value.
     */
    asUUID(): ArrayBuffer {
        return this.toValue(HeaderType.UUID) as ArrayBuffer;
    }
}

/**
 * Flags for messages in the event-stream RPC protocol.
 *
 * Flags may be XORed together.
 * Not all flags can be used with all message types, consult documentation.
 */
export enum MessageFlags {

    /** Nothing */
    None = 0,

    /**
     * Connection accepted
     *
     * If this flag is absent from a {@link MessageType.ConnectAck ConnectAck} message, the connection has been
     * rejected.
     */
    ConnectionAccepted = 0x1,

    /**
     * Terminate stream
     *
     * This message may be used with any message type.
     * The sender will close their connection after the message is written to the wire.
     * The receiver will close their connection after delivering the message to the user.
     */
    TerminateStream = 0x2,
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
export enum MessageType {

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
    InternalError = 7,
}

/**
 * Wrapper type for all event stream messages, whether they are protocol or application-level.
 */
export interface Message {

    /**
     * Type of message this is
     */
    type: MessageType,

    /**
     * Flags indicating additional boolean message properties
     */
    flags?: MessageFlags,

    /**
     * Message headers associated with this message
     */
    headers?: Array<Header>,

    /**
     * Actual message payload
     */
    payload?: Payload,
}

/** @internal */
function mapPodHeadersToJSHeaders(headers: Array<Header>) : Array<Header> {
    return Array.from(headers, (header) => {
        return new Header(header.name, header.type, header.value);
    });
}

/** @internal */
function mapPodMessageToJSMessage(message: Message) : Message {
    let jsMessage : Message = {
        type: message.type,
        flags: message.flags,
        payload: message.payload
    }

    if (message.headers) {
        jsMessage.headers = mapPodHeadersToJSHeaders(message.headers);
    }

    return jsMessage;
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


/**
 * @internal
 *
 * While not strictly necessary, the single-threaded nature of JS execution allows us to easily apply some
 * rigid constraints to the public API calls of our event stream objects.  This in turn reduces the complexity of the
 * binding cases we need to consider.
 *
 * This state value is the primary means by which we add and enforce these constraints to connection objects.
 *
 * Constraints enforced in the managed binding:
 *
 *  (1) close() may only be called once.  Once it has been called, nothing else may be called.
 *  (2) newStream() and sendMessage() may only be called after successful connection establishment and before the
 *      connection has been closed.
 *  (3) connect() may only be called once.  Combined with (1) and (2), this means that if connect() is called, it must
 *      be the first thing called.
 */
enum ClientConnectionState {
    None,
    Connecting,
    Connected,
    Disconnected,
    Closed,
}

/**
 * Wrapper for a network connection that fulfills the client-side event stream RPC protocol contract.
 *
 * The user **must** call close() on a connection once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
export class ClientConnection extends NativeResourceMixin(BufferedEventEmitter) {

    /**
     * Configures and creates a new ClientConnection instance
     *
     * @param config configuration options for the event stream connection
     */
    constructor(config: ClientConnectionOptions) {
        if (config === undefined) {
            throw new CrtError("Invalid configuration passed to eventstream ClientConnection constructor");
        }

        super();

        this.state = ClientConnectionState.None;

        this._super(crt_native.event_stream_client_connection_new(
            this,
            config,
            (connection: ClientConnection, errorCode: number) => { ClientConnection._s_on_disconnect(connection, errorCode); },
            (connection: ClientConnection, message: Message) => { ClientConnection._s_on_protocol_message(connection, message); },
            config.socketOptions ? config.socketOptions.native_handle() : null,
            config.tlsCtx ? config.tlsCtx.native_handle() : null
        ));
    }

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
    close() : void {
        if (this.state != ClientConnectionState.Closed) {
            this.state = ClientConnectionState.Closed;

            // invoke native binding close
            crt_native.event_stream_client_connection_close(this.native_handle());
        }
    }

    /**
     * Attempts to open a network connection to the configured remote endpoint.  Returned promise will be fulfilled if
     * the transport-level connection is successfully established, and rejected otherwise.
     *
     * connect() may only be called once.
     */
    async connect(options: ConnectOptions) : Promise<void> {
        let cleanupCancelListener : promise.PromiseCleanupFunctor | undefined = undefined;

        let connectPromise : Promise<void> = new Promise<void>((resolve, reject) => {
            if (!options) {
                reject(new CrtError("Invalid options passed to event stream ClientConnection.connect"));
                return;
            }

            if (this.state != ClientConnectionState.None) {
                reject(new CrtError(`Event stream connection in a state (${this.state}) where connect() is not allowed.`));
                return;
            }

            this.state = ClientConnectionState.Connecting;

            if (options.cancelController) {
                let cancel : () => void = () => {
                    reject(new CrtError(`Event stream connection connect() cancelled by external request.`));
                    setImmediate(() => { this.close(); });
                };

                cleanupCancelListener = options.cancelController.addListener(cancel);
                if (!cleanupCancelListener) {
                    return;
                }
            }

            function curriedPromiseCallback(connection: ClientConnection, errorCode: number){
                return ClientConnection._s_on_connection_setup(resolve, reject, connection, errorCode);
            }

            try {
                crt_native.event_stream_client_connection_connect(this.native_handle(), curriedPromiseCallback);
            } catch (e) {
                this.state = ClientConnectionState.Disconnected;
                reject(e);
            }
        });

        return promise.makeSelfCleaningPromise(connectPromise, cleanupCancelListener);
    }

    /**
     * Attempts to send an event stream protocol message over an open connection.
     *
     * @param options configuration -- including the message itself -- for sending a protocol message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    async sendProtocolMessage(options: ProtocolMessageOptions) : Promise<void> {
        let cleanupCancelListener : promise.PromiseCleanupFunctor | undefined = undefined;

        let sendProtocolMessagePromise : Promise<void> = new Promise<void>((resolve, reject) => {
            try {
                if (!options) {
                    reject(new CrtError("Invalid options passed to event stream ClientConnection.sendProtocolMessage"));
                    return;
                }

                if (!this.isConnected()) {
                    reject(new CrtError(`Event stream connection in a state (${this.state}) where sending protocol messages is not allowed.`));
                    return;
                }

                if (options.cancelController) {
                    let cancel : () => void = () => {
                        reject(new CrtError(`Event stream connection sendProtocolMessage() cancelled by external request.`));
                        setImmediate(() => { this.close(); });
                    };

                    cleanupCancelListener = options.cancelController.addListener(cancel);
                    if (!cleanupCancelListener) {
                        return;
                    }
                }

                // invoke native binding send message;
                function curriedPromiseCallback(errorCode: number) {
                    return ClientConnection._s_on_connection_send_protocol_message_completion(resolve, reject, errorCode);
                }

                // invoke native binding send message;
                crt_native.event_stream_client_connection_send_protocol_message(this.native_handle(), options, curriedPromiseCallback);
            } catch (e) {
                reject(e);
            }
        });

        return promise.makeSelfCleaningPromise(sendProtocolMessagePromise, cleanupCancelListener);
    }

    /**
     * Returns true if the connection is currently open and ready-to-use, false otherwise.
     *
     * Internal note: Our notion of "connected" is intentionally not an invocation of
     * aws_event_stream_rpc_client_connection_is_open() (whose status is an out-of-sync race condition vs. our
     * well-defined client state)
     */
    isConnected() : boolean {
        return this.state == ClientConnectionState.Connected;
    }

    /**
     * Creates a new stream within the connection.
     */
    newStream() : ClientStream {
        if (!this.isConnected()) {
            throw new CrtError(`Event stream connection in a state (${this.state}) where creating new streams is forbidden.`);
        }

        return new ClientStream(this);
    }

    /**
     * Event emitted when the connection is closed for any reason.
     *
     * Listener type: {@link DisconnectionListener}
     *
     * @event
     */
    static DISCONNECTION : string = 'disconnection';

    /**
     * Event emitted when a protocol message is received from the remote endpoint
     *
     * Listener type: {@link MessageListener}
     *
     * @event
     */
    static PROTOCOL_MESSAGE : string = 'protocolMessage';

    on(event: 'disconnection', listener: DisconnectionListener): this;

    on(event: 'protocolMessage', listener: MessageListener): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        super.on(event, listener);
        return this;
    }

    private static _s_on_connection_setup(resolve : (value: (void | PromiseLike<void>)) => void, reject : (reason?: any) => void, connection: ClientConnection, errorCode: number) {
        if (errorCode == 0 && connection.state == ClientConnectionState.Connecting) {
            connection.state = ClientConnectionState.Connected;
            resolve();
        } else {
            if (connection.state != ClientConnectionState.Closed) {
                connection.state = ClientConnectionState.Disconnected;
            }

            reject(io.error_code_to_string(errorCode));
        }
    }

    private static _s_on_disconnect(connection: ClientConnection, errorCode: number) {
        if (connection.state != ClientConnectionState.Closed) {
            connection.state = ClientConnectionState.Disconnected;
        }

        process.nextTick(() => {
            connection.emit('disconnection', {errorCode: errorCode});
        });
    }

    private static _s_on_protocol_message(connection: ClientConnection, message: Message) {
        process.nextTick(() => {
            connection.emit('protocolMessage', {message: mapPodMessageToJSMessage(message)});
        });
    }

    private static _s_on_connection_send_protocol_message_completion(resolve : (value: (void | PromiseLike<void>)) => void, reject : (reason?: any) => void, errorCode: number) {
        if (errorCode == 0) {
            resolve();
        } else {
            reject(io.error_code_to_string(errorCode));
        }
    }

    private state : ClientConnectionState;
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

/**
 * @internal
 *
 * While not strictly necessary, the single-threaded nature of JS execution allows us to easily apply some
 * rigid constraints to the public API calls of our event stream objects.  This in turn reduces the complexity of the
 * binding cases we need to consider.
 *
 * This state value is the primary means by which we add and enforce these constraints to stream objects.
 *
 * Constraints enforced in the managed binding:
 *
 *  (1) close() may only be called once.  Once it has been called, nothing else may be called.
 *  (2) sendMessage() may only be called after successful stream activation and before the
 *      stream has been closed.
 *  (3) activate() may only be called once.  Combined with (1) and (2), this means that if activate() is called, it must
 *      be the first thing called.
 */
enum ClientStreamState {
    None,
    Activating,
    Activated,
    Ended,
    Closed,
}

/**
 * Wrapper for an individual stream within an eventstream connection.
 *
 * The user **must** call close() on a stream once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
export class ClientStream extends NativeResourceMixin(BufferedEventEmitter) {

    constructor(connection: ClientConnection) {
        super();

        this._super(crt_native.event_stream_client_stream_new(
            this,
            connection.native_handle(),
            (stream: ClientStream) => { ClientStream._s_on_stream_ended(stream); },
            (stream: ClientStream, message: Message) => { ClientStream._s_on_stream_message(stream, message); },
        ));

        this.state = ClientStreamState.None;
    }

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
    close() : void {
        if (this.state != ClientStreamState.Closed) {
            this.state = ClientStreamState.Closed;

            crt_native.event_stream_client_stream_close(this.native_handle());
        }
    }

    /**
     * Activates the stream, allowing it to start sending and receiving messages.  The promise completes when
     * the activation message has been written to the wire.
     *
     * activate() may only be called once.
     *
     * @param options -- configuration data for stream activation, including operation name and initial message
     */
    async activate(options: ActivateStreamOptions) : Promise<void> {
        let cleanupCancelListener : promise.PromiseCleanupFunctor | undefined = undefined;

        let activatePromise : Promise<void> = new Promise<void>((resolve, reject) => {
            try {
                if (this.state != ClientStreamState.None) {
                    reject(new CrtError(`Event stream in a state (${this.state}) where activation is not allowed.`));
                    return;
                }

                /*
                 * Intentionally check this after the state check (so closed streams do not reach here).
                 * Intentionally mutate state the same way a failed synchronous call to native activate does.
                 */
                if (options === undefined) {
                    this.state = ClientStreamState.Ended;
                    reject(new CrtError("Invalid options passed to ClientStream.activate"));
                    return;
                }

                this.state = ClientStreamState.Activating;

                if (options.cancelController) {
                    let cancel : () => void = () => {
                        reject(new CrtError(`Event stream activate() cancelled by external request.`));
                        setImmediate(() => { this.close(); });
                    };

                    cleanupCancelListener = options.cancelController.addListener(cancel);
                    if (!cleanupCancelListener) {
                        return;
                    }
                }

                function curriedPromiseCallback(stream: ClientStream, errorCode: number){
                    return ClientStream._s_on_stream_activated(resolve, reject, stream, errorCode);
                }

                crt_native.event_stream_client_stream_activate(this.native_handle(), options, curriedPromiseCallback);
            } catch (e) {
                this.state = ClientStreamState.Ended;
                reject(e);
            }
        });

        return promise.makeSelfCleaningPromise<void>(activatePromise, cleanupCancelListener);
    }

    /**
     * Attempts to send an event stream message.
     *
     * @param options configuration -- including the message itself -- for sending a message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    async sendMessage(options: StreamMessageOptions) : Promise<void> {
        let cleanupCancelListener : promise.PromiseCleanupFunctor | undefined = undefined;

        let sendMessagePromise : Promise<void> = new Promise<void>((resolve, reject) => {
            try {
                if (!options) {
                    reject(new CrtError("Invalid options passed to ClientStream.sendMessage"));
                    return;
                }

                if (this.state != ClientStreamState.Activated) {
                    reject(new CrtError(`Event stream in a state (${this.state}) where sending messages is not allowed.`));
                    return;
                }

                if (options.cancelController) {
                    let cancel : cancel.CancelListener = () => {
                        reject(new CrtError(`Event stream sendMessage() cancelled by external request.`));
                        setImmediate(() => { this.close(); });
                    };

                    cleanupCancelListener = options.cancelController.addListener(cancel);
                    if (!cleanupCancelListener) {
                        return;
                    }
                }

                function curriedPromiseCallback(errorCode: number) {
                    return ClientStream._s_on_stream_send_message_completion(resolve, reject, errorCode);
                }

                // invoke native binding send message;
                crt_native.event_stream_client_stream_send_message(this.native_handle(), options, curriedPromiseCallback);
            } catch (e) {
                reject(e);
            }
        });

        return promise.makeSelfCleaningPromise<void>(sendMessagePromise, cleanupCancelListener);
    }

    /**
     * Returns true if the stream is currently active and ready-to-use, false otherwise.
     */
    isActive() : boolean {
        return this.state == ClientStreamState.Activated;
    }

    /**
     * Event emitted when the stream is shut down for any reason.
     *
     * Listener type: {@link StreamEndedListener}
     *
     * @event
     */
    static ENDED : string = 'ended';

    /**
     * Event emitted when a stream message is received from the remote endpoint
     *
     * Listener type: {@link MessageListener}
     *
     * @event
     */
    static MESSAGE : string = 'message';

    on(event: 'ended', listener: StreamEndedListener): this;

    on(event: 'message', listener: MessageListener): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        super.on(event, listener);
        return this;
    }

    private static _s_on_stream_activated(resolve : (value: (void | PromiseLike<void>)) => void, reject : (reason?: any) => void, stream: ClientStream, errorCode: number) {
        if (errorCode == 0 && stream.state == ClientStreamState.Activating) {
            stream.state = ClientStreamState.Activated;
            resolve();
        } else {
            if (stream.state != ClientStreamState.Closed) {
                stream.state = ClientStreamState.Ended;
            }

            reject(io.error_code_to_string(errorCode));
        }
    }

    private static _s_on_stream_send_message_completion(resolve : (value: (void | PromiseLike<void>)) => void, reject : (reason?: any) => void, errorCode: number) {
        if (errorCode == 0) {
            resolve();
        } else {
            reject(io.error_code_to_string(errorCode));
        }
    }

    private static _s_on_stream_ended(stream: ClientStream) {
        process.nextTick(() => {
            stream.emit(ClientStream.ENDED, {});
        });
    }

    private static _s_on_stream_message(stream: ClientStream, message: Message) {
        process.nextTick(() => {
            stream.emit(ClientStream.MESSAGE, {message: mapPodMessageToJSMessage(message)});
        });
    }

    private state : ClientStreamState;
}