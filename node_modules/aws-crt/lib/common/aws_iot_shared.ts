/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing miscellaneous functionality that is shared across both native and browser for aws_iot
 *
 * @packageDocumentation
 * @module aws_iot
 */


import * as platform from "./platform";
import * as mqtt5_packet from "./mqtt5_packet";
import * as utils from "./utils";

/**
 * A helper function to add parameters to the username in with_custom_authorizer function
 *
 * @internal
 */
 export function add_to_username_parameter(current_username : string, parameter_value : string, parameter_pre_text : string) {
    let return_string = current_username;

    if (return_string.indexOf("?") != -1) {
        return_string += "&"
    } else {
        return_string += "?"
    }

    if (parameter_value.indexOf(parameter_pre_text) != -1) {
        return return_string + parameter_value;
    } else {
        return return_string + parameter_pre_text + parameter_value;
    }
}

/**
 * A helper function to see if a string is not null, is defined, and is not an empty string
 *
 * @internal
 */
 export function is_string_and_not_empty(item : any) {
    return item != undefined && typeof(item) == 'string' && item != "";
}

/**
 * A helper function to populate the username with the Custom Authorizer fields
 * @param current_username the current username
 * @param input_username the username to add - can be an empty string to skip
 * @param input_authorizer the name of the authorizer to add - can be an empty string to skip
 * @param input_signature the name of the signature to add - can be an empty string to skip
 * @param input_builder_username the username from the MQTT builder
 * @param input_token_key_name the token key name
 * @param input_token_value the token key value
 * @returns The finished username with the additions added to it
 *
 * @internal
 */
export function populate_username_string_with_custom_authorizer(
    current_username? : string, input_username? : string, input_authorizer? : string,
    input_signature? : string, input_builder_username? : string,
    input_token_key_name? : string, input_token_value? : string) {

    let username_string = "";

    if (current_username) {
        username_string += current_username;
    }
    if (is_string_and_not_empty(input_username) == false) {
        if (is_string_and_not_empty(input_builder_username) && input_builder_username) {
            username_string += input_builder_username;
        }
    }
    else {
        username_string += input_username;
    }

    if (is_string_and_not_empty(input_authorizer) && input_authorizer) {
        username_string = add_to_username_parameter(username_string, input_authorizer, "x-amz-customauthorizer-name=");
    }

    if (is_string_and_not_empty(input_signature) || is_string_and_not_empty(input_token_value) || is_string_and_not_empty(input_token_key_name)) {
        if (!input_token_value || !input_token_key_name || !input_signature) {
            throw new Error("Signing-based custom authentication requires all token-related properties to be set");
        }
    }

    if (is_string_and_not_empty(input_signature) && input_signature) {
        username_string = add_to_username_parameter(username_string, input_signature, "x-amz-customauthorizer-signature=");
    }

    if (is_string_and_not_empty(input_token_value) && is_string_and_not_empty(input_token_key_name)) {
        // @ts-ignore
        username_string = add_to_username_parameter(username_string, input_token_value, input_token_key_name + "=");
    }

    return username_string;
}

/**
 * Configuration options specific to
 * [AWS IoT Core custom authentication](https://docs.aws.amazon.com/iot/latest/developerguide/custom-authentication.html)
 * features.  For clients constructed by an {@link AwsIotMqtt5ClientConfigBuilder}, all parameters associated
 * with AWS IoT custom authentication are passed via the username and password properties in the CONNECT packet.
 */
export interface MqttConnectCustomAuthConfig {

    /**
     * Name of the custom authorizer to use.
     *
     * Required if the endpoint does not have a default custom authorizer associated with it.  It is strongly suggested
     * to URL-encode this value; the SDK will not do so for you.
     */
    authorizerName?: string;

    /**
     * The username to use with the custom authorizer.  Query-string elements of this property value will be unioned
     * with the query-string elements implied by other properties in this object.
     *
     * For example, if you set this to:
     *
     * 'MyUsername?someKey=someValue'
     *
     * and use {@link authorizerName} to specify the authorizer, the final username would look like:
     *
     * `MyUsername?someKey=someValue&x-amz-customauthorizer-name=<your authorizer's name>&...`
     */
    username?: string;

    /**
     * The password to use with the custom authorizer.  Becomes the MQTT5 CONNECT packet's password property.
     * AWS IoT Core will base64 encode this binary data before passing it to the authorizer's lambda function.
     */
    password?: mqtt5_packet.BinaryData;

    /**
     * Key used to extract the custom authorizer token from MQTT username query-string properties.
     *
     * Required if the custom authorizer has signing enabled.  It is strongly suggested to URL-encode this value; the
     * SDK will not do so for you.
     */
    tokenKeyName?: string;

    /**
     * An opaque token value. This value must be signed by the private key associated with the custom authorizer and
     * the result placed in the {@link tokenSignature} property.
     *
     * Required if the custom authorizer has signing enabled.
     */
    tokenValue?: string;

    /**
     * The digital signature of the token value in the {@link tokenValue} property.  The signature must be based on
     * the private key associated with the custom authorizer.  The signature must be base64 encoded.
     *
     * Required if the custom authorizer has signing enabled.
     */
    tokenSignature?: string;
};

/** @internal */
export function canonicalizeCustomAuthTokenSignature(signature?: string) : string | undefined {
    if (signature === undefined || signature == null) {
        return undefined;
    }

    let hasPercent = signature.indexOf("%") != -1;
    if (hasPercent) {
        return signature;
    } else {
        return encodeURIComponent(signature);
    }
}

/** @internal */
export function canonicalizeCustomAuthConfig(config: MqttConnectCustomAuthConfig) : MqttConnectCustomAuthConfig {
    let processedConfig : MqttConnectCustomAuthConfig = {};

    utils.set_defined_property(processedConfig, "authorizerName", config.authorizerName);
    utils.set_defined_property(processedConfig, "username", config.username);
    utils.set_defined_property(processedConfig, "password", config.password);
    utils.set_defined_property(processedConfig, "tokenKeyName", config.tokenKeyName);
    utils.set_defined_property(processedConfig, "tokenValue", config.tokenValue);
    utils.set_defined_property(processedConfig, "tokenSignature", canonicalizeCustomAuthTokenSignature(config.tokenSignature));

    return processedConfig;
}

/** @internal */
function addParam(paramName: string, paramValue: string | undefined, paramSet: [string, string][]) : void {
    if (paramValue) {
        paramSet.push([paramName, paramValue]);
    }
}

/**
 * Builds the final value for the CONNECT packet's username property based on AWS IoT custom auth configuration
 * and SDK metrics properties.
 *
 * @param customAuthConfig intended AWS IoT custom auth client configuration
 *
 * @internal
 */
export function buildMqtt5FinalUsername(customAuthConfig?: MqttConnectCustomAuthConfig) : string {

    let path : string = "";
    let paramList : [string, string][] = [];

    if (customAuthConfig) {
        /* If we're using token-signing authentication, then all token properties must be set */
        let usingSigning : boolean = false;
        if (customAuthConfig.tokenValue || customAuthConfig.tokenKeyName || customAuthConfig.tokenSignature) {
            usingSigning = true;
            if (!customAuthConfig.tokenValue || !customAuthConfig.tokenKeyName || !customAuthConfig.tokenSignature) {
                throw new Error("Token-based custom authentication requires all token-related properties to be set");
            }
        }

        let username : string | undefined = customAuthConfig.username;
        let pathSplit : string[] = (username ?? "").split("?");
        let params : string[] = pathSplit.slice(1);
        path = pathSplit[0];

        if (params.length > 1) {
            throw new Error("Custom auth username property value is invalid");
        } else if (params.length == 1) {
            params[0].split("&").forEach((keyValue, index, array) => {
                let kvPair = keyValue.split("=");
                paramList.push([kvPair[0], kvPair[1] ?? ""]);
            });
        }

        addParam("x-amz-customauthorizer-name", customAuthConfig.authorizerName, paramList);
        if (usingSigning) {
            // @ts-ignore verified earlier
            addParam(customAuthConfig.tokenKeyName, customAuthConfig.tokenValue, paramList);
            addParam("x-amz-customauthorizer-signature", customAuthConfig.tokenSignature, paramList);
        }
    }

    paramList.push(["SDK", "NodeJSv2"]);
    paramList.push(["Version", platform.crt_version()]);

    return (path ?? "") + "?" + paramList.map((value : [string, string]) => `${value[0]}=${value[1]}`).join("&");
}

/**
 * Attempts to determine the AWS region associated with an endpoint.
 *
 * @param endpoint endpoint to compute the region for
 *
 * @internal
 */
export function extractRegionFromEndpoint(endpoint: string) : string {
    const regexpRegion = /^[\w\-]+\.[\w\-]+\.([\w+\-]+)\./;
    const match = endpoint.match(regexpRegion);
    if (match) {
        return match[1];
    }

    throw new Error("AWS region could not be extracted from endpoint.  Use 'region' property on WebsocketConfig to set manually.");
}
