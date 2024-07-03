/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_env from "@test/test_env"
import { ClientBootstrap, SocketOptions } from './io';
import { MqttClient, MqttConnectionConfig } from './mqtt';
import { v4 as uuid } from 'uuid';
jest.setTimeout(10000);

async function test_connection(config: MqttConnectionConfig, client: MqttClient) {
    const connection = client.new_connection(config);
    const promise = new Promise(async (resolve, reject) => {
        connection.on('connect', async (session_present) => {
            const disconnected = connection.disconnect();
            await expect(disconnected).resolves.toBeUndefined();

            if (session_present) {
                reject("Session present");
            }
        });
        connection.on('error', (error) => {
            reject(error);
        })
        connection.on('disconnect', () => {
            resolve(true);
        })
        const connected = connection.connect();
        await expect(connected).resolves.toBeDefined();
    });
    await expect(promise).resolves.toBeTruthy();
}

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_mqtt())('MQTT311 WS Connection - no credentials', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_MQTT_PORT),
        clean_session: true,
        socket_options: new SocketOptions()
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_ws_auth_mqtt())('MQTT311 WS Connection - basic auth', async () => {
    const config : MqttConnectionConfig = {
        client_id : `node-mqtt-unit-test-${uuid()}`,
        host_name: test_env.AWS_IOT_ENV.MQTT311_WS_AUTH_MQTT_HOST,
        port: parseInt(test_env.AWS_IOT_ENV.MQTT311_WS_AUTH_MQTT_PORT),
        clean_session: true,
        username: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_USERNAME,
        password: test_env.AWS_IOT_ENV.MQTT311_BASIC_AUTH_PASSWORD,
        socket_options: new SocketOptions()
    }
    await test_connection(config, new MqttClient(new ClientBootstrap()));
});
