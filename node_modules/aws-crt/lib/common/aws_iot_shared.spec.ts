/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as iot_shared from "./aws_iot_shared";

jest.setTimeout(10000);

test('Aws IoT Mqtt5 Username Construction - No Custom Auth', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername(undefined);

    expect(finalUsername).toEqual(expect.stringContaining("?SDK=NodeJSv2&Version="));
});

test('Aws IoT Mqtt5 Username Construction - Empty custom auth', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername({});

    expect(finalUsername).toEqual(expect.stringContaining("?SDK=NodeJSv2&Version="));
});


test('Aws IoT Mqtt5 Username Construction - Simple username', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername({
        username: "Derp"
    });

    expect(finalUsername).toEqual(expect.stringContaining("Derp?SDK=NodeJSv2&Version="));
});

test('Aws IoT Mqtt5 Username Construction - Query param username', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername({
        username: "Derp?Param1=Value1"
    });

    expect(finalUsername).toEqual(expect.stringContaining("Derp?Param1=Value1&SDK=NodeJSv2&Version="));
});

test('Aws IoT Mqtt5 Username Construction - Authorizer Name', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername({
        username: "Hello",
        authorizerName: "MyAuthorizer"
    });

    expect(finalUsername).toEqual(expect.stringContaining("Hello?x-amz-customauthorizer-name=MyAuthorizer&SDK=NodeJSv2&Version="));
});

test('Aws IoT Mqtt5 Username Construction - Token Signing', async () => {
    let finalUsername : string = iot_shared.buildMqtt5FinalUsername({
        username: "Hello",
        authorizerName: "MyAuthorizer",
        tokenKeyName: "MyToken",
        tokenValue: "TheToken",
        tokenSignature: "SignedToken"
    });

    expect(finalUsername).toEqual(expect.stringContaining("Hello?x-amz-customauthorizer-name=MyAuthorizer&MyToken=TheToken&x-amz-customauthorizer-signature=SignedToken&SDK=NodeJSv2&Version="));
});

test('Aws IoT Mqtt5 Username Construction Failure - Missing token key name', async () => {
    let customAuthConfig : iot_shared.MqttConnectCustomAuthConfig = {
        username: "Hello",
        authorizerName: "MyAuthorizer",
        tokenValue: "TheToken",
        tokenSignature: "SignedToken"
    };

    expect(() => { return iot_shared.buildMqtt5FinalUsername(customAuthConfig); }).toThrow();
});

test('Aws IoT Mqtt5 Username Construction Failure - Missing token value', async () => {
    let customAuthConfig : iot_shared.MqttConnectCustomAuthConfig = {
        username: "Hello",
        authorizerName: "MyAuthorizer",
        tokenKeyName: "MyToken",
        tokenSignature: "SignedToken"
    };

    expect(() => { return iot_shared.buildMqtt5FinalUsername(customAuthConfig); }).toThrow();
});

test('Aws IoT Mqtt5 Username Construction Failure - Missing token signature', async () => {
    let customAuthConfig : iot_shared.MqttConnectCustomAuthConfig = {
        username: "Hello",
        authorizerName: "MyAuthorizer",
        tokenKeyName: "MyToken",
        tokenValue: "TheToken"
    };

    expect(() => { return iot_shared.buildMqtt5FinalUsername(customAuthConfig); }).toThrow();
});

test('Aws IoT Mqtt5 Username Construction Failure - bad query username', async () => {
    let customAuthConfig : iot_shared.MqttConnectCustomAuthConfig = {
        username: "Derp?Param1=Value1?What"
    };

    expect(() => { return iot_shared.buildMqtt5FinalUsername(customAuthConfig); }).toThrow();
});

test('Extract region from endpoint success', async () => {
    expect(iot_shared.extractRegionFromEndpoint("blahblah-ats.iot.us-west-2.amazonaws.com")).toEqual("us-west-2");
});