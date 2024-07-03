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
exports.create_mqtt5_websocket_stream = exports.create_mqtt5_websocket_url = exports.create_websocket_stream = exports.create_websocket_url = void 0;
var mqtt5 = __importStar(require("./mqtt5"));
var error_1 = require("./error");
var websocket = require('@httptoolkit/websocket-stream');
var Crypto = __importStar(require("crypto-js"));
var iot_shared = __importStar(require("../common/aws_iot_shared"));
/** @internal */
function zero_pad(n) {
    return (n > 9) ? n : '0' + n.toString();
}
/** @internal */
function canonical_time(time) {
    var now = time !== null && time !== void 0 ? time : new Date();
    return "".concat(now.getUTCFullYear()).concat(zero_pad(now.getUTCMonth() + 1)).concat(zero_pad(now.getUTCDate()), "T") +
        "".concat(zero_pad(now.getUTCHours())).concat(zero_pad(now.getUTCMinutes())).concat(zero_pad(now.getUTCSeconds()), "Z");
}
/** @internal */
function canonical_day(time) {
    if (time === void 0) { time = canonical_time(); }
    return time.substring(0, time.indexOf('T'));
}
/** @internal */
function make_signing_key(credentials, day, service_name) {
    if (credentials == null || credentials == undefined) {
        throw new error_1.CrtError("make_signing_key: credentials not defined");
    }
    var hash_opts = { asBytes: true };
    var hash = Crypto.HmacSHA256(day, 'AWS4' + credentials.aws_secret_key, hash_opts);
    hash = Crypto.HmacSHA256(credentials.aws_region || '', hash, hash_opts);
    hash = Crypto.HmacSHA256(service_name, hash, hash_opts);
    hash = Crypto.HmacSHA256('aws4_request', hash, hash_opts);
    return hash;
}
/** @internal */
function sign_url(method, url, signing_config, time, day, payload) {
    var _a;
    if (time === void 0) { time = canonical_time(); }
    if (day === void 0) { day = canonical_day(time); }
    if (payload === void 0) { payload = ''; }
    if (signing_config == null || signing_config == undefined) {
        throw new error_1.CrtError("sign_url: signing_config not defined");
    }
    // region should not have been put in credentials, but we have to live with it
    var region = (_a = signing_config.credentials.aws_region) !== null && _a !== void 0 ? _a : signing_config.region;
    var signed_headers = 'host';
    var service = signing_config.service;
    var canonical_headers = "host:".concat(url.hostname.toLowerCase(), "\n");
    var payload_hash = Crypto.SHA256(payload, { asBytes: true });
    var canonical_params = url.search.replace(new RegExp('^\\?'), '');
    var canonical_request = "".concat(method, "\n").concat(url.pathname, "\n").concat(canonical_params, "\n").concat(canonical_headers, "\n").concat(signed_headers, "\n").concat(payload_hash);
    var canonical_request_hash = Crypto.SHA256(canonical_request, { asBytes: true });
    var signature_raw = "AWS4-HMAC-SHA256\n".concat(time, "\n").concat(day, "/").concat(region, "/").concat(service, "/aws4_request\n").concat(canonical_request_hash);
    var signing_key = make_signing_key(signing_config.credentials, day, service);
    var signature = Crypto.HmacSHA256(signature_raw, signing_key, { asBytes: true });
    var query_params = "".concat(url.search, "&X-Amz-Signature=").concat(signature);
    if (signing_config.credentials.aws_sts_token) {
        query_params += "&X-Amz-Security-Token=".concat(encodeURIComponent(signing_config.credentials.aws_sts_token));
    }
    var signed_url = "".concat(url.protocol, "//").concat(url.hostname).concat(url.pathname).concat(query_params);
    return signed_url;
}
/** @internal */
function create_websocket_url(config) {
    var _a, _b, _c, _d;
    if (config == null || config == undefined) {
        throw new error_1.CrtError("create_websocket_url: config not defined");
    }
    var path = '/mqtt';
    var protocol = (config.websocket || {}).protocol || 'wss';
    if (protocol === 'wss') {
        var websocketoptions = config.websocket;
        var credentials = (_a = config.credentials_provider) === null || _a === void 0 ? void 0 : _a.getCredentials();
        var signing_config_value = (_c = (_b = websocketoptions.create_signing_config) === null || _b === void 0 ? void 0 : _b.call(websocketoptions)) !== null && _c !== void 0 ? _c : {
            service: (_d = websocketoptions.service) !== null && _d !== void 0 ? _d : "iotdevicegateway",
            credentials: credentials,
            date: new Date()
        };
        var signing_config = signing_config_value;
        var time = canonical_time(signing_config.date);
        var day = canonical_day(time);
        var query_params = "X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=".concat(signing_config.credentials.aws_access_id) +
            "%2F".concat(day, "%2F").concat(signing_config.credentials.aws_region, "%2F").concat(signing_config.service, "%2Faws4_request&X-Amz-Date=").concat(time, "&X-Amz-SignedHeaders=host");
        var url = new URL("wss://".concat(config.host_name, ":").concat(config.port).concat(path, "?").concat(query_params));
        return sign_url('GET', url, signing_config, time, day);
    }
    else if (protocol === 'wss-custom-auth') {
        return "wss://".concat(config.host_name, ":").concat(config.port).concat(path);
    }
    throw new URIError("Invalid protocol requested: ".concat(protocol));
}
exports.create_websocket_url = create_websocket_url;
/** @internal */
function create_websocket_stream(config) {
    var url = create_websocket_url(config);
    return websocket(url, ['mqttv3.1'], config.websocket);
}
exports.create_websocket_stream = create_websocket_stream;
/** @internal */
function create_mqtt5_websocket_url(config) {
    var _a, _b;
    if (config == null || config == undefined) {
        throw new error_1.CrtError("create_mqtt5_websocket_url: config not defined");
    }
    var path = '/mqtt';
    var websocketConfig = (_a = config.websocketOptions) !== null && _a !== void 0 ? _a : { urlFactoryOptions: { urlFactory: mqtt5.Mqtt5WebsocketUrlFactoryType.Ws } };
    var urlFactory = websocketConfig.urlFactoryOptions.urlFactory;
    switch (urlFactory) {
        case mqtt5.Mqtt5WebsocketUrlFactoryType.Ws:
            return "ws://".concat(config.hostName, ":").concat(config.port).concat(path);
            break;
        case mqtt5.Mqtt5WebsocketUrlFactoryType.Wss:
            return "wss://".concat(config.hostName, ":").concat(config.port).concat(path);
            break;
        case mqtt5.Mqtt5WebsocketUrlFactoryType.Sigv4:
            var sigv4Options = websocketConfig.urlFactoryOptions;
            var credentials = sigv4Options.credentialsProvider.getCredentials();
            if (credentials === undefined) {
                throw new error_1.CrtError("Websockets with sigv4 requires valid AWS credentials");
            }
            var region = (_b = sigv4Options.region) !== null && _b !== void 0 ? _b : iot_shared.extractRegionFromEndpoint(config.hostName);
            var signingConfig = {
                service: "iotdevicegateway",
                region: region,
                credentials: credentials,
                date: new Date()
            };
            var time = canonical_time(signingConfig.date);
            var day = canonical_day(time);
            var query_params = "X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=".concat(signingConfig.credentials.aws_access_id) +
                "%2F".concat(day, "%2F").concat(region, "%2F").concat(signingConfig.service, "%2Faws4_request&X-Amz-Date=").concat(time, "&X-Amz-SignedHeaders=host");
            var url = new URL("wss://".concat(config.hostName, ":").concat(config.port).concat(path, "?").concat(query_params));
            return sign_url('GET', url, signingConfig, time, day);
        case mqtt5.Mqtt5WebsocketUrlFactoryType.Custom:
            var customOptions = websocketConfig.urlFactoryOptions;
            return customOptions.customUrlFactory();
    }
    throw new URIError("Invalid url factory requested: ".concat(urlFactory));
}
exports.create_mqtt5_websocket_url = create_mqtt5_websocket_url;
/** @internal */
function create_mqtt5_websocket_stream(config) {
    var _a;
    var url = create_mqtt5_websocket_url(config);
    var ws = websocket(url, ['mqtt'], (_a = config.websocketOptions) === null || _a === void 0 ? void 0 : _a.wsOptions);
    return ws;
}
exports.create_mqtt5_websocket_stream = create_mqtt5_websocket_stream;
//# sourceMappingURL=ws.js.map