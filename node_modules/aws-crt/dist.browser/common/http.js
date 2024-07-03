"use strict";
/*
 *
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonHttpProxyOptions = exports.HttpProxyAuthenticationType = exports.HttpVersion = void 0;
/**
 *
 * A module containing support for creating http connections and making requests on them.
 *
 * @packageDocumentation
 * @module http
 */
/**
 * HTTP protocol version
 *
 * @category HTTP
 */
var HttpVersion;
(function (HttpVersion) {
    HttpVersion[HttpVersion["Unknown"] = 0] = "Unknown";
    /** HTTP/1.0 */
    HttpVersion[HttpVersion["Http1_0"] = 1] = "Http1_0";
    /** HTTP/1.1 */
    HttpVersion[HttpVersion["Http1_1"] = 2] = "Http1_1";
    /** HTTP/2 */
    HttpVersion[HttpVersion["Http2"] = 3] = "Http2";
})(HttpVersion = exports.HttpVersion || (exports.HttpVersion = {}));
/**
 * Proxy authentication types
 *
 * @category HTTP
 */
var HttpProxyAuthenticationType;
(function (HttpProxyAuthenticationType) {
    /**
     * No to-proxy authentication logic
     */
    HttpProxyAuthenticationType[HttpProxyAuthenticationType["None"] = 0] = "None";
    /**
     * Use basic authentication (user/pass).  Supply these values in {@link HttpProxyOptions}
     */
    HttpProxyAuthenticationType[HttpProxyAuthenticationType["Basic"] = 1] = "Basic";
})(HttpProxyAuthenticationType = exports.HttpProxyAuthenticationType || (exports.HttpProxyAuthenticationType = {}));
;
/**
 * Options used when connecting to an HTTP endpoint via a proxy
 *
 * @category HTTP
 */
var CommonHttpProxyOptions = /** @class */ (function () {
    /**
     *
     * @param host_name endpoint of the proxy to use
     * @param port port of proxy to use
     * @param auth_method type of authentication to use with the proxy
     * @param auth_username (basic authentication only) proxy username
     * @param auth_password (basic authentication only) password associated with the username
     */
    function CommonHttpProxyOptions(host_name, port, auth_method, auth_username, auth_password) {
        if (auth_method === void 0) { auth_method = HttpProxyAuthenticationType.None; }
        this.host_name = host_name;
        this.port = port;
        this.auth_method = auth_method;
        this.auth_username = auth_username;
        this.auth_password = auth_password;
    }
    return CommonHttpProxyOptions;
}());
exports.CommonHttpProxyOptions = CommonHttpProxyOptions;
//# sourceMappingURL=http.js.map