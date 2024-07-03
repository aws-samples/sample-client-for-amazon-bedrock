/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as test_utils from "@test/mqtt5";
import * as mqtt5 from "./mqtt5";
import * as aws_iot_mqtt5 from "./aws_iot_mqtt5";
import {v4 as uuid} from "uuid";
import * as auth from "./auth";

jest.setTimeout(10000);

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasIoTCoreEnvironmentCred())('Aws Iot Core Mqtt over websockets with environmental credentials - Connection Success', async () => {
    let provider: auth.StaticCredentialProvider = new auth.StaticCredentialProvider({
        aws_access_id: test_utils.ClientEnvironmentalConfig.AWS_IOT_ACCESS_KEY_ID,
        aws_secret_key: test_utils.ClientEnvironmentalConfig.AWS_IOT_SECRET_ACCESS_KEY,
        aws_sts_token: test_utils.ClientEnvironmentalConfig.AWS_IOT_SESSION_TOKEN,
        aws_region: "us-east-1"
    });

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        {
            credentialsProvider: provider,
            // the region extraction logic does not work for gamma endpoint formats so pass in region manually
            region: "us-east-1"
        }
    );

    builder.withConnectProperties({
        keepAliveIntervalSeconds: 1200,
        clientId: `client-${uuid()}`
    });

    // @ts-ignore
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Non-Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_NO_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_NO_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from(test_utils.ClientEnvironmentalConfig.AWS_IOT_NO_SIGNING_AUTHORIZER_PASSWORD, "utf-8")
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Signing Custom Auth - Connection Success', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from(test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_PASSWORD, "utf-8"),
        tokenKeyName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_KEY_NAME,
        tokenValue: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN,
        tokenSignature: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_SIGNATURE
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Signing Custom Auth Unencoded Signature - Connection Success', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from(test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_PASSWORD, "utf-8"),
        tokenKeyName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_KEY_NAME,
        tokenValue: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN,
        tokenSignature: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_SIGNATURE_UNENCODED
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testConnect(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Non-Signing Custom Auth - Connection Failure Bad Password', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_NO_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_NO_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from("Thisisnotthepassword", "utf-8")
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Signing Custom Auth - Connection Failure Bad Password', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from("Thisisnotthepassword", "utf-8"),
        tokenKeyName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_KEY_NAME,
        tokenValue: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN,
        tokenSignature: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_SIGNATURE
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Signing Custom Auth - Connection Failure Bad Token Value', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from(test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_PASSWORD, "utf-8"),
        tokenKeyName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_KEY_NAME,
        tokenValue: "ThisIsNotTheTokenValue",
        tokenSignature: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_SIGNATURE
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});

test_utils.conditional_test(test_utils.ClientEnvironmentalConfig.hasCustomAuthEnvironment())('Aws Iot Core Mqtt over websockets with Signing Custom Auth - Connection Failure Bad Token Signature', async () => {
    let customAuthConfig : aws_iot_mqtt5.MqttConnectCustomAuthConfig = {
        authorizerName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_NAME,
        username: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_USERNAME,
        password: Buffer.from(test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_PASSWORD, "utf-8"),
        tokenKeyName: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN_KEY_NAME,
        tokenValue: test_utils.ClientEnvironmentalConfig.AWS_IOT_SIGNING_AUTHORIZER_TOKEN,
        tokenSignature: "ThisIsNotTheTokenSignature"
    };

    let builder = aws_iot_mqtt5.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithCustomAuth(
        test_utils.ClientEnvironmentalConfig.AWS_IOT_HOST,
        customAuthConfig
    );

    // @ts-ignore
    await test_utils.testFailedConnection(new mqtt5.Mqtt5Client(builder.build()));
});
