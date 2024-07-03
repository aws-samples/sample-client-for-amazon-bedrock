"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aws_verify_sigv4a_signing = exports.aws_sign_request = exports.AwsSignedBodyHeaderType = exports.AwsSignedBodyValue = exports.AwsSignatureType = exports.AwsSigningAlgorithm = exports.AwsCredentialsProvider = void 0;
const binding_1 = __importDefault(require("./binding"));
const error_1 = require("./error");
const io_1 = require("./io");
/**
 * Credentials providers source the AwsCredentials needed to sign an authenticated AWS request.
 *
 * We don't currently expose an interface for fetching credentials from Javascript.
 *
 * @category Auth
 */
/* Subclass for the purpose of exposing a non-NativeHandle based API */
class AwsCredentialsProvider extends binding_1.default.AwsCredentialsProvider {
    /**
     * Creates a new default credentials provider to be used internally for AWS credentials resolution:
     *
     *   The CRT's default provider chain currently sources in this order:
     *
     *     1. Environment
     *     2. Profile
     *     3. (conditional, off by default) ECS
     *     4. (conditional, on by default) EC2 Instance Metadata
     *
     * @param bootstrap (optional) client bootstrap to be used to establish any required network connections
     *
     * @returns a new credentials provider using default credentials resolution rules
     */
    static newDefault(bootstrap = undefined) {
        return super.newDefault(bootstrap != null ? bootstrap.native_handle() : null);
    }
    /**
     * Creates a new credentials provider that returns a fixed set of credentials.
     *
     * @param access_key access key to use in the static credentials
     * @param secret_key secret key to use in the static credentials
     * @param session_token (optional) session token to use in the static credentials
     *
     * @returns a new credentials provider that will return a fixed set of AWS credentials
     */
    static newStatic(access_key, secret_key, session_token) {
        return super.newStatic(access_key, secret_key, session_token);
    }
    /**
     * Creates a new credentials provider that sources credentials from the AWS Cognito Identity service via the
     * GetCredentialsForIdentity http API.
     *
     * @param config provider configuration necessary to make GetCredentialsForIdentity web requests
     *
     * @returns a new credentials provider that returns credentials sourced from the AWS Cognito Identity service
     */
    static newCognito(config) {
        if (config == null || config == undefined) {
            throw new error_1.CrtError("AwsCredentialsProvider newCognito: Cognito config not defined");
        }
        return super.newCognito(config, config.tlsContext != null ? config.tlsContext.native_handle() : new io_1.ClientTlsContext().native_handle(), config.bootstrap != null ? config.bootstrap.native_handle() : null, config.httpProxyOptions ? config.httpProxyOptions.create_native_handle() : null);
    }
    /**
     * Creates a new credentials provider that sources credentials from the the X509 service on AWS IoT Core.
     *
     * @param config provider configuration necessary to source credentials via X509
     *
     * @returns a new credentials provider that returns credentials sourced from the AWS X509 service
     */
    static newX509(config) {
        if (config == null || config == undefined) {
            throw new error_1.CrtError("AwsCredentialsProvider newX509: X509 config not defined");
        }
        return super.newX509(config, config.tlsContext.native_handle(), config.httpProxyOptions ? config.httpProxyOptions.create_native_handle() : null);
    }
}
exports.AwsCredentialsProvider = AwsCredentialsProvider;
/**
 * AWS signing algorithm enumeration.
 *
 * @category Auth
 */
var AwsSigningAlgorithm;
(function (AwsSigningAlgorithm) {
    /** Use the Aws signature version 4 signing process to sign the request */
    AwsSigningAlgorithm[AwsSigningAlgorithm["SigV4"] = 0] = "SigV4";
    /** Use the Aws signature version 4 Asymmetric signing process to sign the request */
    AwsSigningAlgorithm[AwsSigningAlgorithm["SigV4Asymmetric"] = 1] = "SigV4Asymmetric";
})(AwsSigningAlgorithm = exports.AwsSigningAlgorithm || (exports.AwsSigningAlgorithm = {}));
/**
 * AWS signature type enumeration.
 *
 * @category Auth
 */
var AwsSignatureType;
(function (AwsSignatureType) {
    /** Sign an http request and apply the signing results as headers */
    AwsSignatureType[AwsSignatureType["HttpRequestViaHeaders"] = 0] = "HttpRequestViaHeaders";
    /** Sign an http request and apply the signing results as query params */
    AwsSignatureType[AwsSignatureType["HttpRequestViaQueryParams"] = 1] = "HttpRequestViaQueryParams";
    /** Sign an http request payload chunk */
    AwsSignatureType[AwsSignatureType["HttpRequestChunk"] = 2] = "HttpRequestChunk";
    /** Sign an event stream event */
    AwsSignatureType[AwsSignatureType["HttpRequestEvent"] = 3] = "HttpRequestEvent";
})(AwsSignatureType = exports.AwsSignatureType || (exports.AwsSignatureType = {}));
/**
 * Values for use with {@link AwsSigningConfig.signed_body_value}.
 *
 * Some services use special values (e.g. 'UNSIGNED-PAYLOAD') when the body
 * is not being signed in the usual way.
 *
 * @category Auth
 */
var AwsSignedBodyValue;
(function (AwsSignedBodyValue) {
    /** Use the SHA-256 of the empty string as the canonical request payload value */
    AwsSignedBodyValue["EmptySha256"] = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    /** Use the literal string 'UNSIGNED-PAYLOAD' as the canonical request payload value  */
    AwsSignedBodyValue["UnsignedPayload"] = "UNSIGNED-PAYLOAD";
    /** Use the literal string 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD' as the canonical request payload value  */
    AwsSignedBodyValue["StreamingAws4HmacSha256Payload"] = "STREAMING-AWS4-HMAC-SHA256-PAYLOAD";
    /** Use the literal string 'STREAMING-AWS4-HMAC-SHA256-EVENTS' as the canonical request payload value  */
    AwsSignedBodyValue["StreamingAws4HmacSha256Events"] = "STREAMING-AWS4-HMAC-SHA256-EVENTS";
})(AwsSignedBodyValue = exports.AwsSignedBodyValue || (exports.AwsSignedBodyValue = {}));
/**
 * AWS signed body header enumeration.
 *
 * @category Auth
 */
var AwsSignedBodyHeaderType;
(function (AwsSignedBodyHeaderType) {
    /** Do not add a header containing the canonical request payload value */
    AwsSignedBodyHeaderType[AwsSignedBodyHeaderType["None"] = 0] = "None";
    /** Add the X-Amz-Content-Sha256 header with the canonical request payload value */
    AwsSignedBodyHeaderType[AwsSignedBodyHeaderType["XAmzContentSha256"] = 1] = "XAmzContentSha256";
})(AwsSignedBodyHeaderType = exports.AwsSignedBodyHeaderType || (exports.AwsSignedBodyHeaderType = {}));
/**
 * Perform AWS HTTP request signing.
 *
 * The {@link HttpRequest} is transformed asynchronously,
 * according to the {@link AwsSigningConfig}.
 *
 * When signing:
 *  1.  It is good practice to use a new config for each signature,
 *      or the date might get too old.
 *
 *  2.  Do not add the following headers to requests before signing, they may be added by the signer:
 *      x-amz-content-sha256,
 *      X-Amz-Date,
 *      Authorization
 *
 *  3.  Do not add the following query params to requests before signing, they may be added by the signer:
 *      X-Amz-Signature,
 *      X-Amz-Date,
 *      X-Amz-Credential,
 *      X-Amz-Algorithm,
 *      X-Amz-SignedHeaders
 * @param request The HTTP request to sign.
 * @param config Configuration for signing.
 * @returns A promise whose result will be the signed
 *       {@link HttpRequest}. The future will contain an exception
 *       if the signing process fails.
 *
 * @category Auth
 */
function aws_sign_request(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                /* Note: if the body of request has not fully loaded, it will lead to an endless loop.
                 * User should set the signed_body_value of config to prevent this endless loop in this case */
                binding_1.default.aws_sign_request(request, config, (error_code) => {
                    if (error_code == 0) {
                        resolve(request);
                    }
                    else {
                        reject(new error_1.CrtError(error_code));
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
exports.aws_sign_request = aws_sign_request;
/**
 *
 * @internal
 *
 * Test only.
 * Verifies:
 *  (1) The canonical request generated during sigv4a signing of the request matches what is passed in
 *  (2) The signature passed in is a valid ECDSA signature of the hashed string-to-sign derived from the
 *  canonical request
 *
 * @param request The HTTP request to sign.
 * @param config Configuration for signing.
 * @param expected_canonical_request String type of expected canonical request. Refer to XXX(link to doc?)
 * @param signature The generated signature string from {@link aws_sign_request}, which is verified here.
 * @param ecc_key_pub_x the x coordinate of the public part of the ecc key to verify the signature.
 * @param ecc_key_pub_y the y coordinate of the public part of the ecc key to verify the signature
 * @returns True, if the verification succeed. Otherwise, false.
 */
function aws_verify_sigv4a_signing(request, config, expected_canonical_request, signature, ecc_key_pub_x, ecc_key_pub_y) {
    return binding_1.default.aws_verify_sigv4a_signing(request, config, expected_canonical_request, signature, ecc_key_pub_x, ecc_key_pub_y);
}
exports.aws_verify_sigv4a_signing = aws_verify_sigv4a_signing;
//# sourceMappingURL=auth.js.map