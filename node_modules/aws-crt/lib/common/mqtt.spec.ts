/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import { v4 as uuid } from 'uuid';

import * as test_env from "@test/test_env"
import { ClientBootstrap } from '@awscrt/io';
import { MqttClient, MqttClientConnection, QoS, MqttWill, Payload } from '@awscrt/mqtt';
import { AwsIotMqttConnectionConfigBuilder } from '@awscrt/aws_iot';
import { fromUtf8 } from '@aws-sdk/util-utf8-browser';
import {once} from "events";

jest.setTimeout(10000);

async function makeConnection(will?: MqttWill, client_id: string = `node-mqtt-unit-test-${uuid()}`) : Promise<MqttClientConnection> {
    return new Promise<MqttClientConnection>(async (resolve, reject) => {
        try {
            let builder = AwsIotMqttConnectionConfigBuilder.new_with_websockets()
                .with_clean_session(true)
                .with_client_id(client_id)
                .with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST)
                .with_credentials(
                    test_env.AWS_IOT_ENV.MQTT311_REGION,
                    test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
                    test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
                    test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN)
                .with_ping_timeout_ms(5000);

            if (will !== undefined) {
                builder.with_will(will);
            }

            const config = builder.build();

            const client = new MqttClient(new ClientBootstrap());
            const connection = client.new_connection(config);
            resolve(connection);
        } catch (err) {
            reject(err);
        }
    });
}

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Connect/Disconnect', async () => {
    const connection = await makeConnection();

    let onConnect = once(connection, 'connect');
    let onDisconnect = once(connection, 'disconnect');

    await connection.connect();

    let connectResult = (await onConnect)[0];
    expect(connectResult).toBeFalsy(); /* session present */

    await connection.disconnect();
    await onDisconnect;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Pub/Sub', async () => {
    const connection = await makeConnection();

    let onConnect = once(connection, 'connect');
    let onDisconnect = once(connection, 'disconnect');

    await connection.connect();

    let connectResult = (await onConnect)[0];
    expect(connectResult).toBeFalsy(); /* session present */

    const test_topic = `test/me/senpai/${uuid()}`;
    const test_payload = 'NOTICE ME';

    var resolvePromise: (value: void | PromiseLike<void>) => void;
    let messageReceivedPromise = new Promise<void>( (resolve, reject) => { resolvePromise = resolve; });

    const sub = connection.subscribe(test_topic, QoS.AtLeastOnce, async (topic, payload, dup, qos, retain) => {
        expect(topic).toEqual(test_topic);
        const payload_str = (new TextDecoder()).decode(new Uint8Array(payload));
        expect(payload_str).toEqual(test_payload);
        expect(qos).toEqual(QoS.AtLeastOnce);
        expect(retain).toBeFalsy();
        resolvePromise();
    });
    await expect(sub).resolves.toBeTruthy();

    const publishResult = connection.publish(test_topic, test_payload, QoS.AtLeastOnce);
    await expect(publishResult).resolves.toBeTruthy();

    await messageReceivedPromise;

    const unsubscribed = connection.unsubscribe(test_topic);
    await expect(unsubscribed).resolves.toHaveProperty('packet_id');

    await connection.disconnect();
    await onDisconnect;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Will', async () => {
    // To check that Will message was successfully set for a connection, the connection should be closed without
    // sending a client-side DISCONNECT packet. This test forces server to close connection by opening another
    // connection with the same client ID.

    const willTopic = 'test/last/will/and/testament'
    const willPayload = 'AVENGE ME'
    const client_id = `node-mqtt-unit-test-will-${uuid()}`

    // Connection with Will set.
    const connectionWithWill = await makeConnection(new MqttWill(
        willTopic,
        QoS.AtLeastOnce,
        willPayload
    ), client_id);
    const onConnectWithWill = once(connectionWithWill, 'connect');
    const onDisconnectWithWill = once(connectionWithWill, 'disconnect');
    await connectionWithWill.connect();
    const connectWithWillResult = (await onConnectWithWill)[0];
    expect(connectWithWillResult).toBeFalsy(); /* session present */

    // The second connection that subscribes to first connection's Will topic.
    const connectionWaitingForWill = await makeConnection();
    const onConnectWaitingForWill = once(connectionWaitingForWill, 'connect');
    const onDisconnectWaitingForWill = once(connectionWaitingForWill, 'disconnect');
    await connectionWaitingForWill.connect()
    const connectWaitingForWill = (await onConnectWaitingForWill)[0];
    expect(connectWaitingForWill).toBeFalsy(); /* session present */

    const onMessage = once(connectionWaitingForWill, 'message');
    await connectionWaitingForWill.subscribe(willTopic, QoS.AtLeastOnce);

    // The third connection that will cause the first one to be disconnected because it has the same client ID.
    const connectionDuplicate = await makeConnection(undefined, client_id);
    const onConnectDuplicate = once(connectionDuplicate, 'connect');
    const onDisconnectDuplicate = once(connectionDuplicate, 'disconnect');
    await connectionDuplicate.connect()
    const connectDuplicateResult = (await onConnectDuplicate)[0];
    expect(connectDuplicateResult).toBeFalsy(); /* session present */

    // The second connection should receive Will message after the first connection was kicked out.
    const messageReceivedArgs = (await onMessage);
    const messageReceivedTopic = messageReceivedArgs[0];
    const messageReceivedPayload = messageReceivedArgs[1];
    const messageReceivedQos = messageReceivedArgs[3];
    const messageReceivedRetain = messageReceivedArgs[4];

    expect(messageReceivedTopic).toEqual(willTopic);
    expect(messageReceivedPayload).toBeDefined();
    const payload_str = (new TextDecoder()).decode(new Uint8Array(messageReceivedPayload));
    expect(payload_str).toEqual(willPayload);
    expect(messageReceivedQos).toEqual(QoS.AtLeastOnce);
    expect(messageReceivedRetain).toBeFalsy();

    await connectionWaitingForWill.disconnect();
    await onDisconnectWaitingForWill;

    await connectionDuplicate.disconnect();
    await onDisconnectDuplicate;

    await connectionWithWill.disconnect();
    await onDisconnectWithWill;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT On Any Publish', async () => {
    const connection = await makeConnection();

    let onConnect = once(connection, 'connect');
    let onDisconnect = once(connection, 'disconnect');

    await connection.connect();

    let connectResult = (await onConnect)[0];
    expect(connectResult).toBeFalsy(); /* session present */

    const test_topic = `test/me/senpai/${uuid()}`;
    const test_payload = 'NOTICE ME';

    let onMessage = once(connection, 'message');

    await connection.subscribe(test_topic, QoS.AtLeastOnce);

    await connection.publish(test_topic, test_payload, QoS.AtLeastOnce);

    let messageReceivedArgs = (await onMessage);
    let messageReceivedTopic = messageReceivedArgs[0];
    let messageReceivedPayload = messageReceivedArgs[1];
    let messageReceivedQos = messageReceivedArgs[3];
    let messageReceivedRetain = messageReceivedArgs[4];

    expect(messageReceivedTopic).toEqual(test_topic);
    expect(messageReceivedPayload).toBeDefined();
    const payload_str = (new TextDecoder()).decode(new Uint8Array(messageReceivedPayload));
    expect(payload_str).toEqual(test_payload);
    expect(messageReceivedQos).toEqual(QoS.AtLeastOnce);
    expect(messageReceivedRetain).toBeFalsy();

    await connection.disconnect();
    await onDisconnect;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT payload types', async () => {
    const connection = await makeConnection();

    let onDisconnect = once(connection, 'disconnect');

    await connection.connect();

    const id = uuid();

    const tests: { [key: string]: { send: Payload, recv: ArrayBuffer } } = {
        [`test/types/${id}/string`]: {
            send: 'utf-8 👁👄👁 time',
            recv: fromUtf8('utf-8 👁👄👁 time').buffer,
        },
        [`test/types/${id}/dataview`]: {
            send: new DataView(fromUtf8('I was a DataView').buffer),
            recv: fromUtf8('I was a DataView').buffer,
        },
        [`test/types/${id}/uint8array`]: {
            // note: sending partial view of a larger buffer
            send: new Uint8Array(new Uint8Array([0, 1, 2, 3, 4, 5, 6]).buffer, 2, 3),
            recv: new Uint8Array([2, 3, 4]).buffer,
        },
        [`test/types/${id}/arraybuffer`]: {
            send: new Uint8Array([0, 255, 255, 255, 255, 255, 1]).buffer,
            recv: new Uint8Array([0, 255, 255, 255, 255, 255, 1]).buffer,
        },
        [`test/types/${id}/json`]: {
            send: { I: "was JSON" },
            recv: fromUtf8('{"I": "was JSON"}').buffer,
        },
    };

    // as messages are received, delete items.
    // when this object is empty all expected messages have been received.
    let expecting: { [key: string]: ArrayBuffer } = {}
    for (const topic in tests) {
        expecting[topic] = tests[topic].recv;
    }

    var resolveMessagesReceivedPromise: (value: void | PromiseLike<void>) => void;
    let messagesReceivedPromise = new Promise<void>( (resolve, reject) => {
        resolveMessagesReceivedPromise = resolve;
    });

    connection.on('message', async (topic, payload, dup, qos, retain) => {
        // QoS1 message might arrive multiple times.
        // so it's no big deal if we've already seen this topic
        if (!(topic in expecting)) {
            return;
        }

        expect(payload).toEqual(expecting[topic]);
        delete expecting[topic];

        if (Object.keys(expecting).length == 0) {
            resolveMessagesReceivedPromise();
        }
    });

    await connection.subscribe(`test/types/${id}/#`, QoS.AtLeastOnce);

    for (const topic in tests) {
        await connection.publish(topic, tests[topic].send, QoS.AtLeastOnce);
    }

    await messagesReceivedPromise;

    await connection.disconnect();
    await onDisconnect;
});
