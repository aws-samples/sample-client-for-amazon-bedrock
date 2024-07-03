/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_env from "@test/test_env"
import * as mqtt311 from "./mqtt";
import * as aws_iot_mqtt311 from "./aws_iot";
import * as io from "./io"
import { v4 as uuid } from 'uuid';
import {once} from "events";

jest.setTimeout(10000);

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_unsigned())('Aws Iot Core Mqtt over websockets with Non-Signing Custom Auth - Connection Success', async () => {

    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_NAME,
        "",
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_PASSWORD
    )
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_signed())('Aws Iot Core Mqtt over websockets with Signing Custom Auth - Connection Success', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_SIGNATURE,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_PASSWORD,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_KEY_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_TOKEN,
    )
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_signed())('Aws Iot Core Mqtt over websockets with Signing Custom Auth Unencoded Signature - Connection Success', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_SIGNATURE_UNENCODED,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_PASSWORD,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_KEY_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_TOKEN,
    )
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cred())('MQTT Browser Websocket Connect/Disconnect', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets();
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_credentials(
        test_env.AWS_IOT_ENV.MQTT311_REGION,
        test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN
    );
    let config = builder.build();
    let client = new mqtt311.MqttClient(new io.ClientBootstrap());
    let connection = client.new_connection(config);

    const connectionSuccess = once(connection, "connection_success");
    await connection.connect();

    let connectionSuccessEvent: mqtt311.OnConnectionSuccessResult = (await connectionSuccess)[0];
    expect(connectionSuccessEvent.session_present).toBeFalsy();
    expect(connectionSuccessEvent.reason_code).toBeUndefined();

    const closed = once(connection, "closed");
    await connection.disconnect();
    await closed;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cred())('MQTT Browser Websocket Connect/Disconnect No Bootstrap', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets();
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_credentials(
        test_env.AWS_IOT_ENV.MQTT311_REGION,
        test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN
    );
    let config = builder.build();

    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);

    const connectionSuccess = once(connection, "connection_success");
    await connection.connect();

    let connectionSuccessEvent: mqtt311.OnConnectionSuccessResult = (await connectionSuccess)[0];
    expect(connectionSuccessEvent.session_present).toBeFalsy();
    expect(connectionSuccessEvent.reason_code).toBeUndefined();

    const closed = once(connection, "closed");
    await connection.disconnect();
    await closed;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_signed())('MQTT Browser Websocket Connect/Disconnect - Connection Failure', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_SIGNATURE,
        "Thisisnotthepassword",
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_KEY_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_TOKEN,
    )
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);

    const connectionFailure = once(connection, "connection_failure")
    try {
        connection.connect();
    } catch (error) {
        // Skip - this is expected because we are intentionally using a bad password
    }

    let connectionFailedEvent: mqtt311.OnConnectionFailedResult = (await connectionFailure)[0];
    expect(connectionFailedEvent).toBeDefined();
    expect(connectionFailedEvent.error).toBeDefined();

    // Disconnect to stop trying to reconnect
    connection.disconnect();
});
