/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as eventstream from './eventstream';
import * as cancel from '../common/cancel';
import {once} from "events";
import crt_native from "./binding";
import * as os from "os";

jest.setTimeout(10000);

function hasEchoServerEnvironment() : boolean {
    if (process.env.AWS_TEST_EVENT_STREAM_ECHO_SERVER_HOST === undefined) {
        return false;
    }

    if (process.env.AWS_TEST_EVENT_STREAM_ECHO_SERVER_PORT === undefined) {
        return false;
    }

    return true;
}

const conditional_test = (condition : boolean) => condition ? it : it.skip;

function closeNativeConnectionInternal(connection: eventstream.ClientConnection) {

    // invoke an internal close that bypasses the binding.  The result is an invocation that simulates a network
    // disruption from the binding's perspective
    crt_native.event_stream_client_connection_close_internal(connection.native_handle());
}

function makeGoodConfig() : eventstream.ClientConnectionOptions {
    let config : eventstream.ClientConnectionOptions = {
        hostName: process.env.AWS_TEST_EVENT_STREAM_ECHO_SERVER_HOST ?? "",
        port: parseInt(process.env.AWS_TEST_EVENT_STREAM_ECHO_SERVER_PORT ?? "0"),
    };

    return config;
}

/*
 * successful connection setup/teardown tests include some short waits to try and shake out any native race conditions
 * that might occur due to JS object finalization after close.  For the same reason, we scope the connection object
 * to a helper function, making finalization on the extern more likely.
 */

conditional_test(hasEchoServerEnvironment())('Eventstream transport connection success echo server - await connect, close, and forget', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());
    let cancelController : cancel.CancelController = new cancel.CancelController();

    await connection.connect({
        cancelController : cancelController
    });

    // @ts-ignore
    expect(cancelController.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream transport connection success echo server - await connect, simulate remote close', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let disconnected = once(connection, eventstream.ClientConnection.DISCONNECTION);

    await connection.connect({});

    // simulate a socket closed by the remote endpoint scenario
    closeNativeConnectionInternal(connection);

    await disconnected;

    await new Promise(resolve => setTimeout(resolve, 200));

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream transport connection success echo server - start connect, close, and forget', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    // intentionally do not await to try and beat the native connection setup with a close call
    connection.connect({});

    connection.close();

    await new Promise(resolve => setTimeout(resolve, 200));
});

async function doConnectionFailureTest(config : eventstream.ClientConnectionOptions) {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(config);

    let controller : cancel.CancelController = new cancel.CancelController();

    await expect(connection.connect({
        cancelController : controller
    })).rejects.toBeDefined();

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

    connection.close();
}

test('Eventstream transport connection failure echo server - bad host', async () => {
    let badConfig : eventstream.ClientConnectionOptions = makeGoodConfig();
    badConfig.hostName = "derp.notarealdomainseriously.org";

    await doConnectionFailureTest(badConfig);
});

conditional_test(hasEchoServerEnvironment())('Eventstream transport connection failure echo server - bad port', async () => {
    let badConfig : eventstream.ClientConnectionOptions = makeGoodConfig();
    badConfig.port = 33333;

    await doConnectionFailureTest(badConfig);
});

async function doProtocolConnectionSuccessTest1() {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    const connectResponse = once(connection, eventstream.ClientConnection.PROTOCOL_MESSAGE);

    let connectMessage: eventstream.Message = {
        type: eventstream.MessageType.Connect,
        headers: [
            eventstream.Header.newString(':version', '0.1.0'),
            eventstream.Header.newString('client-name', 'accepted.testy_mc_testerson')
        ]
    };

    await connection.sendProtocolMessage({
        message: connectMessage
    });

    let response : eventstream.MessageEvent = (await connectResponse)[0];
    let message : eventstream.Message = response.message;

    expect(message.type).toEqual(eventstream.MessageType.ConnectAck);
    expect(message.flags).toBeDefined();
    expect((message.flags ?? 0) & eventstream.MessageFlags.ConnectionAccepted).toEqual(eventstream.MessageFlags.ConnectionAccepted);

    connection.close();
}

conditional_test(hasEchoServerEnvironment())('Eventstream protocol connection success Echo Server - happy path', async () => {
    await doProtocolConnectionSuccessTest1();

    await new Promise(resolve => setTimeout(resolve, 200));
});

async function doProtocolConnectionSuccessTest2() {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    let connectMessage: eventstream.Message = {
        type: eventstream.MessageType.Connect,
        headers: [
            eventstream.Header.newString(':version', '0.1.0'),
            eventstream.Header.newString('client-name', 'accepted.testy_mc_testerson')
        ]
    };

    connection.sendProtocolMessage({
        message: connectMessage
    });

    connection.close();

    await new Promise(resolve => setTimeout(resolve, 200));
}
conditional_test(hasEchoServerEnvironment())('Eventstream protocol connection success Echo Server - close while connecting', async () => {
    await doProtocolConnectionSuccessTest2();

    await new Promise(resolve => setTimeout(resolve, 200));
});

async function makeGoodConnection() : Promise<eventstream.ClientConnection> {
    return new Promise<eventstream.ClientConnection>(async (resolve, reject) => {
        try {
            let connection: eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

            await connection.connect({});

            const connectResponse = once(connection, eventstream.ClientConnection.PROTOCOL_MESSAGE);

            let connectMessage: eventstream.Message = {
                type: eventstream.MessageType.Connect,
                headers: [
                    eventstream.Header.newString(':version', '0.1.0'),
                    eventstream.Header.newString('client-name', 'accepted.testy_mc_testerson')
                ]
            };

            await connection.sendProtocolMessage({
                message: connectMessage
            });

            let response: eventstream.MessageEvent = (await connectResponse)[0];
            let message: eventstream.Message = response.message;
            if (((message.flags ?? 0) & eventstream.MessageFlags.ConnectionAccepted) == 0) {
                reject();
            }

            resolve(connection);
        } catch (e) {
            reject();
        }
    });
}

function buildAllTypeHeaderSet() : Array<eventstream.Header> {
    var encoder = new TextEncoder();
    let buffer: ArrayBuffer = encoder.encode("Some test");
    let uuid: ArrayBuffer = encoder.encode("0123456789ABCDEF");

    let headers: Array<eventstream.Header> = [
        eventstream.Header.newBoolean('boolTrue', true),
        eventstream.Header.newBoolean('boolFalse', false),
        eventstream.Header.newByte('byte', 8),
        eventstream.Header.newInt16('int16', 32767),
        eventstream.Header.newInt32('int32', -65537),
        eventstream.Header.newInt64FromBigint('int64Bigint', BigInt(65536) * BigInt(65536) * BigInt(2)),
        eventstream.Header.newInt64FromNumber('int64Number', 65536 * 65536 * 2),
        eventstream.Header.newInt64FromNumber('int64NumberNegative1', -1),
        eventstream.Header.newInt64FromNumber('int64NumberNegativeLarge', -123456789),
        eventstream.Header.newString('string', 'Hello'),
        eventstream.Header.newByteBuffer('binary', buffer),
        eventstream.Header.newTimeStampFromDate('date', new Date()),
        eventstream.Header.newTimeStampFromSecondsSinceEpoch('epochSeconds', Date.now()),
        eventstream.Header.newUUID('uuid', uuid)
    ];

    return headers;
}

function verifyEchoedHeaders(expectedHeaders : Array<eventstream.Header>, actualHeaders : Array<eventstream.Header>) {
    expectedHeaders.forEach((header: eventstream.Header) => {
        let actualHeader = actualHeaders.find((value: eventstream.Header) => { return value.name === header.name; });
        expect(actualHeader).toBeDefined();

        // @ts-ignore
        expect(header.type).toEqual(actualHeader.type);

        switch(header.type) {
            case eventstream.HeaderType.BooleanFalse:
            case eventstream.HeaderType.BooleanTrue:
                break;

            case eventstream.HeaderType.ByteBuffer:
            case eventstream.HeaderType.UUID:
            case eventstream.HeaderType.Int64:
                // @ts-ignore
                expect(Buffer.from(header.value as ArrayBuffer)).toEqual(Buffer.from(actualHeader.value as ArrayBuffer));
                break;

            default:
                // @ts-ignore
                expect(header.value).toEqual(actualHeader.value);
                break;

        }
    });
}

async function verifyPingRoundTrip(connection : eventstream.ClientConnection) : Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const pingResponse = once(connection, eventstream.ClientConnection.PROTOCOL_MESSAGE);

            var encoder = new TextEncoder();
            let payload: ArrayBuffer = encoder.encode("A payload");

            let headers: Array<eventstream.Header> = buildAllTypeHeaderSet();

            let pingMessage: eventstream.Message = {
                type: eventstream.MessageType.Ping,
                headers: headers,
                payload: payload
            };

            await connection.sendProtocolMessage({
                message: pingMessage
            });

            let responseEvent: eventstream.MessageEvent = (await pingResponse)[0];
            let response: eventstream.Message = responseEvent.message;

            expect(response.type).toEqual(eventstream.MessageType.PingResponse);
            expect(response.headers).toBeDefined();

            verifyEchoedHeaders(headers, response.headers ?? []);

            expect(Buffer.from(payload)).toEqual(Buffer.from(response.payload as ArrayBuffer));

            resolve();
        } catch (e) {
            reject();
        }
    });
}

conditional_test(hasEchoServerEnvironment())('Eventstream connection success - send and receive all-header-types ping', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();

    await verifyPingRoundTrip(connection);

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream protocol connection failure Echo Server - bad version', async () => {

    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());
    await connection.connect({});

    const connectResponse = once(connection, eventstream.ClientConnection.PROTOCOL_MESSAGE);
    const disconnected = once(connection, eventstream.ClientConnection.DISCONNECTION);

    let connectMessage: eventstream.Message = {
        type: eventstream.MessageType.Connect,
        headers: [
            eventstream.Header.newString(':version', '0.0.1'),
            eventstream.Header.newString('client-name', 'accepted.testy_mc_testerson')
        ]
    };

    await connection.sendProtocolMessage({
        message: connectMessage
    });

    /*
     * Sigh.
     * On Windows, our EchoTest server closes the connection in this case with an RST rather than a FIN.  Searching
     * the web hints at a possible timing issue (that affects Windows far more than other platforms) when closing
     * server-side (listener-spawned) sockets that leads to an RST over a FIN:
     *
     *   https://github.com/libuv/libuv/issues/3034 shows a similar problem, for example.
     *
     * A socket that is closed with an RST is not readable, despite the fact that there was previously received data.
     * So we'll never be able to get the failed ConnAck because the attempt to read from the socket fails immediately.
     *
     * Alternatively, we could restrict these tests to domain/local sockets but that creates its own set of problems,
     * requiring platform-specific permissions tweaks to allow communication between multiple processes.
     *
     * So in the interest of avoiding rabbit holes, we only verify the failed connack on non-Windows platforms.
     */
    if (os.platform() !== 'win32') {
        let response: eventstream.MessageEvent = (await connectResponse)[0];
        let message: eventstream.Message = response.message;

        expect(message.type).toEqual(eventstream.MessageType.ConnectAck);
        expect(message.flags).toBeDefined();
        expect((message.flags ?? 0) & eventstream.MessageFlags.ConnectionAccepted).toEqual(0);
    }

    await disconnected;
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection failure - create with undefined', async () => {
    expect(() => {
        // @ts-ignore
        new eventstream.ClientConnection(undefined)
    }).toThrow();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection failure - create with missing required property', async () => {
    let config : eventstream.ClientConnectionOptions = makeGoodConfig();

    // @ts-ignore
    config.hostName = undefined;

    expect(() => {
        new eventstream.ClientConnection(config)
    }).toThrow();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection failure - sendProtocolMessage with undefined', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    // @ts-ignore
    await expect(connection.sendProtocolMessage(undefined )).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection failure - sendProtocolMessage with missing required property', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    let controller : cancel.CancelController = new cancel.CancelController();

    // @ts-ignore
    await expect(connection.sendProtocolMessage({
        cancelController: controller
    } )).rejects.toThrow();

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - newStream while not connected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    expect(() => {connection.newStream();}).toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - sendProtocolMessage while not connected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let message : eventstream.Message = {
        type: eventstream.MessageType.Connect
    };

    await expect(connection.sendProtocolMessage({message: message} )).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - connect while connecting', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let connected : Promise<void> = connection.connect({});

    await expect(connection.connect({})).rejects.toThrow();

    await connected;

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - connect while connected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    await expect(connection.connect({})).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - connect while disconnected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let disconnected = once(connection, eventstream.ClientConnection.DISCONNECTION);

    await connection.connect({});

    // simulate a socket closed by the remote endpoint scenario
    closeNativeConnectionInternal(connection);

    await disconnected;

    await expect(connection.connect({})).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - newStream while disconnected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let disconnected = once(connection, eventstream.ClientConnection.DISCONNECTION);

    await connection.connect({});

    // simulate a socket closed by the remote endpoint scenario
    closeNativeConnectionInternal(connection);

    await disconnected;

    expect(() => {connection.newStream();}).toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - sendProtocolMessage while disconnected', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    let disconnected = once(connection, eventstream.ClientConnection.DISCONNECTION);

    await connection.connect({});

    // simulate a socket closed by the remote endpoint scenario
    closeNativeConnectionInternal(connection);

    await disconnected;

    let message : eventstream.Message = {
        type: eventstream.MessageType.Connect
    };

    await expect(connection.sendProtocolMessage({message: message} )).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - connect while closed', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    connection.close();

    await expect(connection.connect({})).rejects.toThrow();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - newStream while closed', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    connection.close();

    expect(() => {connection.newStream();}).toThrow();
});

conditional_test(hasEchoServerEnvironment())('Eventstream connection state failure - sendProtocolMessage while closed', async () => {
    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    connection.close();

    let message : eventstream.Message = {
        type: eventstream.MessageType.Connect
    };

    await expect(connection.sendProtocolMessage({message: message} )).rejects.toThrow();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream success - create and close, no asserts', async () => {

    let connection : eventstream.ClientConnection = new eventstream.ClientConnection(makeGoodConfig());

    await connection.connect({});

    let stream : eventstream.ClientStream = connection.newStream();

    stream.close();
    connection.close();
});

async function openPersistentEchoStream(connection: eventstream.ClientConnection) : Promise<eventstream.ClientStream> {
    return new Promise<eventstream.ClientStream>(async (resolve, reject) => {
        try {
            let stream : eventstream.ClientStream = connection.newStream();

            const activateResponse = once(stream, eventstream.ClientStream.MESSAGE);

            let message : eventstream.Message = {
                type: eventstream.MessageType.ApplicationMessage
            };

            let controller : cancel.CancelController = new cancel.CancelController();

            await stream.activate({
                operation: "awstest#EchoStreamMessages",
                message : message,
                cancelController : controller
            });

            let responseEvent: eventstream.MessageEvent = (await activateResponse)[0];
            let response: eventstream.Message = responseEvent.message;

            expect(response.type).toEqual(eventstream.MessageType.ApplicationMessage);

            // @ts-ignore
            expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

            resolve(stream);
        } catch (e) {
            reject();
        }
    });
}
conditional_test(hasEchoServerEnvironment())('Eventstream stream success - activate persistent echo stream, wait for response, close properly', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();

    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream success - activate persistent echo stream, wait for response, close unexpectedly, verify stream ended event', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();

    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    let streamEnded = once(stream, eventstream.ClientStream.ENDED);

    crt_native.event_stream_client_connection_close_internal(connection.native_handle());

    await streamEnded;

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream success - activate one-time echo stream, verify response, verify stream ended', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();

    let stream : eventstream.ClientStream = connection.newStream();

    const activateResponse = once(stream, eventstream.ClientStream.MESSAGE);
    const streamEnded = once(stream, eventstream.ClientStream.ENDED);

    const payloadAsString = "{}";

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        payload: payloadAsString
    };

    await stream.activate({
        operation: "awstest#EchoMessage",
        message : message
    });

    let responseEvent: eventstream.MessageEvent = (await activateResponse)[0];
    let response: eventstream.Message = responseEvent.message;

    expect(response.type).toEqual(eventstream.MessageType.ApplicationMessage);
    expect(response.flags).toBeDefined();
    expect((response.flags ?? 0) & eventstream.MessageFlags.TerminateStream).toEqual(eventstream.MessageFlags.TerminateStream);

    let payload : string = "";
    if (response.payload !== undefined) {
        var decoder = new TextDecoder();
        payload = decoder.decode(Buffer.from(response.payload));
    }
    expect(payload).toEqual(payloadAsString);

    await streamEnded;

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream success - activate persistent echo stream, send message, verify echo response', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();

    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    const echoResponse = once(stream, eventstream.ClientStream.MESSAGE);

    const payloadAsString = "{}";

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        payload: payloadAsString
    };

    await stream.sendMessage({ message : message });

    let responseEvent: eventstream.MessageEvent = (await echoResponse)[0];
    let response: eventstream.Message = responseEvent.message;

    expect(response.type).toEqual(eventstream.MessageType.ApplicationMessage);
    expect((response.flags ?? 0) & eventstream.MessageFlags.TerminateStream).toEqual(0);

    let payload : string = "";
    if (response.payload !== undefined) {
        var decoder = new TextDecoder();
        payload = decoder.decode(Buffer.from(response.payload));
    }
    expect(payload).toEqual(payloadAsString);

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream success - client-side terminate a persistent echo stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    const streamEnded = once(stream, eventstream.ClientStream.ENDED);

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        flags: eventstream.MessageFlags.TerminateStream
    };

    await stream.sendMessage({ message : message });

    await streamEnded;

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - activate invalid operation', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = connection.newStream();

    const streamEnded = once(stream, eventstream.ClientStream.ENDED);
    const activateResponse = once(stream, eventstream.ClientStream.MESSAGE);

    const payloadAsString = "{}";

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        payload: payloadAsString
    };

    await stream.activate({
        operation: "awstest#NotAValidOperation",
        message : message
    });

    let responseEvent: eventstream.MessageEvent = (await activateResponse)[0];
    let response: eventstream.Message = responseEvent.message;

    expect(response.type).toEqual(eventstream.MessageType.ApplicationError);

    await streamEnded;

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - send invalid payload', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    const streamEnded = once(stream, eventstream.ClientStream.ENDED);
    const echoResponse = once(stream, eventstream.ClientStream.MESSAGE);

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        payload: "}"
    };

    await stream.sendMessage({ message : message });

    let responseEvent: eventstream.MessageEvent = (await echoResponse)[0];
    let response: eventstream.Message = responseEvent.message;

    expect(response.type).toEqual(eventstream.MessageType.ApplicationError);

    await streamEnded;

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - send message on unactivated stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = connection.newStream();

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage
    };

    await expect(stream.sendMessage({message: message} )).rejects.toThrow();

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - double activate stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage
    };

    await expect(stream.activate({operation: "awstest#EchoStreamMessages", message: message} )).rejects.toThrow();

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - send message on ended stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    const streamEnded = once(stream, eventstream.ClientStream.ENDED);

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage,
        flags: eventstream.MessageFlags.TerminateStream
    };

    await stream.sendMessage({ message : message });

    await streamEnded;

    await expect(stream.sendMessage({message: message} )).rejects.toThrow();

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - activate a closed stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = connection.newStream();

    stream.close();

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage
    };

    await expect(stream.activate({operation: "awstest#EchoStreamMessages", message: message} )).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - send message on a closed stream', async () => {

    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    stream.close();

    let message : eventstream.Message = {
        type: eventstream.MessageType.ApplicationMessage
    };

    await expect(stream.sendMessage({message: message} )).rejects.toThrow();

    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - activate with undefined', async () => {
    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = connection.newStream();

    // @ts-ignore
    await expect(stream.activate(undefined)).rejects.toThrow();

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - activate with missing required property', async () => {
    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = connection.newStream();

    let controller : cancel.CancelController = new cancel.CancelController();

    // @ts-ignore
    let activateOptions : eventstream.ActivateStreamOptions = {
        message: {
            type: eventstream.MessageType.ApplicationMessage
        },
        cancelController: controller
    }
    await expect(stream.activate(activateOptions)).rejects.toThrow();

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - sendMessage with undefined', async () => {
    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);

    // @ts-ignore
    await expect(stream.sendMessage(undefined)).rejects.toThrow();

    stream.close();
    connection.close();
});

conditional_test(hasEchoServerEnvironment())('Eventstream stream failure - sendMessage with missing required property', async () => {
    let connection : eventstream.ClientConnection = await makeGoodConnection();
    let stream : eventstream.ClientStream = await openPersistentEchoStream(connection);
    let controller : cancel.CancelController = new cancel.CancelController();

    // @ts-ignore
    await expect(stream.sendMessage({
        cancelController: controller
    })).rejects.toThrow();

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);

    stream.close();
    connection.close();
});

test('Eventstream connection cancel - example.com, cancel after connect', async () => {
    // hangs atm
    let connection: eventstream.ClientConnection = new eventstream.ClientConnection({
        hostName: "example.com",
        port: 22
    });

    let controller : cancel.CancelController = new cancel.CancelController();

    setTimeout(() => { controller.cancel(); }, 1000);

    await expect(connection.connect({
        cancelController : controller
    })).rejects.toThrow("cancelled");
});

test('Eventstream connection cancel - example.com, cancel before connect', async () => {
    // hangs atm
    let connection: eventstream.ClientConnection = new eventstream.ClientConnection({
        hostName: "example.com",
        port: 22
    });

    let controller : cancel.CancelController = new cancel.CancelController();
    controller.cancel();
    
    await expect(connection.connect({
        cancelController : controller
    })).rejects.toThrow("cancelled");
});