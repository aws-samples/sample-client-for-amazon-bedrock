"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRegionFromEndpoint = exports.buildMqtt5FinalUsername = exports.canonicalizeCustomAuthConfig = exports.canonicalizeCustomAuthTokenSignature = exports.populate_username_string_with_custom_authorizer = exports.is_string_and_not_empty = exports.add_to_username_parameter = void 0;
/**
 *
 * A module containing miscellaneous functionality that is shared across both native and browser for aws_iot
 *
 * @packageDocumentation
 * @module aws_iot
 */
const platform = __importStar(require("./platform"));
const utils = __importStar(require("./utils"));
/**
 * A helper function to add parameters to the username in with_custom_authorizer function
 *
 * @internal
 */
function add_to_username_parameter(current_username, parameter_value, parameter_pre_text) {
    let return_string = current_username;
    if (return_string.indexOf("?") != -1) {
        return_string += "&";
    }
    else {
        return_string += "?";
    }
    if (parameter_value.indexOf(parameter_pre_text) != -1) {
        return return_string + parameter_value;
    }
    else {
        return return_string + parameter_pre_text + parameter_value;
    }
}
exports.add_to_username_parameter = add_to_username_parameter;
/**
 * A helper function to see if a string is not null, is defined, and is not an empty string
 *
 * @internal
 */
function is_string_and_not_empty(item) {
    return item != undefined && typeof (item) == 'string' && item != "";
}
exports.is_string_and_not_empty = is_string_and_not_empty;
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
function populate_username_string_with_custom_authorizer(current_username, input_username, input_authorizer, input_signature, input_builder_username, input_token_key_name, input_token_value) {
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
exports.populate_username_string_with_custom_authorizer = populate_username_string_with_custom_authorizer;
;
/** @internal */
function canonicalizeCustomAuthTokenSignature(signature) {
    if (signature === undefined || signature == null) {
        return undefined;
    }
    let hasPercent = signature.indexOf("%") != -1;
    if (hasPercent) {
        return signature;
    }
    else {
        return encodeURIComponent(signature);
    }
}
exports.canonicalizeCustomAuthTokenSignature = canonicalizeCustomAuthTokenSignature;
/** @internal */
function canonicalizeCustomAuthConfig(config) {
    let processedConfig = {};
    utils.set_defined_property(processedConfig, "authorizerName", config.authorizerName);
    utils.set_defined_property(processedConfig, "username", config.username);
    utils.set_defined_property(processedConfig, "password", config.password);
    utils.set_defined_property(processedConfig, "tokenKeyName", config.tokenKeyName);
    utils.set_defined_property(processedConfig, "tokenValue", config.tokenValue);
    utils.set_defined_property(processedConfig, "tokenSignature", canonicalizeCustomAuthTokenSignature(config.tokenSignature));
    return processedConfig;
}
exports.canonicalizeCustomAuthConfig = canonicalizeCustomAuthConfig;
/** @internal */
function addParam(paramName, paramValue, paramSet) {
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
function buildMqtt5FinalUsername(customAuthConfig) {
    let path = "";
    let paramList = [];
    if (customAuthConfig) {
        /* If we're using token-signing authentication, then all token properties must be set */
        let usingSigning = false;
        if (customAuthConfig.tokenValue || customAuthConfig.tokenKeyName || customAuthConfig.tokenSignature) {
            usingSigning = true;
            if (!customAuthConfig.tokenValue || !customAuthConfig.tokenKeyName || !customAuthConfig.tokenSignature) {
                throw new Error("Token-based custom authentication requires all token-related properties to be set");
            }
        }
        let username = customAuthConfig.username;
        let pathSplit = (username !== null && username !== void 0 ? username : "").split("?");
        let params = pathSplit.slice(1);
        path = pathSplit[0];
        if (params.length > 1) {
            throw new Error("Custom auth username property value is invalid");
        }
        else if (params.length == 1) {
            params[0].split("&").forEach((keyValue, index, array) => {
                var _a;
                let kvPair = keyValue.split("=");
                paramList.push([kvPair[0], (_a = kvPair[1]) !== null && _a !== void 0 ? _a : ""]);
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
    return (path !== null && path !== void 0 ? path : "") + "?" + paramList.map((value) => `${value[0]}=${value[1]}`).join("&");
}
exports.buildMqtt5FinalUsername = buildMqtt5FinalUsername;
/**
 * Attempts to determine the AWS region associated with an endpoint.
 *
 * @param endpoint endpoint to compute the region for
 *
 * @internal
 */
function extractRegionFromEndpoint(endpoint) {
    const regexpRegion = /^[\w\-]+\.[\w\-]+\.([\w+\-]+)\./;
    const match = endpoint.match(regexpRegion);
    if (match) {
        return match[1];
    }
    throw new Error("AWS region could not be extracted from endpoint.  Use 'region' property on WebsocketConfig to set manually.");
}
exports.extractRegionFromEndpoint = extractRegionFromEndpoint;
//# sourceMappingURL=aws_iot_shared.js.map