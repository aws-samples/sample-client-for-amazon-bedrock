/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import { HttpClientConnectionManager, HttpClientConnection, HttpHeader, HttpHeaders, HttpRequest } from "@awscrt/http";
import { ClientBootstrap, SocketOptions, SocketType, SocketDomain, ClientTlsContext, TlsConnectionOptions, InputStream } from "@awscrt/io";
import { PassThrough } from "stream";

jest.setTimeout(10000);
jest.retryTimes(3);

test('HTTP Headers', () => {

    const long_token = "AQoDYXdzEPT//////////wEXAMPLEtc764bNrC9SAPBSM22wDOk4x4HIZ8j4FZTwdQWLWsKWHGBuFqwAeMicRXmxfpSPfIeoIYRqTflfKD8YUuwthAx7mSEI/qkPpKPi/kMcGdQrmGdeehM4IC1NtBmUpp2wUE8phUZampKsburEDy0KPkyQDYwT7WZ0wq5VSXDvp75YU9HFvlRd8Tx6q6fE8YQcHNVXAkiY9q6d+xo0rKwT38xVqr7ZD0u0iPPkUL64lIZbqBAz+scqKmlzm8FDrypNC9Yjc8fPOLn9FX9KSYvKTr4rvx3iSIlTJabIQwj2ICCR/oLxBA==";
    const header_array: HttpHeader[] = [
        ['Host', 'www.amazon.com'],
        ['Content-Length', '42'],
        ["x-amz-security-token", long_token],
    ];
    let headers = new HttpHeaders(header_array);
    let request = new HttpRequest("", "", new HttpHeaders(header_array));
    <unknown>request;

    const iterator = headers[Symbol.iterator].call(headers);
    <unknown>iterator;
    const next = iterator.next.call(iterator);
    <unknown>next;

    let found_headers = 0;
    for (const header of headers) {
        expect(['Host', 'Content-Length', 'x-amz-security-token']).toContain(header[0]);
        expect(['www.amazon.com', '42', long_token]).toContain(header[1]);
        found_headers++;
    }
    expect(found_headers).toBe(3);
    // Upgrade header does not exist
    expect(headers.get('Upgrade')).toBeFalsy();

    // Make sure case doesn't matter
    expect(headers.get('HOST')).toBe('www.amazon.com');
    expect(headers.get('x-amz-security-token')).toBe(long_token);

    // Remove Content-Length, and make sure host is all that's left
    headers.remove('content-length');
    headers.remove('x-amz-security-token');
    found_headers = 0;
    for (const header of headers) {
        expect(header[0]).toBe('Host');
        expect(header[1]).toBe('www.amazon.com');
        found_headers++;
    }
    expect(found_headers).toBe(1);

    headers.clear();
    for (const header of headers) {
        // this should never be called
        expect(header).toBeNull();
    }
});

test('HTTP Request without body', () => {
    let request = new HttpRequest("GET", "/index.html");

    expect(request.method).toBe("GET");
    expect(request.path).toBe('/index.html');
    expect(request.headers.length).toBe(0);

    request.method = "POST";
    request.path = "/test.html"

    expect(request.method).toBe("POST");
    expect(request.path).toBe('/test.html');

    request.headers.add("Host", "www.amazon.com");
    expect(request.headers.length).toBe(1);
});

test('HTTP Request with body', () => {

    let stream = new PassThrough();
    stream.write("test");
    stream.end();
    let body_stream = new InputStream(stream);
    let request = new HttpRequest("POST", "/index.html", undefined, body_stream);

    expect(request.method).toBe("POST");
    expect(request.path).toBe('/index.html');
    expect(request.headers.length).toBe(0);

    // Body property for request is not readable
});


async function test_connection(host: string, port: number, tls_opts?: TlsConnectionOptions, bootstrap?: ClientBootstrap) {
    let setup_error_code: Number = -1;
    let shutdown_error_code: Number = -1;
    let connection_error: Error | undefined;
    const promise = new Promise((resolve, reject) => {
        let connection = new HttpClientConnection(
            bootstrap,
            host,
            port,
            new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
            tls_opts
        );
        connection.on('connect', () => {
            setup_error_code = 0;
            connection.close();
        });
        connection.on('close', () => {
            if (!connection_error) {
                shutdown_error_code = 0;
                resolve(true);
            }
        });
        connection.on('error', (error) => {
            connection_error = error;
            reject(error);
        });
    });
    await expect(promise).resolves.toBeTruthy();

    expect(setup_error_code).toEqual(0);
    expect(shutdown_error_code).toEqual(0);
    expect(connection_error).toBeUndefined();
}

test('HTTP Connection Create/Destroy', async () => {
    await test_connection("s3.amazonaws.com", 80, undefined, new ClientBootstrap());
});

test('HTTP Connection Create/Destroy Undef Bootstrap', async () => {
    await test_connection("s3.amazonaws.com", 80, undefined, undefined);
});

test('HTTPS Connection Create/Destroy', async () => {
    const host = "s3.amazonaws.com";
    await test_connection(host, 443, new TlsConnectionOptions(new ClientTlsContext(), host), new ClientBootstrap());
});

test('HTTPS Connection Create/Destroy Undef Bootstrap', async () => {
    const host = "s3.amazonaws.com";
    await test_connection(host, 443, new TlsConnectionOptions(new ClientTlsContext(), host), undefined);
});

async function test_stream(method: string, host: string, port: number, activate: boolean, tls_opts?: TlsConnectionOptions) {
    const promise = new Promise((resolve, reject) => {
        let connection = new HttpClientConnection(
            new ClientBootstrap(),
            host,
            port,
            new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
            tls_opts);
        connection.on('connect', () => {
            let request = new HttpRequest(
                method,
                '/',
                new HttpHeaders([
                    ['host', host],
                    ['user-agent', 'AWS CRT for NodeJS']
                ])
            );
            let stream = connection.request(request);
            stream.on('response', (status_code, headers) => {
                expect(status_code == 301 || status_code == 200).toBe(true);
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
            if (activate) {
                stream.activate();
            } else {
                resolve(true);
            }
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

test('HTTP Stream GET', async () => {
    await test_stream('GET', 'amazon.com', 80, true, undefined);
});


test('HTTPS Stream GET', async () => {
    const host = 'amazon.com';
    await test_stream('GET', host, 443, true, new TlsConnectionOptions(new ClientTlsContext(), host));
});

test('HTTP Stream UnActivated', async () => {
    await test_stream('GET', 'amazon.com', 80, false, undefined);
});

test('HTTP Connection Manager create/destroy', () => {
    const bootstrap = new ClientBootstrap();
    let connection_manager = new HttpClientConnectionManager(
        bootstrap,
        "s3.amazon.com",
        80,
        4,
        16 * 1024,
        new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
        undefined
    );
    expect(connection_manager).toBeDefined();
    connection_manager.close();
});

test('HTTP Connection Manager acquire/release', async () => {
    const bootstrap = new ClientBootstrap();
    let connection_manager = new HttpClientConnectionManager(
        bootstrap,
        "s3.amazon.com",
        80,
        4,
        16 * 1024,
        new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
        undefined
    );
    expect(connection_manager).toBeDefined();

    const connection = await connection_manager.acquire();
    expect(connection).toBeDefined();
    connection_manager.release(connection);

    connection_manager.close();
});




test('HTTP Connection Manager acquire/stream/release', async () => {
    const bootstrap = new ClientBootstrap();
    let connection_manager = new HttpClientConnectionManager(
        bootstrap,
        "amazon.com",
        80,
        4,
        16 * 1024,
        new SocketOptions(SocketType.STREAM, SocketDomain.IPV4, 3000),
        undefined
    );
    expect(connection_manager).toBeDefined();

    const connection = await connection_manager.acquire();
    expect(connection).toBeDefined();

    let request = new HttpRequest(
        'GET',
        '/',
        new HttpHeaders([
            ['host', 'amazon.com'],
            ['user-agent', 'AWS CRT for NodeJS']
        ])
    );

    let connection_error: Error | undefined;

    const promise = new Promise((resolve, reject) => {
        let stream = connection.request(request);
        stream.on('response', (status_code, headers) => {
            expect(status_code == 301 || status_code == 200).toBe(true);
            expect(headers).toBeDefined();
        });
        stream.on('data', (body_data) => {
            expect(body_data.byteLength).toBeGreaterThan(0);
        });
        stream.on('end', () => {
            connection_manager.release(connection);
            connection_manager.close();
            if (!connection_error) {
                resolve(true);
            }
        });
        stream.on('error', (error) => {
            connection_error = error;
            reject(error);
        });
        stream.activate();
    })

    await expect(promise).resolves.toBeTruthy();
    expect(connection_error).toBeUndefined();
});

