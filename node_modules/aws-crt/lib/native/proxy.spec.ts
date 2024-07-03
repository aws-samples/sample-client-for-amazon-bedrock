/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import {
    ClientTlsContext,
    SocketDomain,
    SocketOptions,
    SocketType,
    TlsContextOptions,
} from "./io";
import {
    HttpClientConnection, HttpHeaders,
    HttpProxyAuthenticationType,
    HttpRequest
} from "./http";
import {ProxyConfig, ProxyTestType} from "@test/proxy";

import {AwsIotMqttConnectionConfigBuilder} from "./aws_iot";
import {v4 as uuid} from "uuid";
import {MqttClient} from "./mqtt";

import { InputStream } from './io';
import { PassThrough } from "stream";
import { AwsCredentialsProvider, X509CredentialsConfig, AwsSigningConfig, AwsSigningAlgorithm,
        AwsSignatureType, AwsSignedBodyHeaderType, aws_sign_request } from "./auth";


async function test_proxied_connection(test_type : ProxyTestType, auth_type : HttpProxyAuthenticationType) {
    const promise = new Promise((resolve, reject) => {
        let host = ProxyConfig.get_uri_from_test_type(test_type)
        let connection = new HttpClientConnection(
            undefined,
            host,
            ProxyConfig.get_port_from_test_type(test_type),
            new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
            ProxyConfig.get_tls_connection_options_for_test(test_type, host),
            ProxyConfig.create_http_proxy_options_from_environment(test_type, auth_type));

        connection.on('connect', () => {
            let request = new HttpRequest(
                "GET",
                '/',
                new HttpHeaders([
                    ['host', host],
                    ['user-agent', 'AWS CRT for NodeJS']
                ])
            );
            let stream = connection.request(request);
            stream.on('response', (status_code, headers) => {
                expect(status_code).toBe(200);
                expect(headers).toBeDefined();
            });
            stream.on('data', (body_data) => {
                expect(body_data.byteLength).toBeGreaterThan(0);
            });
            stream.on('end', () => {
                connection.close();
            });
            stream.on('error', (error) => {
                connection.close();
                console.log(error);
                expect(error).toBeUndefined();
            });
            stream.activate();
        });
        connection.on('close', () => {
            resolve(true);
        });
        connection.on('error', (error) => {
            reject(error);
        });
    });

    await expect(promise).resolves.toBeTruthy();
}

const conditional_test = (condition : boolean) => condition ? it : it.skip;

function is_proxy_environment_enabled() {
    return ProxyConfig.is_valid()
}

function is_tls_to_proxy_enabled() {
    return ProxyConfig.is_tls_to_proxy_valid()
}

function is_x509_enabled() {
    return ProxyConfig.is_valid() && ProxyConfig.is_tls_to_proxy_valid() && ProxyConfig.is_x509_valid();
}

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Forwarding NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.FORWARDING, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Legacy NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.LEGACY_HTTP, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Https Connection Legacy NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.LEGACY_HTTPS, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Tunneling NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.TUNNELING_HTTP, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Https Connection Tunneling NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.TUNNELING_HTTPS, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled() && is_tls_to_proxy_enabled())('Proxied Https Connection DoubleTls NoAuth', async () => {
    await test_proxied_connection(ProxyTestType.TUNNELING_DOUBLE_TLS, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Forwarding BasicAuth', async () => {
    await test_proxied_connection(ProxyTestType.FORWARDING, HttpProxyAuthenticationType.Basic);
});

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Legacy BasicAuth', async () => {
    await test_proxied_connection(ProxyTestType.LEGACY_HTTP, HttpProxyAuthenticationType.Basic);
});

conditional_test(is_proxy_environment_enabled())('Proxied Https Connection Legacy BasicAuth', async () => {
    await test_proxied_connection(ProxyTestType.LEGACY_HTTPS, HttpProxyAuthenticationType.Basic);
});

conditional_test(is_proxy_environment_enabled())('Proxied Http Connection Tunneling BasicAuth', async () => {
    await test_proxied_connection(ProxyTestType.TUNNELING_HTTP, HttpProxyAuthenticationType.Basic);
});

conditional_test(is_proxy_environment_enabled())('Proxied Https Connection Tunneling BasicAuth', async () => {
    await test_proxied_connection(ProxyTestType.TUNNELING_HTTPS, HttpProxyAuthenticationType.Basic);
});

async function test_proxied_mqtt_connection(test_type : ProxyTestType, auth_type : HttpProxyAuthenticationType) {

    const config = AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(ProxyConfig.HTTP_PROXY_TLS_CERT_PATH, ProxyConfig.HTTP_PROXY_TLS_KEY_PATH)
        .with_certificate_authority_from_path(undefined, ProxyConfig.HTTP_PROXY_TLS_ROOT_CA_PATH)
        .with_clean_session(true)
        .with_client_id(`node-mqtt-unit-test-${uuid()}`)
        .with_endpoint(ProxyConfig.HTTP_PROXY_MQTT_ENDPOINT)
        .with_ping_timeout_ms(5000)
        .with_http_proxy_options(ProxyConfig.create_http_proxy_options_from_environment(test_type, auth_type))
        .build()
    const client = new MqttClient(undefined);
    const connection = client.new_connection(config);
    const promise = new Promise(async (resolve, reject) => {
        connection.on('connect', async (session_present) => {
            expect(session_present).toBeFalsy();

            const disconnected = connection.disconnect();
            await expect(disconnected).resolves.toBeUndefined();
        });
        connection.on('error', (error) => {
            reject(error);
        })
        connection.on('disconnect', () => {
            resolve(true);
        })
        const connected = connection.connect();
        await expect(connected).resolves.toBeDefined();
    });
    await expect(promise).resolves.toBeTruthy();
}

conditional_test(is_proxy_environment_enabled())('Proxied Mqtt Connection Tunneling NoAuth', async () => {
    await test_proxied_mqtt_connection(ProxyTestType.TUNNELING_HTTP, HttpProxyAuthenticationType.None);
});

conditional_test(is_proxy_environment_enabled())('Proxied Mqtt Connection Tunneling BasicAuth', async () => {
    await test_proxied_mqtt_connection(ProxyTestType.TUNNELING_HTTP, HttpProxyAuthenticationType.Basic);
});

conditional_test(is_proxy_environment_enabled() && is_tls_to_proxy_enabled())('Proxied Mqtt Connection DoubleTls NoAuth', async () => {
    await test_proxied_mqtt_connection(ProxyTestType.TUNNELING_DOUBLE_TLS, HttpProxyAuthenticationType.None);
});

// Test values copied from aws-c-auth/tests/aws-sig-v4-test-suite/get-vanilla"
const DATE_STR = '2015-08-30T12:36:00Z';
const SIGV4TEST_SERVICE = 'service';
const SIGV4TEST_REGION = 'us-east-1';
const SIGV4TEST_METHOD = 'GET';
const SIGV4TEST_PATH = '/';
const SIGV4TEST_UNSIGNED_HEADERS: [string, string][] = [
    ['Host', 'example.amazonaws.com']
];

async function do_body_request_signing(provider: AwsCredentialsProvider) {
    const signing_config: AwsSigningConfig = {
        algorithm: AwsSigningAlgorithm.SigV4,
        signature_type: AwsSignatureType.HttpRequestViaHeaders,
        provider: provider,
        region: SIGV4TEST_REGION,
        service: SIGV4TEST_SERVICE,
        date: new Date(DATE_STR),
        signed_body_header: AwsSignedBodyHeaderType.None,
    };
    let stream = new PassThrough();
    let body_stream;
    stream.write("test");
    stream.end(() => {
        body_stream = new InputStream(stream);
    });
    let http_request = new HttpRequest(
        SIGV4TEST_METHOD,
        SIGV4TEST_PATH,
        new HttpHeaders(SIGV4TEST_UNSIGNED_HEADERS),
        body_stream);

    return await aws_sign_request(http_request, signing_config);
}

async function test_x509_credentials(test_type : ProxyTestType, auth_type : HttpProxyAuthenticationType) {
    const proxy_config = ProxyConfig.create_http_proxy_options_from_environment(test_type, auth_type)
    let tls_ctx_opt = new TlsContextOptions();
    tls_ctx_opt.certificate_filepath = ProxyConfig.HTTP_PROXY_TLS_CERT_PATH;
    tls_ctx_opt.private_key_filepath = ProxyConfig.HTTP_PROXY_TLS_KEY_PATH;
    tls_ctx_opt.ca_filepath = ProxyConfig.HTTP_PROXY_TLS_ROOT_CA_PATH;
    let client_tls_ctx = new ClientTlsContext(tls_ctx_opt);

    let x509_config : X509CredentialsConfig = {
        endpoint: ProxyConfig.X509_CREDENTIALS_ENDPOINT,
        thingName: ProxyConfig.X509_CREDENTIALS_THING_NAME,
        roleAlias: ProxyConfig.X509_CREDENTIALS_ROLE_ALIAS,
        tlsContext: client_tls_ctx,
        httpProxyOptions: proxy_config
    };
    let credentials_provider = AwsCredentialsProvider.newX509(x509_config);

    const signing_result = await do_body_request_signing(credentials_provider);
    await expect(signing_result).toBeDefined();
    expect(signing_result.method).toBe(SIGV4TEST_METHOD);
    expect(signing_result.path).toBe(SIGV4TEST_PATH);
}

conditional_test(is_x509_enabled())('X509 Credentials TLS proxy NoAuth', async () => {
    await test_x509_credentials(ProxyTestType.TUNNELING_HTTPS, HttpProxyAuthenticationType.None);
});

conditional_test(is_x509_enabled())('X509 Credentials double TLS proxy NoAuth', async () => {
    await test_x509_credentials(ProxyTestType.TUNNELING_DOUBLE_TLS, HttpProxyAuthenticationType.None);
});

conditional_test(is_x509_enabled())('X509 Credentials TLS proxy BasicAuth', async () => {
    await test_x509_credentials(ProxyTestType.TUNNELING_HTTPS, HttpProxyAuthenticationType.Basic);
});
