/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_env from "@test/test_env"
import * as mqtt311 from "./mqtt";
import * as aws_iot_mqtt311 from "./aws_iot";
import * as io from "./io"
import * as auth from "./auth"
import { v4 as uuid } from 'uuid';
import {once} from "events";
import {cRuntime, CRuntimeType} from "./binding"
import {newLiftedPromise} from "../common/promise";

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_unsigned())('Aws Iot Core Mqtt over websockets with Non-Signing Custom Auth - Connection Success', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket();
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_NAME,
        "",
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_PASSWORD,
        undefined,
        undefined,
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
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket();
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

/**
 * Skip test if cruntime is Musl. Softhsm library crashes on Alpine if we don't use AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE.
 * Supporting AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE on Node-js is not trivial due to non-deterministic cleanup.
 * TODO: Support AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE
 */
test_env.conditional_test(cRuntime !== CRuntimeType.MUSL && test_env.AWS_IOT_ENV.mqtt311_is_valid_pkcs11())('Aws Iot Core PKCS11 connection', async () => {

    const pkcs11_lib = new io.Pkcs11Lib(test_env.AWS_IOT_ENV.MQTT311_PKCS11_LIB_PATH);
    const builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_mtls_pkcs11_builder({
        pkcs11_lib: pkcs11_lib,
        user_pin: test_env.AWS_IOT_ENV.MQTT311_PKCS11_PIN,
        token_label: test_env.AWS_IOT_ENV.MQTT311_PKCS11_TOKEN_LABEL,
        private_key_object_label: test_env.AWS_IOT_ENV.MQTT311_PKCS11_PRIVATE_KEY_LABEL,
        cert_file_path: test_env.AWS_IOT_ENV.MQTT311_PKCS11_CERT,
    });
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_pkcs12())('Aws Iot Core PKCS12 connection', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_mtls_pkcs12_builder({
        pkcs12_file : test_env.AWS_IOT_ENV.MQTT311_PKCS12_FILE,
        pkcs12_password : test_env.AWS_IOT_ENV.MQTT311_PKCS12_PASSWORD});
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_windows_cert())('Aws Iot Core Windows Cert connection', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_mtls_windows_cert_store_path_builder(
        test_env.AWS_IOT_ENV.MQTT311_WINDOWS_CERT);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_unsigned())('Aws Iot Core - Direct MQTT Custom Auth unsigned', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_NAME,
        "",
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_UNSIGNED_PASSWORD,
        undefined,
        undefined)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_signed())('Aws Iot Core - Direct MQTT Custom Auth signed', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_SIGNATURE,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_PASSWORD,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_KEY_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_TOKEN)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_custom_auth_signed())('Aws Iot Core - Direct MQTT Custom Auth signed, unencoded signature', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_default_builder();
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_custom_authorizer(
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_USERNAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_SIGNATURE_UNENCODED,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_PASSWORD,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_KEY_NAME,
        test_env.AWS_IOT_ENV.MQTT311_CUSTOM_AUTH_SIGNED_TOKEN)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cred())('MQTT Native Websocket Connect/Disconnect', async () => {
    let websocket_config = {
        region: test_env.AWS_IOT_ENV.MQTT311_REGION,
        credentials_provider: auth.AwsCredentialsProvider.newStatic(
            test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
            test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
            test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN
        ),
    }
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets(websocket_config);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient(new io.ClientBootstrap());
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cred())('MQTT Native Websocket Connect/Disconnect No Bootstrap', async () => {
    let websocket_config = {
        region: test_env.AWS_IOT_ENV.MQTT311_REGION,
        credentials_provider: auth.AwsCredentialsProvider.newStatic(
            test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
            test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
            test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN
        ),
    }
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets(websocket_config);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);

    const connectionSuccess = once(connection, "connection_success");
    await connection.connect();

    let connectionSuccessEvent: mqtt311.OnConnectionSuccessResult = (await connectionSuccess)[0];
    expect(connectionSuccessEvent.session_present).toBeFalsy();
    expect(connectionSuccessEvent.reason_code).toBeDefined();
    expect(connectionSuccessEvent.reason_code).toBe(0); // Success

    const closed = once(connection, "closed");
    await connection.disconnect();
    await closed;
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cred())('MQTT Native Websocket Connect/Disconnect - Connection Failure', async () => {
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets();
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_credentials(
        test_env.AWS_IOT_ENV.MQTT311_REGION,
        test_env.AWS_IOT_ENV.MQTT311_CRED_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SECRET_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT311_CRED_SESSION_TOKEN
    );
    /* Use the wrong port and endpoint ensure a fail */
    builder.with_endpoint("testendpointhere");
    builder.with_port(321);
    let config = builder.build();

    let failurePromise = newLiftedPromise<mqtt311.OnConnectionFailedResult>();

    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    connection.on('error', () => {});
    connection.on('connection_failure', (result) => { failurePromise.resolve(result)});

    let expected_error = false;
    try {
        await connection.connect();
    } catch (error) {
        expected_error = true;
    }
    expect(expected_error).toBeTruthy();

    let connectionFailedEvent: mqtt311.OnConnectionFailedResult = await failurePromise.promise;
    expect(connectionFailedEvent).toBeDefined();
    expect(connectionFailedEvent.error).toBeDefined();
});

// requires correct credentials to be sourced from the default credentials provider chain
test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_websocket())('MQTT Native Websocket Default AWS Credentials', async () => {
    let websocket_config = {
        region: test_env.AWS_IOT_ENV.MQTT311_REGION,
        credentials_provider: auth.AwsCredentialsProvider.newDefault()
    }
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets(websocket_config);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    builder.with_port(443);
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);

    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_cognito())('MQTT Native Websocket Cognito Credentials', async () => {
    let websocket_config = {
        region: test_env.AWS_IOT_ENV.MQTT311_REGION,
        credentials_provider: auth.AwsCredentialsProvider.newCognito({
            identity: test_env.AWS_IOT_ENV.MQTT311_COGNITO_IDENTITY,
            endpoint: test_env.AWS_IOT_ENV.MQTT311_COGNITO_ENDPOINT
        })
    }
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets(websocket_config);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt311_is_valid_x509())('MQTT Native Websocket X509 Credentials', async () => {
    let tls_ctx_options: io.TlsContextOptions = io.TlsContextOptions.create_client_with_mtls_from_path(
        test_env.AWS_IOT_ENV.MQTT311_X509_CERT,
        test_env.AWS_IOT_ENV.MQTT311_X509_KEY
    );
    let tls_ctx = new io.ClientTlsContext(tls_ctx_options);
    let websocket_config = {
        region: test_env.AWS_IOT_ENV.MQTT311_REGION,
        credentials_provider: auth.AwsCredentialsProvider.newX509({
            endpoint: test_env.AWS_IOT_ENV.MQTT311_X509_ENDPOINT,
            thingName: test_env.AWS_IOT_ENV.MQTT311_X509_THING_NAME,
            roleAlias: test_env.AWS_IOT_ENV.MQTT311_X509_ROLE_ALIAS,
            tlsContext: tls_ctx
        })
    }
    let builder = aws_iot_mqtt311.AwsIotMqttConnectionConfigBuilder.new_with_websockets(websocket_config);
    builder.with_endpoint(test_env.AWS_IOT_ENV.MQTT311_HOST);
    builder.with_client_id(`node-mqtt-unit-test-${uuid()}`)
    let config = builder.build();
    let client = new mqtt311.MqttClient();
    let connection = client.new_connection(config);
    await connection.connect();
    await connection.disconnect();
});
