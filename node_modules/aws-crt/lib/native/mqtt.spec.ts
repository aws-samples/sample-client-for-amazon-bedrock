/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_env from "@test/test_env"
import { ClientBootstrap, TlsContextOptions, ClientTlsContext, SocketOptions } from './io';
import { MqttClient, MqttConnectionConfig, QoS } from './mqtt';
import { v4 as uuid } from 'uuid';
import { OnConnectionSuccessResult, OnConnectionClosedResult } from '../common/mqtt';
import {HttpProxyOptions, HttpProxyAuthenticationType, HttpProxyConnectionType} from "./http"
import { AwsIotMqttConnectionConfigBuilder } from './aws_iot';
import {once} from "events";

jest.setTimeout(10000);

async function test_connection(config: MqttConnectionConfig, client: MqttClient) {
    const connection = client.new_connection(config);
    const promise = new Promise(async (resolve, reject) => {
        let onConnectionSuccessCalled = false;
        let onConnectionDisconnectCalled = false;

        connection.on('connect', async (session_present) => {
            const disconnected = connection.disconnect();
            await expect(disconnected).resolves.toBeUndefined();

            if (session_present) {
                reject("Session present");
            }
        });
        connection.on('error', (error) => {
            reject(error);
        });
        connection.on('disconnect', () => {
            onConnectionDisconnectCalled = true;
        });
        connection.on('connection_success', async (callback_data:OnConnectionSuccessResult) => {
            expect(callback_data.session_present).toBe(false);
            expect(callback_data.reason_code).toBeDefined();
            expect(callback_data.reason_code).toBe(0); // Success
            onConnectionSuccessCalled = true;
        })
        connection.on('closed', async (callback_data:OnConnectionClosedResult) => {
            /**
             * We want to wait *just* a little bit, as we might be still processing the disconnect callback
             * at the exact same time as this callback is called (closed is called RIGHT after disconnect)
             */
            await new Promise(r => setTimeout(r, 500));

            // Make sure connection_success was called before us
            expect(onConnectionSuccessCalled).toBeTruthy();
            // Make sure disconnect was called before us
            expect(onConnectionDisconnectCalled).toBeTruthy();
            resolve(true);
        })
        const connected = connection.connect();
        await expect(connected).resolves.toBeDefined();
    });
    await expect(promise).resolves.toBeTruthy();
}

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_direct_mqtt())('MQTT311 Connection - no credentials', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_DIRECT_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_DIRECT_MQTT_PORT),
        clean_session: true,
        socket_options: new SocketOptions()
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_direct_auth_mqtt())('MQTT311 Connection - basic auth', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_DIRECT_AUTH_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_DIRECT_AUTH_MQTT_PORT),
        clean_session: true,
        username: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_USERNAME,
        password: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_PASSWORD,
        socket_options: new SocketOptions()
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_direct_tls_mqtt())('MQTT311 Connection - TLS', async () => {
    const tls_ctx_options = new TlsContextOptions();
    tls_ctx_options.verify_peer = false;
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_DIRECT_TLS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_DIRECT_TLS_MQTT_PORT),
        clean_session: true,
        socket_options: new SocketOptions(),
        tls_ctx: new ClientTlsContext(tls_ctx_options)
    };
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_direct_proxy())('MQTT311 Connection - Proxy', async () => {
    const tls_ctx_options = new TlsContextOptions();
    tls_ctx_options.verify_peer = false;
    let tls_ctx = new ClientTlsContext(tls_ctx_options);

    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_DIRECT_TLS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_DIRECT_TLS_MQTT_PORT),
        clean_session: true,
        proxy_options: new HttpProxyOptions(
            test_env.AWS_IOT_ENV.MQTT311_PROXY_HOST,
            parseInt(test_env.AWS_IOT_ENV.MQTT311_PROXY_PORT),
            HttpProxyAuthenticationType.None,
            undefined,
            undefined,
            undefined,
            HttpProxyConnectionType.Tunneling
        ),
        socket_options: new SocketOptions(),
        tls_ctx: tls_ctx
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_rsa())('MQTT311 Connection - mTLS RSA', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_HOST,
        port: 8883,
        clean_session: true,
        socket_options: new SocketOptions()
    }
    let tls_ctx_options: TlsContextOptions = TlsContextOptions.create_client_with_mtls_from_path(
        test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_RSA_CERT,
        test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_RSA_KEY
    );
    config.tls_ctx = new ClientTlsContext(tls_ctx_options);
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_ecc())('MQTT311 Connection - mTLS ECC', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_HOST,
        port: 8883,
        clean_session: true,
        socket_options: new SocketOptions()
    }
    let tls_ctx_options: TlsContextOptions = TlsContextOptions.create_client_with_mtls_from_path(
        test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_ECC_CERT,
        test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_ECC_KEY
    );
    config.tls_ctx = new ClientTlsContext(tls_ctx_options);
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_mqtt())('MQTT311 WS Connection - no credentials', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_MQTT_PORT),
        clean_session: true,
        use_websocket: true,
        socket_options: new SocketOptions()
    }
    config.websocket_handshake_transform = async (request, done) => {
        done();
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_auth_mqtt())('MQTT311 WS Connection - basic auth', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_AUTH_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_AUTH_MQTT_PORT),
        clean_session: true,
        use_websocket: true,
        username: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_USERNAME,
        password: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_PASSWORD,
        socket_options: new SocketOptions()
    }
    config.websocket_handshake_transform = async (request, done) => {
        done();
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_tls_mqtt())('MQTT311 WS Connection - TLS', async () => {
    const tls_ctx_options = new TlsContextOptions();
    tls_ctx_options.verify_peer = false;
    let tls_ctx = new ClientTlsContext(tls_ctx_options);
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_TLS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_TLS_MQTT_PORT),
        clean_session: true,
        use_websocket: true,
        socket_options: new SocketOptions(),
        tls_ctx: tls_ctx
    }
    config.websocket_handshake_transform = async (request, done) => {
        done();
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_proxy())('MQTT311 WS Connection - Proxy', async () => {
    const tls_ctx_options = new TlsContextOptions();
    tls_ctx_options.verify_peer = false;
    let tls_ctx = new ClientTlsContext(tls_ctx_options);
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_TLS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_TLS_MQTT_PORT),
        clean_session: true,
        use_websocket: true,
        proxy_options: new HttpProxyOptions(
            test_env.AWS_IOT_ENV.MQTT311_PROXY_HOST,
            parseInt(test_env.AWS_IOT_ENV.MQTT311_PROXY_PORT),
            HttpProxyAuthenticationType.None,
            undefined,
            undefined,
            undefined,
            HttpProxyConnectionType.Tunneling
        ),
        socket_options: new SocketOptions(),
        tls_ctx: tls_ctx
    }
    config.websocket_handshake_transform = async (request, done) => {
        done();
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});
/**
 * Helper function to make creating an IoT Core connection easier.
 */
function make_test_iot_core_connection(clean_session?: boolean) {
    const config = AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
        test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_RSA_CERT, test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_RSA_KEY)
        .with_client_id(`node-mqtt-unit-test-${uuid()}`)
        .with_endpoint(test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_HOST)
        .with_credentials(
            test_env.AWS_IOT_ENV.MQTT311_IOT_MQTT_REGION, test_env.AWS_IOT_ENV.MQTT311_IOT_CRED_ACCESS_KEY,
            test_env.AWS_IOT_ENV.MQTT311_IOT_CRED_SECRET_ACCESS_KEY, test_env.AWS_IOT_ENV.MQTT311_IOT_CRED_SESSION_TOKEN);

    if (clean_session != undefined) {
        config.with_clean_session(clean_session);
    } else {
        config.with_clean_session(true)
    }

    const client = new MqttClient(new ClientBootstrap());
    return client.new_connection(config.build());
}

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Operation statistics simple', async () => {
    const promise = new Promise(async (resolve, reject) => {

        const connection = make_test_iot_core_connection();

        connection.on('connect', async (session_present) => {
            expect(session_present).toBeFalsy();

            let statistics = connection.getOperationalStatistics();
            expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(0);
            expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(0);
            // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
            // TODO - find a way to test unacked operations reliably without worrying about socket speed.

            const test_topic = `/test/me/senpai/${uuid()}`;
            const test_payload = 'NOTICE ME';
            const sub = connection.subscribe(test_topic, QoS.AtLeastOnce, async (topic, payload, dup, qos, retain) => {
                resolve(true);

                const unsubscribed = connection.unsubscribe(test_topic);
                await expect(unsubscribed).resolves.toHaveProperty('packet_id');

                statistics = connection.getOperationalStatistics();
                expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(0);
                expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(0);
                // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
                // TODO - find a way to test unacked operations reliably without worrying about socket speed.

                const disconnected = connection.disconnect();
                await expect(disconnected).resolves.toBeUndefined();
            });
            await expect(sub).resolves.toBeTruthy();

            const pub = connection.publish(test_topic, test_payload, QoS.AtLeastOnce);
            await expect(pub).resolves.toBeTruthy();
        });
        connection.on('error', (error) => {
            reject(error);
        });
        const connected = connection.connect();
        await expect(connected).resolves.toBeDefined();
    });
    await expect(promise).resolves.toBeTruthy();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Operation statistics check publish', async () => {
    const promise = new Promise(async (resolve, reject) => {

        const connection = make_test_iot_core_connection();

        connection.on('connect', async (session_present) => {
            expect(session_present).toBeFalsy();

            let statistics = connection.getOperationalStatistics();
            expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(0);
            expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(0);
            // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
            // TODO - find a way to test unacked operations reliably without worrying about socket speed.

            const test_topic = `/test/me/senpai/${uuid()}`;
            const test_payload = 'NOTICE ME';
            const sub = connection.subscribe(test_topic, QoS.AtLeastOnce, async (topic, payload, dup, qos, retain) => {
                resolve(true);

                const unsubscribed = connection.unsubscribe(test_topic);
                await expect(unsubscribed).resolves.toHaveProperty('packet_id');

                const disconnected = connection.disconnect();
                await expect(disconnected).resolves.toBeUndefined();
            });
            await expect(sub).resolves.toBeTruthy();

            const pub = connection.publish(test_topic, test_payload, QoS.AtLeastOnce);
            await expect(pub).resolves.toBeTruthy();

            statistics = connection.getOperationalStatistics();
            expect(statistics.incompleteOperationCount).toBeLessThanOrEqual(1);
            expect(statistics.incompleteOperationSize).toBeLessThanOrEqual(test_topic.length + test_payload.length + 4);
            // Skip checking unacked operations - it heavily depends on socket speed and makes tests flakey
            // TODO - find a way to test unacked operations reliably without worrying about socket speed.
        });
        connection.on('error', (error) => {
            reject(error);
        });
        const connected = connection.connect();
        await expect(connected).resolves.toBeDefined();
    });
    await expect(promise).resolves.toBeTruthy();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Disconnect behavior hard-disconnect - default functions like expected', async () => {
    const promise = new Promise(async (resolve, reject) => {

        const connection = make_test_iot_core_connection(
            false /* clean start */);
        await connection.connect();
        const closed = once(connection, "closed");
        await connection.disconnect();
        await closed;

        // Native resources should have been cleaned on the disconnect, so the connect attempt should throw.
        let did_throw = false;
        await connection.connect().catch(err => {
            did_throw = true;
        })
        expect(did_throw).toBeTruthy();
        resolve(true);
    });
    await expect(promise).resolves.toBeTruthy();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_iot_cred())('MQTT Disconnect behavior hard-disconnect - ensure operations do not work after disconnect', async () => {
    const promise = new Promise(async (resolve, reject) => {

        const connection = make_test_iot_core_connection(
            false /* clean start */);
        await connection.connect();
        const closed = once(connection, "closed");
        await connection.disconnect();
        await closed;

        // Doing any operations after disconnect should throw because the client is cleaned up
        let did_throw = false;
        await connection.publish("test/example/topic", "payload", QoS.AtLeastOnce).catch(err => {
            did_throw = true;
        })
        expect(did_throw).toBeTruthy();
        resolve(true);
    });
    await expect(promise).resolves.toBeTruthy();
});
