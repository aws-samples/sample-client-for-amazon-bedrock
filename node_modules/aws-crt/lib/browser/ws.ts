/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Module for utilities related to websocket connection establishment
 *
 * @packageDocumentation
 * @module ws
 * @mergeTarget
 */

import { MqttConnectionConfig } from "./mqtt";
import * as mqtt5 from "./mqtt5";
import { AWSCredentials, AwsSigningConfig} from "./auth";
import { WebsocketOptionsBase } from "../common/auth";
import { CrtError } from "./error";
var websocket = require('@httptoolkit/websocket-stream')
import * as Crypto from "crypto-js";
import * as iot_shared from "../common/aws_iot_shared";

/**
 * Options for websocket based connections in browser
 *
 * @category MQTT
 */
export interface WebsocketOptions extends WebsocketOptionsBase {
    /** Additional headers to add */
    headers?: { [index: string]: string };
    /** Websocket protocol, used during Upgrade */
    protocol?: string;
}

/** @internal */
function zero_pad(n: number) {
    return (n > 9) ? n : '0' + n.toString();
}

/** @internal */
function canonical_time(time?: Date) {
    const now = time?? new Date();
    return `${now.getUTCFullYear()}${zero_pad(now.getUTCMonth() + 1)}${zero_pad(now.getUTCDate())}T` +
        `${zero_pad(now.getUTCHours())}${zero_pad(now.getUTCMinutes())}${zero_pad(now.getUTCSeconds())}Z`;
}

/** @internal */
function canonical_day(time: string = canonical_time()) {
    return time.substring(0, time.indexOf('T'));
}

/** @internal */
function make_signing_key(credentials: AWSCredentials, day: string, service_name: string) {
    if (credentials == null || credentials == undefined) {
        throw new CrtError("make_signing_key: credentials not defined");
    }
    const hash_opts = { asBytes: true };
    let hash = Crypto.HmacSHA256(day, 'AWS4' + credentials.aws_secret_key, hash_opts);
    hash = Crypto.HmacSHA256(credentials.aws_region || '', hash, hash_opts);
    hash = Crypto.HmacSHA256(service_name, hash, hash_opts);
    hash = Crypto.HmacSHA256('aws4_request', hash, hash_opts);
    return hash;
}

/** @internal */
function sign_url(method: string,
    url: URL,
    signing_config: AwsSigningConfig,
    time: string = canonical_time(),
    day: string = canonical_day(time),
    payload: string = '') {

    if (signing_config == null || signing_config == undefined) {
        throw new CrtError("sign_url: signing_config not defined");
    }

    // region should not have been put in credentials, but we have to live with it
    let region: string = signing_config.credentials.aws_region ?? signing_config.region;

    const signed_headers = 'host';
    const service = signing_config.service!;
    const canonical_headers = `host:${url.hostname.toLowerCase()}\n`;
    const payload_hash = Crypto.SHA256(payload, { asBytes: true });
    const canonical_params = url.search.replace(new RegExp('^\\?'), '');
    const canonical_request = `${method}\n${url.pathname}\n${canonical_params}\n${canonical_headers}\n${signed_headers}\n${payload_hash}`;
    const canonical_request_hash = Crypto.SHA256(canonical_request, { asBytes: true });
    const signature_raw = `AWS4-HMAC-SHA256\n${time}\n${day}/${region}/${service}/aws4_request\n${canonical_request_hash}`;
    const signing_key = make_signing_key(signing_config.credentials, day, service);
    const signature = Crypto.HmacSHA256(signature_raw, signing_key, { asBytes: true });
    let query_params = `${url.search}&X-Amz-Signature=${signature}`;
    if (signing_config.credentials.aws_sts_token) {
        query_params += `&X-Amz-Security-Token=${encodeURIComponent(signing_config.credentials.aws_sts_token)}`;
    }
    const signed_url = `${url.protocol}//${url.hostname}${url.pathname}${query_params}`;
    return signed_url;
}

/** @internal */
export function create_websocket_url(config: MqttConnectionConfig) {
    if (config == null || config == undefined) {
        throw new CrtError("create_websocket_url: config not defined");
    }
    const path = '/mqtt';
    const protocol = (config.websocket || {}).protocol || 'wss';
    if (protocol === 'wss') {
        const websocketoptions = config.websocket!;
        const credentials = config.credentials_provider?.getCredentials();
        const signing_config_value = websocketoptions.create_signing_config?.()
                    ?? {
                    service: websocketoptions.service ?? "iotdevicegateway",
                    credentials: credentials,
                    date: new Date()
                };
        const signing_config = signing_config_value as AwsSigningConfig;
        const time = canonical_time(signing_config.date);
        const day = canonical_day(time);
        const query_params = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${signing_config.credentials.aws_access_id}` +
            `%2F${day}%2F${signing_config.credentials.aws_region}%2F${signing_config.service}%2Faws4_request&X-Amz-Date=${time}&X-Amz-SignedHeaders=host`;
        const url = new URL(`wss://${config.host_name}:${config.port}${path}?${query_params}`);
        return sign_url('GET', url, signing_config, time, day);
    }
    else if (protocol === 'wss-custom-auth') {
        return `wss://${config.host_name}:${config.port}${path}`;
    }
    throw new URIError(`Invalid protocol requested: ${protocol}`);
}

/** @internal */
export function create_websocket_stream(config: MqttConnectionConfig) {
    const url = create_websocket_url(config);
    return websocket(url, ['mqttv3.1'], config.websocket);
}


/** @internal */
export function create_mqtt5_websocket_url(config: mqtt5.Mqtt5ClientConfig) {
    if (config == null || config == undefined) {
        throw new CrtError("create_mqtt5_websocket_url: config not defined");
    }
    const path = '/mqtt';
    const websocketConfig : mqtt5.Mqtt5WebsocketConfig = config.websocketOptions ?? { urlFactoryOptions: { urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Ws} };
    const urlFactory : mqtt5.Mqtt5WebsocketUrlFactoryType = websocketConfig.urlFactoryOptions.urlFactory;

    switch(urlFactory) {
        case mqtt5.Mqtt5WebsocketUrlFactoryType.Ws:
            return `ws://${config.hostName}:${config.port}${path}`;
            break;

        case mqtt5.Mqtt5WebsocketUrlFactoryType.Wss:
            return `wss://${config.hostName}:${config.port}${path}`;
            break;

        case mqtt5.Mqtt5WebsocketUrlFactoryType.Sigv4:
            const sigv4Options : mqtt5.Mqtt5WebsocketUrlFactorySigv4Options = websocketConfig.urlFactoryOptions as mqtt5.Mqtt5WebsocketUrlFactorySigv4Options;
            const credentials = sigv4Options.credentialsProvider.getCredentials();
            if (credentials === undefined) {
                throw new CrtError("Websockets with sigv4 requires valid AWS credentials");
            }

            let region : string = sigv4Options.region ?? iot_shared.extractRegionFromEndpoint(config.hostName);

            const signingConfig : AwsSigningConfig = {
                service: "iotdevicegateway",
                region: region,
                credentials: credentials,
                date: new Date()
            };

            const time = canonical_time(signingConfig.date);
            const day = canonical_day(time);
            const query_params = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${signingConfig.credentials.aws_access_id}` +
                `%2F${day}%2F${region}%2F${signingConfig.service}%2Faws4_request&X-Amz-Date=${time}&X-Amz-SignedHeaders=host`;
            const url = new URL(`wss://${config.hostName}:${config.port}${path}?${query_params}`);
            return sign_url('GET', url, signingConfig, time, day);

        case mqtt5.Mqtt5WebsocketUrlFactoryType.Custom:
            const customOptions : mqtt5.Mqtt5WebsocketUrlFactoryCustomOptions = websocketConfig.urlFactoryOptions as mqtt5.Mqtt5WebsocketUrlFactoryCustomOptions;
            return customOptions.customUrlFactory();
    }

    throw new URIError(`Invalid url factory requested: ${urlFactory}`);
}

/** @internal */
export function create_mqtt5_websocket_stream(config: mqtt5.Mqtt5ClientConfig) {
    const url = create_mqtt5_websocket_url(config);
    let ws = websocket(url, ['mqtt'], config.websocketOptions?.wsOptions);

    return ws;
}
