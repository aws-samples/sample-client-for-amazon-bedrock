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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientStream = exports.ClientConnection = exports.MessageType = exports.MessageFlags = exports.Header = exports.HeaderType = void 0;
const native_resource_1 = require("./native_resource");
const event_1 = require("../common/event");
const error_1 = require("./error");
const io = __importStar(require("./io"));
const eventstream_utils = __importStar(require("./eventstream_utils"));
const promise = __importStar(require("../common/promise"));
const binding_1 = __importDefault(require("./binding"));
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
var HeaderType;
(function (HeaderType) {
    /** Value is True. No actual value is transmitted on the wire. */
    HeaderType[HeaderType["BooleanTrue"] = 0] = "BooleanTrue";
    /** Value is True. No actual value is transmitted on the wire. */
    HeaderType[HeaderType["BooleanFalse"] = 1] = "BooleanFalse";
    /** Value is signed 8-bit int. */
    HeaderType[HeaderType["Byte"] = 2] = "Byte";
    /** Value is signed 16-bit int. */
    HeaderType[HeaderType["Int16"] = 3] = "Int16";
    /** Value is signed 32-bit int. */
    HeaderType[HeaderType["Int32"] = 4] = "Int32";
    /** Value is signed 64-bit int. */
    HeaderType[HeaderType["Int64"] = 5] = "Int64";
    /** Value is raw bytes. */
    HeaderType[HeaderType["ByteBuffer"] = 6] = "ByteBuffer";
    /** Value is a str.  Transmitted on the wire as utf-8. */
    HeaderType[HeaderType["String"] = 7] = "String";
    /** Value is a posix timestamp (seconds since Unix epoch).  Transmitted on the wire as a 64-bit int. */
    HeaderType[HeaderType["Timestamp"] = 8] = "Timestamp";
    /** Value is a UUID. Transmitted on the wire as 16 bytes. */
    HeaderType[HeaderType["UUID"] = 9] = "UUID";
})(HeaderType = exports.HeaderType || (exports.HeaderType = {}));
const AWS_MAXIMUM_EVENT_STREAM_HEADER_NAME_LENGTH = 127;
/**
 * Wrapper class for event stream message headers.  Similar to HTTP, a header is a name-value pair.  Unlike HTTP, the
 * value's wire format varies depending on a type annotation.  We provide static builder functions to help
 * ensure correct type agreement (type annotation matches actual value) at construction time.  Getting the header
 * value requires the use of a safe conversion function.
 */
class Header {
    /** @internal */
    constructor(name, type, value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
    static validateHeaderName(name) {
        if (name.length == 0 || name.length > AWS_MAXIMUM_EVENT_STREAM_HEADER_NAME_LENGTH) {
            throw new error_1.CrtError(`Event stream header name (${name}) is not valid`);
        }
    }
    /**
     * Create a new boolean-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newBoolean(name, value) {
        Header.validateHeaderName(name);
        if (value) {
            return new Header(name, HeaderType.BooleanTrue);
        }
        else {
            return new Header(name, HeaderType.BooleanFalse);
        }
    }
    /**
     * Create a new byte-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByte(name, value) {
        Header.validateHeaderName(name);
        if (value >= eventstream_utils.MIN_INT8 && value <= eventstream_utils.MAX_INT8 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Byte, value);
        }
        throw new error_1.CrtError(`Illegal value for eventstream byte-valued header: ${value}`);
    }
    /**
     * Create a new 16-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt16(name, value) {
        Header.validateHeaderName(name);
        if (value >= eventstream_utils.MIN_INT16 && value <= eventstream_utils.MAX_INT16 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int16, value);
        }
        throw new error_1.CrtError(`Illegal value for eventstream int16-valued header: ${value}`);
    }
    /**
     * Create a new 32-bit-integer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt32(name, value) {
        Header.validateHeaderName(name);
        if (value >= eventstream_utils.MIN_INT32 && value <= eventstream_utils.MAX_INT32 && Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int32, value);
        }
        throw new error_1.CrtError(`Illegal value for eventstream int32-valued header: ${value}`);
    }
    /**
     * Create a new 64-bit-integer-valued message header.  number cannot represent a full 64-bit integer range but
     * its usage is so common that this exists for convenience.  Internally, we always track 64 bit integers as
     * bigints.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromNumber(name, value) {
        Header.validateHeaderName(name);
        if (Number.isSafeInteger(value)) {
            return new Header(name, HeaderType.Int64, eventstream_utils.marshalInt64BigintAsBuffer(BigInt(value)));
        }
        throw new error_1.CrtError(`Illegal value for eventstream int64-valued header: ${value}`);
    }
    /**
     * Create a new 64-bit-integer-valued message header from a big integer.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newInt64FromBigint(name, value) {
        Header.validateHeaderName(name);
        if (value >= eventstream_utils.MIN_INT64 && value <= eventstream_utils.MAX_INT64) {
            return new Header(name, HeaderType.Int64, eventstream_utils.marshalInt64BigintAsBuffer(value));
        }
        throw new error_1.CrtError(`Illegal value for eventstream int64-valued header: ${value}`);
    }
    /**
     * Create a new byte-buffer-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newByteBuffer(name, value) {
        Header.validateHeaderName(name);
        return new Header(name, HeaderType.ByteBuffer, value);
    }
    /**
     * Create a new string-valued message header
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newString(name, value) {
        Header.validateHeaderName(name);
        return new Header(name, HeaderType.String, value);
    }
    /**
     * Create a new timestamp-valued message header from an integral value in seconds since epoch.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromSecondsSinceEpoch(name, secondsSinceEpoch) {
        Header.validateHeaderName(name);
        if (Number.isSafeInteger(secondsSinceEpoch) && secondsSinceEpoch >= 0) {
            return new Header(name, HeaderType.Timestamp, secondsSinceEpoch);
        }
        throw new error_1.CrtError(`Illegal value for eventstream timestamp-valued header: ${secondsSinceEpoch}`);
    }
    /**
     * Create a new timestamp-valued message header from a date.
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newTimeStampFromDate(name, date) {
        Header.validateHeaderName(name);
        const secondsSinceEpoch = date.getTime();
        if (Number.isSafeInteger(secondsSinceEpoch)) {
            return new Header(name, HeaderType.Timestamp, secondsSinceEpoch);
        }
        throw new error_1.CrtError(`Illegal value for eventstream timestamp-valued header: ${date}`);
    }
    /**
     * Create a new UUID-valued message header.
     * WIP
     *
     * @param name name of the header
     * @param value value of the header
     */
    static newUUID(name, value) {
        Header.validateHeaderName(name);
        if (value.byteLength == 16) {
            return new Header(name, HeaderType.UUID, value);
        }
        throw new error_1.CrtError(`Illegal value for eventstream uuid-valued header: ${value}`);
    }
    toValue(type) {
        if (type != this.type) {
            throw new error_1.CrtError(`Header of type (${this.type}) cannot be converted to type (${type})`);
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
    asBoolean() {
        switch (this.type) {
            case HeaderType.BooleanFalse:
                return false;
            case HeaderType.BooleanTrue:
                return true;
            default:
                throw new error_1.CrtError(`Header of type (${this.type}) cannot be converted to type (boolean)`);
        }
    }
    /**
     * Returns a byte header's value.
     */
    asByte() {
        return this.toValue(HeaderType.Byte);
    }
    /**
     * Returns a 16-bit integer header's value.
     */
    asInt16() {
        return this.toValue(HeaderType.Int16);
    }
    /**
     * Returns a 32-bit integer header's value.
     */
    asInt32() {
        return this.toValue(HeaderType.Int32);
    }
    /**
     * Returns a 64-bit integer header's value.
     */
    asInt64() {
        return eventstream_utils.unmarshalInt64BigintFromBuffer(this.toValue(HeaderType.Int64));
    }
    /**
     * Returns a byte buffer header's value.
     */
    asByteBuffer() {
        return this.toValue(HeaderType.ByteBuffer);
    }
    /**
     * Returns a string header's value.
     */
    asString() {
        return this.toValue(HeaderType.String);
    }
    /**
     * Returns a timestamp header's value (as seconds since epoch).
     */
    asTimestamp() {
        return this.toValue(HeaderType.Timestamp);
    }
    /**
     * Returns a UUID header's value.
     */
    asUUID() {
        return this.toValue(HeaderType.UUID);
    }
}
exports.Header = Header;
/**
 * Flags for messages in the event-stream RPC protocol.
 *
 * Flags may be XORed together.
 * Not all flags can be used with all message types, consult documentation.
 */
var MessageFlags;
(function (MessageFlags) {
    /** Nothing */
    MessageFlags[MessageFlags["None"] = 0] = "None";
    /**
     * Connection accepted
     *
     * If this flag is absent from a {@link MessageType.ConnectAck ConnectAck} message, the connection has been
     * rejected.
     */
    MessageFlags[MessageFlags["ConnectionAccepted"] = 1] = "ConnectionAccepted";
    /**
     * Terminate stream
     *
     * This message may be used with any message type.
     * The sender will close their connection after the message is written to the wire.
     * The receiver will close their connection after delivering the message to the user.
     */
    MessageFlags[MessageFlags["TerminateStream"] = 2] = "TerminateStream";
})(MessageFlags = exports.MessageFlags || (exports.MessageFlags = {}));
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
var MessageType;
(function (MessageType) {
    /** Application message */
    MessageType[MessageType["ApplicationMessage"] = 0] = "ApplicationMessage";
    /** Application error */
    MessageType[MessageType["ApplicationError"] = 1] = "ApplicationError";
    /** Ping */
    MessageType[MessageType["Ping"] = 2] = "Ping";
    /** Ping response */
    MessageType[MessageType["PingResponse"] = 3] = "PingResponse";
    /** Connect */
    MessageType[MessageType["Connect"] = 4] = "Connect";
    /**
     * Connect acknowledgement
     *
     * If the {@link MessageFlags.ConnectionAccepted ConnectionAccepted} flag is not present, the connection has been rejected.
     */
    MessageType[MessageType["ConnectAck"] = 5] = "ConnectAck";
    /**
     * Protocol error
     */
    MessageType[MessageType["ProtocolError"] = 6] = "ProtocolError";
    /**
     * Internal error
     */
    MessageType[MessageType["InternalError"] = 7] = "InternalError";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
/** @internal */
function mapPodHeadersToJSHeaders(headers) {
    return Array.from(headers, (header) => {
        return new Header(header.name, header.type, header.value);
    });
}
/** @internal */
function mapPodMessageToJSMessage(message) {
    let jsMessage = {
        type: message.type,
        flags: message.flags,
        payload: message.payload
    };
    if (message.headers) {
        jsMessage.headers = mapPodHeadersToJSHeaders(message.headers);
    }
    return jsMessage;
}
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
var ClientConnectionState;
(function (ClientConnectionState) {
    ClientConnectionState[ClientConnectionState["None"] = 0] = "None";
    ClientConnectionState[ClientConnectionState["Connecting"] = 1] = "Connecting";
    ClientConnectionState[ClientConnectionState["Connected"] = 2] = "Connected";
    ClientConnectionState[ClientConnectionState["Disconnected"] = 3] = "Disconnected";
    ClientConnectionState[ClientConnectionState["Closed"] = 4] = "Closed";
})(ClientConnectionState || (ClientConnectionState = {}));
/**
 * Wrapper for a network connection that fulfills the client-side event stream RPC protocol contract.
 *
 * The user **must** call close() on a connection once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
class ClientConnection extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    /**
     * Configures and creates a new ClientConnection instance
     *
     * @param config configuration options for the event stream connection
     */
    constructor(config) {
        if (config === undefined) {
            throw new error_1.CrtError("Invalid configuration passed to eventstream ClientConnection constructor");
        }
        super();
        this.state = ClientConnectionState.None;
        this._super(binding_1.default.event_stream_client_connection_new(this, config, (connection, errorCode) => { ClientConnection._s_on_disconnect(connection, errorCode); }, (connection, message) => { ClientConnection._s_on_protocol_message(connection, message); }, config.socketOptions ? config.socketOptions.native_handle() : null, config.tlsCtx ? config.tlsCtx.native_handle() : null));
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
    close() {
        if (this.state != ClientConnectionState.Closed) {
            this.state = ClientConnectionState.Closed;
            // invoke native binding close
            binding_1.default.event_stream_client_connection_close(this.native_handle());
        }
    }
    /**
     * Attempts to open a network connection to the configured remote endpoint.  Returned promise will be fulfilled if
     * the transport-level connection is successfully established, and rejected otherwise.
     *
     * connect() may only be called once.
     */
    connect(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanupCancelListener = undefined;
            let connectPromise = new Promise((resolve, reject) => {
                if (!options) {
                    reject(new error_1.CrtError("Invalid options passed to event stream ClientConnection.connect"));
                    return;
                }
                if (this.state != ClientConnectionState.None) {
                    reject(new error_1.CrtError(`Event stream connection in a state (${this.state}) where connect() is not allowed.`));
                    return;
                }
                this.state = ClientConnectionState.Connecting;
                if (options.cancelController) {
                    let cancel = () => {
                        reject(new error_1.CrtError(`Event stream connection connect() cancelled by external request.`));
                        setImmediate(() => { this.close(); });
                    };
                    cleanupCancelListener = options.cancelController.addListener(cancel);
                    if (!cleanupCancelListener) {
                        return;
                    }
                }
                function curriedPromiseCallback(connection, errorCode) {
                    return ClientConnection._s_on_connection_setup(resolve, reject, connection, errorCode);
                }
                try {
                    binding_1.default.event_stream_client_connection_connect(this.native_handle(), curriedPromiseCallback);
                }
                catch (e) {
                    this.state = ClientConnectionState.Disconnected;
                    reject(e);
                }
            });
            return promise.makeSelfCleaningPromise(connectPromise, cleanupCancelListener);
        });
    }
    /**
     * Attempts to send an event stream protocol message over an open connection.
     *
     * @param options configuration -- including the message itself -- for sending a protocol message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    sendProtocolMessage(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanupCancelListener = undefined;
            let sendProtocolMessagePromise = new Promise((resolve, reject) => {
                try {
                    if (!options) {
                        reject(new error_1.CrtError("Invalid options passed to event stream ClientConnection.sendProtocolMessage"));
                        return;
                    }
                    if (!this.isConnected()) {
                        reject(new error_1.CrtError(`Event stream connection in a state (${this.state}) where sending protocol messages is not allowed.`));
                        return;
                    }
                    if (options.cancelController) {
                        let cancel = () => {
                            reject(new error_1.CrtError(`Event stream connection sendProtocolMessage() cancelled by external request.`));
                            setImmediate(() => { this.close(); });
                        };
                        cleanupCancelListener = options.cancelController.addListener(cancel);
                        if (!cleanupCancelListener) {
                            return;
                        }
                    }
                    // invoke native binding send message;
                    function curriedPromiseCallback(errorCode) {
                        return ClientConnection._s_on_connection_send_protocol_message_completion(resolve, reject, errorCode);
                    }
                    // invoke native binding send message;
                    binding_1.default.event_stream_client_connection_send_protocol_message(this.native_handle(), options, curriedPromiseCallback);
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise.makeSelfCleaningPromise(sendProtocolMessagePromise, cleanupCancelListener);
        });
    }
    /**
     * Returns true if the connection is currently open and ready-to-use, false otherwise.
     *
     * Internal note: Our notion of "connected" is intentionally not an invocation of
     * aws_event_stream_rpc_client_connection_is_open() (whose status is an out-of-sync race condition vs. our
     * well-defined client state)
     */
    isConnected() {
        return this.state == ClientConnectionState.Connected;
    }
    /**
     * Creates a new stream within the connection.
     */
    newStream() {
        if (!this.isConnected()) {
            throw new error_1.CrtError(`Event stream connection in a state (${this.state}) where creating new streams is forbidden.`);
        }
        return new ClientStream(this);
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
    static _s_on_connection_setup(resolve, reject, connection, errorCode) {
        if (errorCode == 0 && connection.state == ClientConnectionState.Connecting) {
            connection.state = ClientConnectionState.Connected;
            resolve();
        }
        else {
            if (connection.state != ClientConnectionState.Closed) {
                connection.state = ClientConnectionState.Disconnected;
            }
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_disconnect(connection, errorCode) {
        if (connection.state != ClientConnectionState.Closed) {
            connection.state = ClientConnectionState.Disconnected;
        }
        process.nextTick(() => {
            connection.emit('disconnection', { errorCode: errorCode });
        });
    }
    static _s_on_protocol_message(connection, message) {
        process.nextTick(() => {
            connection.emit('protocolMessage', { message: mapPodMessageToJSMessage(message) });
        });
    }
    static _s_on_connection_send_protocol_message_completion(resolve, reject, errorCode) {
        if (errorCode == 0) {
            resolve();
        }
        else {
            reject(io.error_code_to_string(errorCode));
        }
    }
}
exports.ClientConnection = ClientConnection;
/**
 * Event emitted when the connection is closed for any reason.
 *
 * Listener type: {@link DisconnectionListener}
 *
 * @event
 */
ClientConnection.DISCONNECTION = 'disconnection';
/**
 * Event emitted when a protocol message is received from the remote endpoint
 *
 * Listener type: {@link MessageListener}
 *
 * @event
 */
ClientConnection.PROTOCOL_MESSAGE = 'protocolMessage';
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
var ClientStreamState;
(function (ClientStreamState) {
    ClientStreamState[ClientStreamState["None"] = 0] = "None";
    ClientStreamState[ClientStreamState["Activating"] = 1] = "Activating";
    ClientStreamState[ClientStreamState["Activated"] = 2] = "Activated";
    ClientStreamState[ClientStreamState["Ended"] = 3] = "Ended";
    ClientStreamState[ClientStreamState["Closed"] = 4] = "Closed";
})(ClientStreamState || (ClientStreamState = {}));
/**
 * Wrapper for an individual stream within an eventstream connection.
 *
 * The user **must** call close() on a stream once finished with it.  Once close() has been called, no more events
 * will be emitted and all public API invocations will trigger an exception.
 */
class ClientStream extends (0, native_resource_1.NativeResourceMixin)(event_1.BufferedEventEmitter) {
    constructor(connection) {
        super();
        this._super(binding_1.default.event_stream_client_stream_new(this, connection.native_handle(), (stream) => { ClientStream._s_on_stream_ended(stream); }, (stream, message) => { ClientStream._s_on_stream_message(stream, message); }));
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
    close() {
        if (this.state != ClientStreamState.Closed) {
            this.state = ClientStreamState.Closed;
            binding_1.default.event_stream_client_stream_close(this.native_handle());
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
    activate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanupCancelListener = undefined;
            let activatePromise = new Promise((resolve, reject) => {
                try {
                    if (this.state != ClientStreamState.None) {
                        reject(new error_1.CrtError(`Event stream in a state (${this.state}) where activation is not allowed.`));
                        return;
                    }
                    /*
                     * Intentionally check this after the state check (so closed streams do not reach here).
                     * Intentionally mutate state the same way a failed synchronous call to native activate does.
                     */
                    if (options === undefined) {
                        this.state = ClientStreamState.Ended;
                        reject(new error_1.CrtError("Invalid options passed to ClientStream.activate"));
                        return;
                    }
                    this.state = ClientStreamState.Activating;
                    if (options.cancelController) {
                        let cancel = () => {
                            reject(new error_1.CrtError(`Event stream activate() cancelled by external request.`));
                            setImmediate(() => { this.close(); });
                        };
                        cleanupCancelListener = options.cancelController.addListener(cancel);
                        if (!cleanupCancelListener) {
                            return;
                        }
                    }
                    function curriedPromiseCallback(stream, errorCode) {
                        return ClientStream._s_on_stream_activated(resolve, reject, stream, errorCode);
                    }
                    binding_1.default.event_stream_client_stream_activate(this.native_handle(), options, curriedPromiseCallback);
                }
                catch (e) {
                    this.state = ClientStreamState.Ended;
                    reject(e);
                }
            });
            return promise.makeSelfCleaningPromise(activatePromise, cleanupCancelListener);
        });
    }
    /**
     * Attempts to send an event stream message.
     *
     * @param options configuration -- including the message itself -- for sending a message
     *
     * Returns a promise that will be fulfilled when the message is successfully flushed to the wire, and rejected if
     * an error occurs prior to that point.
     */
    sendMessage(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanupCancelListener = undefined;
            let sendMessagePromise = new Promise((resolve, reject) => {
                try {
                    if (!options) {
                        reject(new error_1.CrtError("Invalid options passed to ClientStream.sendMessage"));
                        return;
                    }
                    if (this.state != ClientStreamState.Activated) {
                        reject(new error_1.CrtError(`Event stream in a state (${this.state}) where sending messages is not allowed.`));
                        return;
                    }
                    if (options.cancelController) {
                        let cancel = () => {
                            reject(new error_1.CrtError(`Event stream sendMessage() cancelled by external request.`));
                            setImmediate(() => { this.close(); });
                        };
                        cleanupCancelListener = options.cancelController.addListener(cancel);
                        if (!cleanupCancelListener) {
                            return;
                        }
                    }
                    function curriedPromiseCallback(errorCode) {
                        return ClientStream._s_on_stream_send_message_completion(resolve, reject, errorCode);
                    }
                    // invoke native binding send message;
                    binding_1.default.event_stream_client_stream_send_message(this.native_handle(), options, curriedPromiseCallback);
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise.makeSelfCleaningPromise(sendMessagePromise, cleanupCancelListener);
        });
    }
    /**
     * Returns true if the stream is currently active and ready-to-use, false otherwise.
     */
    isActive() {
        return this.state == ClientStreamState.Activated;
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
    static _s_on_stream_activated(resolve, reject, stream, errorCode) {
        if (errorCode == 0 && stream.state == ClientStreamState.Activating) {
            stream.state = ClientStreamState.Activated;
            resolve();
        }
        else {
            if (stream.state != ClientStreamState.Closed) {
                stream.state = ClientStreamState.Ended;
            }
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_stream_send_message_completion(resolve, reject, errorCode) {
        if (errorCode == 0) {
            resolve();
        }
        else {
            reject(io.error_code_to_string(errorCode));
        }
    }
    static _s_on_stream_ended(stream) {
        process.nextTick(() => {
            stream.emit(ClientStream.ENDED, {});
        });
    }
    static _s_on_stream_message(stream, message) {
        process.nextTick(() => {
            stream.emit(ClientStream.MESSAGE, { message: mapPodMessageToJSMessage(message) });
        });
    }
}
exports.ClientStream = ClientStream;
/**
 * Event emitted when the stream is shut down for any reason.
 *
 * Listener type: {@link StreamEndedListener}
 *
 * @event
 */
ClientStream.ENDED = 'ended';
/**
 * Event emitted when a stream message is received from the remote endpoint
 *
 * Listener type: {@link MessageListener}
 *
 * @event
 */
ClientStream.MESSAGE = 'message';
//# sourceMappingURL=eventstream.js.map