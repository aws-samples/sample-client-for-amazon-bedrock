/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_utils from "@test/mqtt5";
import * as test_env from "@test/test_env"
import * as mqtt5 from "./mqtt5";
import * as iot from "./iot";
import * as fs from 'fs';
import * as auth from "./auth";
import * as io from "./io";
import {CRuntimeType, cRuntime} from "./binding"

jest.setTimeout(10000);

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_mtls_rsa())('Aws Iot Core Direct Mqtt By File - Connection Success', async () => {
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromPath(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        test_env.AWS_IOT_ENV.MQTT5_RSA_CERT,
        test_env.AWS_IOT_ENV.MQTT5_RSA_KEY
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});


test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_mtls_rsa())('Aws Iot Core Direct Mqtt By In-Memory - Connection Success', async () => {
    let cert = fs.readFileSync(test_env.AWS_IOT_ENV.MQTT5_RSA_CERT,'utf8');
    let key = fs.readFileSync(test_env.AWS_IOT_ENV.MQTT5_RSA_KEY,'utf8');
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromMemory(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        cert,
        key
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_unsigned())('Aws Iot Core Direct Mqtt Non-Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_PASSWORD, "utf-8")
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Direct Mqtt Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_PASSWORD, "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_TOKEN,
        tokenSignature: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_SIGNATURE
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Direct Mqtt Signing Custom Auth - Connection Success Unencoded Signature', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_PASSWORD, "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_TOKEN,
        tokenSignature: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_SIGNATURE_UNENCODED
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_cred())('Aws Iot Core Websocket by Sigv4 - Connection Success', async () => {
    let provider: auth.AwsCredentialsProvider = auth.AwsCredentialsProvider.newStatic(
        test_env.AWS_IOT_ENV.MQTT5_CRED_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT5_CRED_SECRET_ACCESS_KEY,
        test_env.AWS_IOT_ENV.MQTT5_CRED_SESSION_TOKEN
    );
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            credentialsProvider: provider
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

// requires correct credentials to be sourced from the default credentials provider chain
test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_websocket())('Aws Iot Core Websocket Default Credentials - Connection Success', async () => {
    let provider: auth.AwsCredentialsProvider = auth.AwsCredentialsProvider.newDefault();
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            credentialsProvider: provider
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_cognito())('Aws Iot Core Websocket Cognito Credentials - Connection Success', async () => {
    let provider: auth.AwsCredentialsProvider = auth.AwsCredentialsProvider.newCognito(
        {
            identity: test_env.AWS_IOT_ENV.MQTT5_COGNITO_IDENTITY,
            endpoint: test_env.AWS_IOT_ENV.MQTT5_COGNITO_ENDPOINT
        }
    );
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            credentialsProvider: provider
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_x509())('Aws Iot Core Websocket X509 Credentials - Connection Success', async () => {
    let tls_ctx_options: io.TlsContextOptions = io.TlsContextOptions.create_client_with_mtls_from_path(
        test_env.AWS_IOT_ENV.MQTT5_X509_CERT,
        test_env.AWS_IOT_ENV.MQTT5_X509_KEY
    );
    let tls_ctx = new io.ClientTlsContext(tls_ctx_options);
    let provider: auth.AwsCredentialsProvider = auth.AwsCredentialsProvider.newX509(
        {
            endpoint: test_env.AWS_IOT_ENV.MQTT5_X509_ENDPOINT,
            thingName: test_env.AWS_IOT_ENV.MQTT5_X509_THING_NAME,
            roleAlias: test_env.AWS_IOT_ENV.MQTT5_X509_ROLE_ALIAS,
            tlsContext: tls_ctx
        }
    );
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            credentialsProvider: provider
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_unsigned())('Aws Iot Core Direct Mqtt Non-Signing Custom Auth - Connection Failure Bad Password', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_USERNAME,
        password: Buffer.from("Thisisnotthepassword", "utf-8")
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Direct Mqtt Signing Custom Auth - Connection Failure Bad Password', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from("Thisisnotthepassword", "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_TOKEN,
        tokenSignature: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_SIGNATURE
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Direct Mqtt Signing Custom Auth - Connection Failure Bad Token Value', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_PASSWORD, "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: "ThisIsNotTheTokenValue",
        tokenSignature: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_SIGNATURE
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Direct Mqtt Signing Custom Auth - Connection Failure Bad Token Signature', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_PASSWORD, "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_TOKEN,
        tokenSignature: "ThisIsNotTheTokenSignature"
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_unsigned())('Aws Iot Core Websocket Mqtt Non-Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_UNSIGNED_PASSWORD, "utf-8")
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_custom_auth_signed())('Aws Iot Core Websocket Mqtt Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : iot.MqttConnectCustomAuthConfig = {
        authorizerName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_NAME,
        username: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_USERNAME,
        password: Buffer.from(test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_PASSWORD, "utf-8"),
        tokenKeyName: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_KEY_NAME,
        tokenValue: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_TOKEN,
        tokenSignature: test_env.AWS_IOT_ENV.MQTT5_CUSTOM_AUTH_SIGNED_SIGNATURE
    };
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        customAuthConfig
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

/**
 * Skip test if cruntime is Musl. Softhsm library crashes on Alpine if we don't use AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE.
 * Supporting AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE on Node-js is not trivial due to non-deterministic cleanup.
 * TODO: Support AWS_PKCS11_LIB_STRICT_INITIALIZE_FINALIZE
 */
test_env.conditional_test(cRuntime !== CRuntimeType.MUSL && test_env.AWS_IOT_ENV.mqtt5_is_valid_pkcs11())('Aws Iot Core PKCS11 - Connection Success', async () => {
    const pkcs11_lib = new io.Pkcs11Lib(test_env.AWS_IOT_ENV.MQTT5_PKCS11_LIB_PATH);
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromPkcs11(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            pkcs11_lib: pkcs11_lib,
            user_pin: test_env.AWS_IOT_ENV.MQTT5_PKCS11_PIN,
            token_label: test_env.AWS_IOT_ENV.MQTT5_PKCS11_TOKEN_LABEL,
            private_key_object_label: test_env.AWS_IOT_ENV.MQTT5_PKCS11_PRIVATE_KEY_LABEL,
            cert_file_path: test_env.AWS_IOT_ENV.MQTT5_PKCS11_CERT,
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_pkcs12())('Aws Iot Core PKCS12 - Connection Success', async () => {
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromPkcs12(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        {
            pkcs12_file : test_env.AWS_IOT_ENV.MQTT5_PKCS12_FILE,
            pkcs12_password : test_env.AWS_IOT_ENV.MQTT5_PKCS12_PASSWORD
        }
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_env.conditional_test(test_env.AWS_IOT_ENV.mqtt5_is_valid_windows_cert())('Aws Iot Core Window Cert - Connection Success', async () => {
    let builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromWindowsCertStorePath(
        test_env.AWS_IOT_ENV.MQTT5_HOST,
        test_env.AWS_IOT_ENV.MQTT5_WINDOWS_CERT
    );
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

