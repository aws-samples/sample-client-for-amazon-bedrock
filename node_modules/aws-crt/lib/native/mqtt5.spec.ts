/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_utils from "@test/mqtt5";
import * as mqtt5 from "./mqtt5";
import {ClientBootstrap, ClientTlsContext, SocketDomain, SocketOptions, SocketType, TlsContextOptions} from "./io";
import {HttpProxyAuthenticationType, HttpProxyConnectionType, HttpRequest} from "./http";
import {v4 as uuid} from "uuid";
import * as io from "./io";
import {once} from "events";

jest.setTimeout(10000);

function createNodeSpecificTestConfig (testType: test_utils.SuccessfulConnectionTestType) : mqtt5.Mqtt5ClientConfig {

    let tlsCtx = undefined;

    if (test_utils.ClientEnvironmentalConfig.doesTestUseTls(testType)) {
        let tls_ctx_opt = new TlsContextOptions();
        tls_ctx_opt.verify_peer = false;

        tlsCtx = new ClientTlsContext(tls_ctx_opt);
    }

    let wsTransform = undefined;
    if (test_utils.ClientEnvironmentalConfig.doesTestUseWebsockets(testType)) {
        wsTransform = (request: HttpRequest, done: (error_code?: number) => void) =>
        {
            done(0);
        };
    }

    let proxyOptions = undefined;
    if (test_utils.ClientEnvironmentalConfig.doesTestUseProxy(testType)) {
        proxyOptions = new mqtt5.HttpProxyOptions(
            test_utils.ClientEnvironmentalConfig.PROXY_HOST,
            test_utils.ClientEnvironmentalConfig.PROXY_PORT,
            HttpProxyAuthenticationType.None,
            undefined,
            undefined,
            undefined,
            HttpProxyConnectionType.Tunneling);
    }

    return {
        hostName: "unknown",
        port: 0,
        tlsCtx: tlsCtx,
        httpProxyOptions: proxyOptions,
        websocketHandshakeTransform: wsTransform
    };
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Success - Direct Mqtt', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_BASIC_AUTH))('Connection Success - Direct Mqtt with basic authentication', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_BASIC_AUTH, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS))('Connection Success - Direct Mqtt with TLS', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Direct Mqtt with tls through an http proxy', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS_VIA_PROXY, createNodeSpecificTestConfig);
});

function makeMaximalConfig() : mqtt5.Mqtt5ClientConfig {
    let tls_ctx_opt = new TlsContextOptions();
    tls_ctx_opt.verify_peer = false;

    return {
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_TLS_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_TLS_PORT,
        sessionBehavior: mqtt5.ClientSessionBehavior.RejoinPostSuccess,
        retryJitterMode: mqtt5.RetryJitterType.Decorrelated,
        minReconnectDelayMs: 2000,
        maxReconnectDelayMs: 180000,
        minConnectedTimeToResetReconnectDelayMs: 60000,
        connackTimeoutMs: 20000,
        connectProperties: {
            keepAliveIntervalSeconds : 1800,
            clientId: `test${uuid()}`,
            username: 'notusingbasicauth',
            password: Buffer.from('notapassword', 'utf-8'),
            sessionExpiryIntervalSeconds: 3600,
            requestResponseInformation: true,
            requestProblemInformation: true,
            receiveMaximum: 100,
            maximumPacketSizeBytes: 256 * 1024,
            willDelayIntervalSeconds: 60,
            will: {
                topicName: `will/topic${uuid()}`,
                payload: Buffer.from("WillPayload", "utf-8"),
                qos: mqtt5.QoS.AtLeastOnce,
                retain: false,
                payloadFormat: mqtt5.PayloadFormatIndicator.Utf8,
                messageExpiryIntervalSeconds: 60,
                responseTopic: "talk/to/me",
                correlationData: Buffer.from("Sekrits", "utf-8"),
                contentType: "not-json",
                userProperties: [
                    {name:"will-name", value:"will-value"}
                ]
            },
            userProperties: [
                {name: "hello", value: "there"}
            ]
        },
        offlineQueueBehavior: mqtt5.ClientOperationQueueBehavior.FailQos0PublishOnDisconnect,
        pingTimeoutMs: 30000,
        ackTimeoutSeconds: 90,
        clientBootstrap: new ClientBootstrap(),
        socketOptions: new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 10000, true, 60, 60, 3),
        tlsCtx: new ClientTlsContext(tls_ctx_opt),
        httpProxyOptions: new mqtt5.HttpProxyOptions(
            test_utils.ClientEnvironmentalConfig.PROXY_HOST,
            test_utils.ClientEnvironmentalConfig.PROXY_PORT,
            HttpProxyAuthenticationType.None,
            undefined,
            undefined,
            undefined,
            HttpProxyConnectionType.Tunneling),
        extendedValidationAndFlowControlOptions: mqtt5.ClientExtendedValidationAndFlowControl.AwsIotCoreDefaults
    };
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Direct Mqtt with everything set', async () => {
    let maximalConfig : mqtt5.Mqtt5ClientConfig = makeMaximalConfig();

    await test_utils.testConnect(new mqtt5.Mqtt5Client(maximalConfig));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Success - Websocket Mqtt', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH))('Connection Success - Websocket Mqtt with basic authentication', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS))('Connection Success - Websocket Mqtt with TLS', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Websocket Mqtt with tls through an http proxy', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY, createNodeSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Websocket Mqtt with everything set', async () => {
    let maximalConfig : mqtt5.Mqtt5ClientConfig = makeMaximalConfig();
    maximalConfig.hostName = test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_HOST;
    maximalConfig.port = test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_PORT;
    maximalConfig.websocketHandshakeTransform = (request: HttpRequest, done: (error_code?: number) => void) => { done(0); };

    await test_utils.testConnect(new mqtt5.Mqtt5Client(maximalConfig));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Failure - Direct MQTT Bad host', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: 'localhst',
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_PORT
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Failure - Direct MQTT Bad port', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_HOST,
        port: 9999
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Direct MQTT protocol mismatch', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT
    }));
});

test('Connection Failure - Direct MQTT socket timeout', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: "example.com",
        port: 81,
        socketOptions: new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 2000)
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_TLS))('Connection Failure - Direct MQTT Expected TLS', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_TLS_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_TLS_PORT
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Failure - Direct MQTT Expected Plain text', async () => {
    let tls_ctx_opt : TlsContextOptions = new TlsContextOptions();
    tls_ctx_opt.verify_peer = false;

    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_PORT,
        tlsCtx : new ClientTlsContext(tls_ctx_opt),
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT_WITH_BASIC_AUTH))('Connection Failure - Direct Mqtt connection with basic authentication bad credentials', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_BASIC_AUTH_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_BASIC_AUTH_PORT,
        connectProperties : {
            keepAliveIntervalSeconds: 1200,
            username: "Wrong",
            password: Buffer.from("NotAPassword", "utf-8")
        }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Bad host', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: 'localhst',
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Bad port', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: 9999
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Failure - Websocket MQTT protocol mismatch', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_PORT,
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(0); }
    }));
});

test('Connection Failure - Websocket MQTT socket timeout', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: "example.com",
        port: 81,
        socketOptions: new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 2000),
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(0); }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS))('Connection Failure - Websocket MQTT Expected TLS', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_PORT,
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(0); }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Expected Plain text', async () => {
    let tls_ctx_opt : TlsContextOptions = new TlsContextOptions();
    tls_ctx_opt.verify_peer = false;

    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT,
        tlsCtx : new ClientTlsContext(tls_ctx_opt),
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(0); }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH))('Connection Failure - Websocket Mqtt connection with basic authentication bad credentials', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_BASIC_AUTH_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_BASIC_AUTH_PORT,
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(0); },
        connectProperties : {
            keepAliveIntervalSeconds: 1200,
            username: "Wrong",
            password: Buffer.from("NotAPassword", "utf-8")
        }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Bad Handshake', async () => {
    let tls_ctx_opt : TlsContextOptions = new TlsContextOptions();
    tls_ctx_opt.verify_peer = false;

    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT,
        tlsCtx : new ClientTlsContext(tls_ctx_opt),
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => {
            request.method = 'PUT';
            done(0);
        }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Failed Handshake', async () => {
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT,
        websocketHandshakeTransform: (request: HttpRequest, done: (error_code?: number) => void) => { done(1); }
    }));
});

function testFailedClientConstruction(config: mqtt5.Mqtt5ClientConfig) {
    expect(() => { new mqtt5.Mqtt5Client(config); }).toThrow();
}

function getBaseConstructionFailureConfig() : mqtt5.Mqtt5ClientConfig {
    return {
        hostName : "localhost",
        port : 1883,
        connectProperties: {
            keepAliveIntervalSeconds: 1200,
        }
    }
}

test('Client construction failure - bad config, keep alive underflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.keepAliveIntervalSeconds = -1000;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, keep alive overflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.keepAliveIntervalSeconds = 65536;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, session expiry underflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.sessionExpiryIntervalSeconds = -1000;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, session expiry overflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.sessionExpiryIntervalSeconds = 4294967296;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, receive maximum underflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.receiveMaximum = -1000;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, receive maximum overflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.receiveMaximum = 65536;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, maximum packet size underflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.maximumPacketSizeBytes = 0;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, maximum packet size overflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.maximumPacketSizeBytes = 4294967296;
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, will delay interval underflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.willDelayIntervalSeconds = -5;
    // @ts-ignore
    config.connectProperties.will = {
        topicName: "derp",
        qos: mqtt5.QoS.AtLeastOnce
    }
    testFailedClientConstruction(config);
});

test('Client construction failure - bad config, will delay interval overflow', async () => {
    let config : mqtt5.Mqtt5ClientConfig = getBaseConstructionFailureConfig();
    // @ts-ignore
    config.connectProperties.willDelayIntervalSeconds = 4294967296;
    // @ts-ignore
    config.connectProperties.will = {
        topicName: "derp",
        qos: mqtt5.QoS.AtLeastOnce
    }
    testFailedClientConstruction(config);
});

function createDirectIotCoreClientConfig() : mqtt5.Mqtt5ClientConfig {

    let tlsContextOptions: io.TlsContextOptions = io.TlsContextOptions.create_client_with_mtls_from_path(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_CERTIFICATE_PATH,
        test_utils.ClientEnvironmentalConfig.AWS_IOT_KEY_PATH
    );

    if (io.is_alpn_available()) {
        tlsContextOptions.alpn_list.unshift('x-amzn-mqtt-ca');
    }

    let tlsContext : io.ClientTlsContext = new io.ClientTlsContext(tlsContextOptions);

    let config : mqtt5.Mqtt5ClientConfig = {
        hostName: test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        port: 8883,
        tlsCtx: tlsContext
    }

    return config;
}

function createOperationFailureClient() : mqtt5.Mqtt5Client {
    return new mqtt5.Mqtt5Client(createDirectIotCoreClientConfig());
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Disconnection failure - session expiry underflow', async () => {
    await test_utils.testDisconnectValidationFailure(createOperationFailureClient(), -5);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Disconnection failure - session expiry overflow', async () => {
    await test_utils.testDisconnectValidationFailure(createOperationFailureClient(), 4294967296);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Publish failure - message expiry underflow', async () => {
    // @ts-ignore
    await test_utils.testPublishValidationFailure(createOperationFailureClient(), -5);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Publish failure - message expiry overflow', async () => {
    // @ts-ignore
    await test_utils.testPublishValidationFailure(createOperationFailureClient(), 4294967297);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Subscribe failure - subscription identifier underflow', async () => {
    // @ts-ignore
    await test_utils.testSubscribeValidationFailure(createOperationFailureClient(), -5);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Subscribe failure - subscription identifier overflow', async () => {
    // @ts-ignore
    await test_utils.testSubscribeValidationFailure(createOperationFailureClient(), 4294967297);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Negotiated settings - minimal', async () => {
    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    config.connectProperties = {
        keepAliveIntervalSeconds: 600
    };

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    let settings : mqtt5.NegotiatedSettings = await test_utils.testNegotiatedSettings(client);

    expect(settings.serverKeepAlive).toEqual(600);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Negotiated settings - maximal', async () => {
    let clientId : string = `test-${uuid()}`;
    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    config.connectProperties = {
        keepAliveIntervalSeconds: 900,
        sessionExpiryIntervalSeconds: 600,
        clientId: clientId
    };
    config.sessionBehavior = mqtt5.ClientSessionBehavior.RejoinPostSuccess;

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    let settings : mqtt5.NegotiatedSettings = await test_utils.testNegotiatedSettings(client);

    expect(settings.serverKeepAlive).toEqual(900);
    // expect(settings.sessionExpiryInterval).toEqual(600); // TODO: restore when IoTCore fixes sessionExpiry return value bug
    expect(settings.clientId).toEqual(clientId);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Negotiated settings - always rejoin session', async () => {
    let clientId : string = `test-${uuid()}`;
    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    config.connectProperties = {
        clientId: clientId,
        keepAliveIntervalSeconds: 600,
        sessionExpiryIntervalSeconds: 3600,
    };

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    await test_utils.testNegotiatedSettings(client, false);

    config.sessionBehavior = mqtt5.ClientSessionBehavior.RejoinAlways;
    let forcedRejoinClient : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    await test_utils.testNegotiatedSettings(forcedRejoinClient, true);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Sub - Pub QoS 0 - Unsub', async () => {
    let topic : string = `test-${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");

    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    let qos : mqtt5.QoS = mqtt5.QoS.AtMostOnce;
    let receivedCount : number = 0;
    client.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(qos);
        expect(Buffer.from(packet.payload as ArrayBuffer)).toEqual(testPayload);
        expect(packet.topicName).toEqual(topic);
        receivedCount++;
    });

    await test_utils.subPubUnsubTest(client, qos, topic, testPayload);

    expect(receivedCount).toEqual(1);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Sub - Pub QoS 1 - Unsub', async () => {
    let topic : string = `test-${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");

    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    let qos : mqtt5.QoS = mqtt5.QoS.AtLeastOnce;
    let receivedCount : number = 0;
    client.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(qos);
        expect(Buffer.from(packet.payload as ArrayBuffer)).toEqual(testPayload);
        expect(packet.topicName).toEqual(topic);
        receivedCount++;
    });

    await test_utils.subPubUnsubTest(client, qos, topic, testPayload);

    expect(receivedCount).toEqual(1);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Will test', async () => {
    let willPayload : Buffer = Buffer.from("ToMyChildrenIBequeathNothing", "utf-8");
    let willTopic : string = `will/test${uuid()}`;

    let publisherConfig : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    publisherConfig.connectProperties = {
        keepAliveIntervalSeconds: 1200,
        willDelayIntervalSeconds : 0,
        will : {
            topicName: willTopic,
            qos: mqtt5.QoS.AtLeastOnce,
            payload: willPayload
        }
    }

    let publisher : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(publisherConfig);

    let subscriberConfig : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    let subscriber : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(subscriberConfig);

    let willReceived : boolean = false;
    subscriber.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(mqtt5.QoS.AtLeastOnce);
        expect(Buffer.from(packet.payload as ArrayBuffer)).toEqual(willPayload);
        expect(packet.topicName).toEqual(willTopic);
        willReceived = true;
    });

    await test_utils.willTest(publisher, subscriber, willTopic);

    expect(willReceived).toEqual(true);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Shared subscriptions test', async () => {
    const config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    const publisher : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    const subscriber1 : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    const subscriber2 : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);
    await test_utils.doSharedSubscriptionsTest(publisher, subscriber1, subscriber2);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null subscribe', async () => {
    await test_utils.nullSubscribeTest(new mqtt5.Mqtt5Client(createDirectIotCoreClientConfig()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null unsubscribe', async () => {
    await test_utils.nullUnsubscribeTest(new mqtt5.Mqtt5Client(createDirectIotCoreClientConfig()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null publish', async () => {
    await test_utils.nullPublishTest(new mqtt5.Mqtt5Client(createDirectIotCoreClientConfig()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Retain test', async () => {
    let config : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();

    await test_utils.doRetainTest(new mqtt5.Mqtt5Client(config), new mqtt5.Mqtt5Client(config), new mqtt5.Mqtt5Client(config));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation statistics test simple', async () => {
    let clientConfig : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    let client : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(clientConfig);

    let connectionSuccess = once(client, mqtt5.Mqtt5Client.CONNECTION_SUCCESS);
    let stopped = once(client, mqtt5.Mqtt5Client.STOPPED);

    client.start();

    await connectionSuccess;

    let statistics : mqtt5.ClientStatistics = client.getOperationalStatistics();
    expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(0);
    expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(0);
    // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
    // TODO - find a way to test unacked operations reliably without worrying about socket speed.

    let topic : string = `test-${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");
    let qos : mqtt5.QoS = mqtt5.QoS.AtLeastOnce;

    await client.publish({
        topicName: topic,
        qos: qos,
        payload: testPayload
    });

    await setTimeout(()=>{}, 2000);

    statistics = client.getOperationalStatistics();
    expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(0);
    expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(0);
    // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
    // TODO - find a way to test unacked operations reliably without worrying about socket speed.

    client.stop();
    await stopped;

    client.close();
});

/* This test doesn't verify LRU aliasing it just gives some evidence that enabling LRU aliasing doesn't blow something up */
test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Publish with LRU aliasing', async () => {
    let clientConfig : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    clientConfig.topicAliasingOptions = {
        outboundBehavior : mqtt5.OutboundTopicAliasBehaviorType.LRU,
        outboundCacheMaxSize : 10
    };

    let client : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(clientConfig);

    let connectionSuccess = once(client, mqtt5.Mqtt5Client.CONNECTION_SUCCESS);
    let stopped = once(client, mqtt5.Mqtt5Client.STOPPED);

    client.start();

    await connectionSuccess;

    let topic : string = `test-${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");
    let qos : mqtt5.QoS = mqtt5.QoS.AtLeastOnce;

    await client.publish({
        topicName: topic,
        qos: qos,
        payload: testPayload
    });

    await client.publish({
        topicName: topic,
        qos: qos,
        payload: testPayload
    });

    client.stop();
    await stopped;

    client.close();
});

/* This test doesn't verify manual aliasing it just gives some evidence that enabling manual aliasing doesn't blow something up */
test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Publish with manual aliasing', async () => {
    let clientConfig : mqtt5.Mqtt5ClientConfig = createDirectIotCoreClientConfig();
    clientConfig.topicAliasingOptions = {
        outboundBehavior : mqtt5.OutboundTopicAliasBehaviorType.Manual,
        outboundCacheMaxSize : 10
    };

    let client : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(clientConfig);

    let connectionSuccess = once(client, mqtt5.Mqtt5Client.CONNECTION_SUCCESS);
    let stopped = once(client, mqtt5.Mqtt5Client.STOPPED);

    client.start();

    await connectionSuccess;

    let topic : string = `test-${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");
    let qos : mqtt5.QoS = mqtt5.QoS.AtLeastOnce;

    await client.publish({
        topicName: topic,
        qos: qos,
        payload: testPayload,
        topicAlias: 1
    });

    await client.publish({
        topicName: topic,
        qos: qos,
        payload: testPayload,
        topicAlias: 1
    });

    client.stop();
    await stopped;

    client.close();
});
