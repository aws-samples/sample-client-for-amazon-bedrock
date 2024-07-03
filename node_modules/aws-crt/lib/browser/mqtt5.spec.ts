/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as mqtt5 from "./mqtt5";
import * as test_utils from "@test/mqtt5";
import {v4 as uuid} from "uuid";
import url from "url";
import {HttpsProxyAgent} from "https-proxy-agent";
import * as auth from "./auth";

jest.setTimeout(10000);

function createBrowserSpecificTestConfig (testType: test_utils.SuccessfulConnectionTestType) : mqtt5.Mqtt5ClientConfig {

    let wsOptions : any = {
        perMessageDeflate: false
    }

    if (test_utils.ClientEnvironmentalConfig.doesTestUseProxy(testType)) {
        let urlOptions: url.UrlWithStringQuery = url.parse(`http://${test_utils.ClientEnvironmentalConfig.PROXY_HOST}:${test_utils.ClientEnvironmentalConfig.PROXY_PORT}`);
        let agent: HttpsProxyAgent  = new HttpsProxyAgent(urlOptions);

        wsOptions.agent = agent;
    }

    let urlFactoryOptions : mqtt5.Mqtt5WebsocketUrlFactoryOptions;
    if (test_utils.ClientEnvironmentalConfig.doesTestUseTls(testType)) {
        urlFactoryOptions = { urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Wss };
        wsOptions.rejectUnauthorized = false;
    } else {
        urlFactoryOptions = { urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Ws };
    }

    return {
        hostName: "unknown",
        port: 0,

        websocketOptions: {
            urlFactoryOptions: urlFactoryOptions,
            wsOptions: wsOptions
        }
    };
}

function makeMaximalConfig() : mqtt5.Mqtt5ClientConfig {

    let urlOptions: url.UrlWithStringQuery = url.parse(`http://${test_utils.ClientEnvironmentalConfig.PROXY_HOST}:${test_utils.ClientEnvironmentalConfig.PROXY_PORT}`);
    let agent: HttpsProxyAgent  = new HttpsProxyAgent(urlOptions);

    return {
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_PORT,
        sessionBehavior: mqtt5.ClientSessionBehavior.RejoinPostSuccess,
        retryJitterMode: mqtt5.RetryJitterType.Decorrelated,
        minReconnectDelayMs: 2000,
        maxReconnectDelayMs: 180000,
        minConnectedTimeToResetReconnectDelayMs: 60000,
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
        connectTimeoutMs: 30000,
        websocketOptions: {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Wss
            },
            wsOptions: {
                rejectUnauthorized: false,
                agent : agent
            }
        }
    };
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Success - Websocket Mqtt', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT, createBrowserSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH))('Connection Success - Websocket Mqtt with basic authentication', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH, createBrowserSpecificTestConfig);
});


test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS))('Connection Success - Websocket Mqtt with TLS', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS, createBrowserSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Websocket Mqtt with tls through an http proxy', async () => {
    await test_utils.testSuccessfulConnection(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY, createBrowserSpecificTestConfig);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS_VIA_PROXY))('Connection Success - Websocket Mqtt with everything set', async () => {
    let maximalConfig : mqtt5.Mqtt5ClientConfig = makeMaximalConfig();

    // @ts-ignore
    await test_utils.testConnect(new mqtt5.Mqtt5Client(maximalConfig));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Bad host', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: 'localhst',
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Bad port', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: 9999
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.DIRECT_MQTT))('Connection Failure - Websocket MQTT protocol mismatch', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.DIRECT_MQTT_PORT
    }));
});

test('Connection Failure - Websocket MQTT socket timeout', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: "example.com",
        port: 81,
        connectTimeoutMs: 3000,
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_TLS))('Connection Failure - Websocket MQTT Expected TLS', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_TLS_PORT
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT))('Connection Failure - Websocket MQTT Expected Plain text', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_PORT,
        websocketOptions: {
            urlFactoryOptions: {
                urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Wss
            }
        }
    }));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasValidSuccessfulConnectionTestConfig(test_utils.SuccessfulConnectionTestType.WS_MQTT_WITH_BASIC_AUTH))('Connection Failure - Websocket Mqtt connection with basic authentication bad credentials', async () => {
    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client({
        hostName: test_utils.ClientEnvironmentalConfig.WS_MQTT_BASIC_AUTH_HOST,
        port: test_utils.ClientEnvironmentalConfig.WS_MQTT_BASIC_AUTH_PORT,
        connectProperties : {
            keepAliveIntervalSeconds: 1200,
            username: "Wrong",
            password: Buffer.from("NotAPassword", "utf-8")
        }
    }));
});

function testFailedClientConstruction(config: mqtt5.Mqtt5ClientConfig) {
    expect(() => {
        new mqtt5.Mqtt5Client(config);
    }).toThrow();
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

function createWsIotCoreClientConfig() : mqtt5.Mqtt5ClientConfig {
    let provider: auth.StaticCredentialProvider = new auth.StaticCredentialProvider({
        aws_access_id: test_utils.ClientEnvironmentalConfig.AWS_IOT_ACCESS_KEY_ID,
        aws_secret_key: test_utils.ClientEnvironmentalConfig.AWS_IOT_SECRET_ACCESS_KEY,
        aws_sts_token: test_utils.ClientEnvironmentalConfig.AWS_IOT_SESSION_TOKEN,
        aws_region: "us-east-1"
    });

    let websocketConfig: mqtt5.Mqtt5WebsocketConfig = {
        urlFactoryOptions: {
            urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Sigv4,
            region: "us-east-1",
            credentialsProvider: provider
        }
    };

    let config : mqtt5.Mqtt5ClientConfig = {
        hostName: test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        port: 443,
        connectProperties: {
            keepAliveIntervalSeconds: 1200
        },
        websocketOptions: websocketConfig
    }

    return config;
}

function createOperationFailureClient() : mqtt5.IMqtt5Client {
    return new mqtt5.Mqtt5Client(createWsIotCoreClientConfig());
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Disconnection failure - session expiry underflow', async () => {
    // @ts-ignore
    await test_utils.testDisconnectValidationFailure(createOperationFailureClient(), -5);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Disconnection failure - session expiry overflow', async () => {
    // @ts-ignore
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
    let config: mqtt5.Mqtt5ClientConfig = createWsIotCoreClientConfig();

    if (config.connectProperties) {
        config.connectProperties.keepAliveIntervalSeconds = 600;
    }

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    // @ts-ignore
    let settings : mqtt5_common.NegotiatedSettings = await test_utils.testNegotiatedSettings(client);

    expect(settings.serverKeepAlive).toEqual(600);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Negotiated settings - maximal', async () => {
    let clientId : string = "test-" + Math.floor(Math.random() * 100000000);

    let config: mqtt5.Mqtt5ClientConfig = createWsIotCoreClientConfig();

    if (config.connectProperties) {
        config.connectProperties.keepAliveIntervalSeconds = 600;
        config.connectProperties.sessionExpiryIntervalSeconds = 700
        config.connectProperties.clientId = clientId;
    }

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    // @ts-ignore
    let settings : mqtt5_common.NegotiatedSettings = await test_utils.testNegotiatedSettings(client);

    expect(settings.serverKeepAlive).toEqual(600);
    // expect(settings.sessionExpiryInterval).toEqual(700); TODO: restore once IoT Core fixes session expiry
    expect(settings.clientId).toEqual(clientId);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Negotiated settings - always rejoin session', async () => {
    let clientId : string = `test-${uuid()}`;
    let config : mqtt5.Mqtt5ClientConfig = createWsIotCoreClientConfig();
    config.connectProperties = {
        clientId: clientId,
        keepAliveIntervalSeconds: 600,
        sessionExpiryIntervalSeconds: 3600,
    };

    let client: mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    // @ts-ignore
    await test_utils.testNegotiatedSettings(client, false);

    config.sessionBehavior = mqtt5.ClientSessionBehavior.RejoinAlways;
    let forcedRejoinClient : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(config);

    // @ts-ignore
    await test_utils.testNegotiatedSettings(forcedRejoinClient, true);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Sub - Pub QoS 0 - Unsub', async () => {
    let topic : string = `test/${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");

    let client : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(createWsIotCoreClientConfig());

    let qos : mqtt5.QoS = mqtt5.QoS.AtMostOnce;
    let receivedCount : number = 0;
    client.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(qos);
        expect(packet.payload).toEqual(testPayload);
        expect(packet.topicName).toEqual(topic);
        receivedCount++;
    });

    // @ts-ignore
    await test_utils.subPubUnsubTest(client, qos, topic, testPayload);

    expect(receivedCount).toEqual(1);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Sub - Pub QoS 1 - Unsub', async () => {
    let topic : string = `test/${uuid()}`;
    let testPayload : Buffer = Buffer.from("Derp", "utf-8");

    let client : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(createWsIotCoreClientConfig());

    let qos : mqtt5.QoS = mqtt5.QoS.AtLeastOnce;
    let receivedCount : number = 0;
    client.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(qos);
        expect(packet.payload).toEqual(testPayload);
        expect(packet.topicName).toEqual(topic);
        receivedCount++;
    });

    // @ts-ignore
    await test_utils.subPubUnsubTest(client, qos, topic, testPayload);

    expect(receivedCount).toEqual(1);
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Will test', async () => {
    let willPayload : Buffer = Buffer.from("ToMyChildrenIBequeathNothing", "utf-8");
    let willTopic : string = `test/will/test${uuid()}`;

    let publisherConfig: mqtt5.Mqtt5ClientConfig = createWsIotCoreClientConfig();

    if (publisherConfig.connectProperties) {
        publisherConfig.connectProperties.willDelayIntervalSeconds = 0;
        publisherConfig.connectProperties.will = {
            topicName: willTopic,
            qos: mqtt5.QoS.AtLeastOnce,
            payload: willPayload
        };
    }

    let publisher : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(publisherConfig);

    let subscriber : mqtt5.Mqtt5Client = new mqtt5.Mqtt5Client(createWsIotCoreClientConfig());

    let willReceived : boolean = false;
    subscriber.on('messageReceived', (eventData: mqtt5.MessageReceivedEvent) => {
        let packet: mqtt5.PublishPacket = eventData.message;

        expect(packet.qos).toEqual(mqtt5.QoS.AtLeastOnce);
        expect(Buffer.from(packet.payload as ArrayBuffer)).toEqual(willPayload);
        expect(packet.topicName).toEqual(willTopic);
        willReceived = true;
    });

    // @ts-ignore
    await test_utils.willTest(publisher, subscriber, willTopic);

    expect(willReceived).toEqual(true);
});

function createNullOperationClient() : mqtt5.Mqtt5Client {
    return new mqtt5.Mqtt5Client(createWsIotCoreClientConfig())
}

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null subscribe', async () => {
    // @ts-ignore
    await test_utils.nullSubscribeTest(createNullOperationClient());
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null unsubscribe', async () => {
    // @ts-ignore
    await test_utils.nullUnsubscribeTest(createNullOperationClient());
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Operation failure - null publish', async () => {
    // @ts-ignore
    await test_utils.nullPublishTest(createNullOperationClient());
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIotCoreEnvironment())('Retain test', async () => {
    let config : mqtt5.Mqtt5ClientConfig = createWsIotCoreClientConfig();

    // @ts-ignore
    await test_utils.doRetainTest(new mqtt5.Mqtt5Client(config), new mqtt5.Mqtt5Client(config), new mqtt5.Mqtt5Client(config));
});
