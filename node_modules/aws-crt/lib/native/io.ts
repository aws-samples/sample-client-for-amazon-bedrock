/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing a grab bag of support for core network I/O functionality, including sockets, TLS, DNS, logging,
 * error handling, streams, and connection -> thread mapping.
 *
 * Categories include:
 * - Network: socket configuration
 * - TLS: tls configuration
 * - Logging: logging controls and configuration
 * - IO: everything else
 *
 * @packageDocumentation
 * @module io
 * @mergeTarget
 */

import crt_native from './binding';
import { NativeResource } from "./native_resource";
import { TlsVersion, SocketType, SocketDomain } from '../common/io';
import { Readable } from 'stream';
export { TlsVersion, SocketType, SocketDomain } from '../common/io';
import { CrtError } from './error';

/**
 * Convert a native error code into a human-readable string
 * @param error_code - An error code returned from a native API call, or delivered
 * via callback.
 * @returns Long-form description of the error
 * @see CrtError
 *
 * nodejs only.
 *
 * @category System
 */
export function error_code_to_string(error_code: number): string {
    return crt_native.error_code_to_string(error_code);
}

/**
 * Convert a native error code into a human-readable identifier
 * @param error_code - An error code returned from a native API call, or delivered
 * via callback.
 * @return error name as a string
 * @see CrtError
 *
 * nodejs only.
 *
 * @category System
 */
export function error_code_to_name(error_code: number): string {
    return crt_native.error_code_to_name(error_code);
}

/**
 * The amount of detail that will be logged
 * @category Logging
 */
export enum LogLevel {
    /** No logging whatsoever. Equivalent to never calling {@link enable_logging}. */
    NONE = 0,
    /** Only fatals. In practice, this will not do much, as the process will log and then crash (intentionally) if a fatal condition occurs */
    FATAL = 1,
    /** Only errors */
    ERROR = 2,
    /** Only warnings and errors */
    WARN = 3,
    /** Information about connection/stream creation/destruction events */
    INFO = 4,
    /** Enough information to debug the chain of events a given network connection encounters */
    DEBUG = 5,
    /** Everything. Only use this if you really need to know EVERY single call */
    TRACE = 6
}

/**
 * Enables logging of the native AWS CRT libraries.
 * @param level - The logging level to filter to. It is not possible to log less than WARN.
 *
 * nodejs only.
 * @category Logging
 */
export function enable_logging(level: LogLevel) {
    crt_native.io_logging_enable(level);
}

/**
 * Returns true if ALPN is available on this platform natively
 * @return true if ALPN is supported natively, false otherwise
 *
 * nodejs only.
 * @category TLS
*/
export function is_alpn_available(): boolean {
    return crt_native.is_alpn_available();
}

/**
 * Wraps a ```Readable``` for reading by native code, used to stream
 *  data into the AWS CRT libraries.
 *
 * nodejs only.
 * @category IO
 */
export class InputStream extends NativeResource {
    constructor(private source: Readable) {
        super(crt_native.io_input_stream_new(16 * 1024));
        this.source.on('data', (data) => {
            data = Buffer.isBuffer(data) ? data : Buffer.from(data.toString());
            crt_native.io_input_stream_append(this.native_handle(), data);
        });
        this.source.on('end', () => {
            crt_native.io_input_stream_append(this.native_handle(), undefined);
        })
    }
}

/**
 * Represents native resources required to bootstrap a client connection
 * Things like a host resolver, event loop group, etc. There should only need
 * to be 1 of these per application, in most cases.
 *
 * nodejs only.
 * @category IO
 */
export class ClientBootstrap extends NativeResource {
    constructor() {
        super(crt_native.io_client_bootstrap_new());
    }
}

/**
 * Standard Berkeley socket style options.
 *
 * nodejs only.
 * @category Network
*/
export class SocketOptions extends NativeResource {
    constructor(
        type = SocketType.STREAM,
        domain = SocketDomain.IPV6,
        connect_timeout_ms = 5000,
        keepalive = false,
        keep_alive_interval_sec = 0,
        keep_alive_timeout_sec = 0,
        keep_alive_max_failed_probes = 0) {
        super(crt_native.io_socket_options_new(
            type,
            domain,
            connect_timeout_ms,
            keep_alive_interval_sec,
            keep_alive_timeout_sec,
            keep_alive_max_failed_probes,
            keepalive
        ));
    }
}

/**
 * Interface used to hold the options for creating a PKCS#12 connection in the builder.
 *
 * Note: Only supported on MacOS devices.
 *
 * NodeJS only
 * @category TLS
 */
export interface Pkcs12Options {
    /** Path to the PKCS#12 file */
    pkcs12_file: string;

    /** The password for the PKCS#12 file */
    pkcs12_password : string;
}

/**
 * Options for creating a {@link ClientTlsContext} or {@link ServerTlsContext}.
 *
 * nodejs only.
 * @category TLS
 */
export class TlsContextOptions {
    /** Minimum version of TLS to support. Uses OS/system default if unspecified. */
    public min_tls_version: TlsVersion = TlsVersion.Default;
    /** Path to a single file with all trust anchors in it, in PEM format */
    public ca_filepath?: string;
    /** Path to directory containing trust anchors. Only used on Unix-style systems. */
    public ca_dirpath?: string;
    /** String with all trust anchors in it, in PEM format */
    public certificate_authority?: string;
    /** List of ALPN protocols to be used on platforms which support ALPN */
    public alpn_list: string[] = [];
    /** Path to certificate, in PEM format */
    public certificate_filepath?: string;
    /** Certificate, in PEM format */
    public certificate?: string;
    /** Path to private key, in PEM format */
    public private_key_filepath?: string;
    /** Private key, in PEM format */
    public private_key?: string;
    /** Path to certificate, in PKCS#12 format. Currently, only supported on OSX */
    public pkcs12_filepath?: string;
    /** Password for PKCS#12. Currently, only supported on OSX. */
    public pkcs12_password?: string;
    /** PKCS#11 options. Currently, only supported on Unix */
    public pkcs11_options?: TlsContextOptions.Pkcs11Options;
    /** Path to certificate in a Windows cert store. Windows only. */
    public windows_cert_store_path?: string;

    /**
     * In client mode, this turns off x.509 validation. Don't do this unless you are testing.
     * It is much better to just override the default trust store and pass the self-signed
     * certificate as the ca_file argument.
     *
     * In server mode (ServerTlsContext), this defaults to false. If you want to enforce mutual TLS on the server,
     * set this to true.
     */
    public verify_peer: boolean = true;

    /**
     * Overrides the default system trust store.
     * @param ca_dirpath - Only used on Unix-style systems where all trust anchors are
     * stored in a directory (e.g. /etc/ssl/certs).
     * @param ca_filepath - Single file containing all trust CAs, in PEM format
     */
    override_default_trust_store_from_path(ca_dirpath?: string, ca_filepath?: string) {
        this.ca_dirpath = ca_dirpath;
        this.ca_filepath = ca_filepath;
    }

    /**
     * Overrides the default system trust store.
     * @param certificate_authority - String containing all trust CAs, in PEM format
     */
    override_default_trust_store(certificate_authority: string) {
        this.certificate_authority = certificate_authority;
    }

    /**
     * Create options configured for mutual TLS in client mode,
     * with client certificate and private key provided as in-memory strings.
     * @param certificate - Client certificate file contents, in PEM format
     * @param private_key - Client private key file contents, in PEM format
     *
     * @returns newly configured TlsContextOptions object
     */
    static create_client_with_mtls(certificate: string, private_key: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.certificate = certificate;
        opt.private_key = private_key;
        opt.verify_peer = true;
        return opt;
    }

    /**
     * Create options configured for mutual TLS in client mode,
     * with client certificate and private key provided via filepath.
     * @param certificate_filepath - Path to client certificate, in PEM format
     * @param private_key_filepath - Path to private key, in PEM format
     *
     * @returns newly configured TlsContextOptions object
     */
    static create_client_with_mtls_from_path(certificate_filepath: string, private_key_filepath: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.certificate_filepath = certificate_filepath;
        opt.private_key_filepath = private_key_filepath;
        opt.verify_peer = true;
        return opt;
    }

    /**
     * Create options for mutual TLS in client mode,
     * with client certificate and private key bundled in a single PKCS#12 file.
     * @param pkcs12_filepath - Path to PKCS#12 file containing client certificate and private key.
     * @param pkcs12_password - PKCS#12 password
     *
     * @returns newly configured TlsContextOptions object
    */
    static create_client_with_mtls_pkcs12_from_path(pkcs12_filepath: string, pkcs12_password: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.pkcs12_filepath = pkcs12_filepath;
        opt.pkcs12_password = pkcs12_password;
        opt.verify_peer = true;
        return opt;
    }

    /**
     * @deprecated Renamed [[create_client_with_mtls_pkcs12_from_path]]
     */
    static create_client_with_mtls_pkcs_from_path(pkcs12_filepath: string, pkcs12_password: string): TlsContextOptions {
        return this.create_client_with_mtls_pkcs12_from_path(pkcs12_filepath, pkcs12_password);
    }

    /**
     * Create options configured for mutual TLS in client mode,
     * using a PKCS#11 library for private key operations.
     *
     * NOTE: This configuration only works on Unix devices.
     *
     * @param options - PKCS#11 options
     *
     * @returns newly configured TlsContextOptions object
     */
    static create_client_with_mtls_pkcs11(options: TlsContextOptions.Pkcs11Options): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.pkcs11_options = options;
        opt.verify_peer = true;
        return opt;
    }

    /**
     * Create options configured for mutual TLS in client mode,
     * using a certificate in a Windows certificate store.
     *
     * NOTE: Windows only.
     *
     * @param certificate_path - Path to certificate in a Windows certificate store.
     *      The path must use backslashes and end with the certificate's thumbprint.
     *      Example: `CurrentUser\MY\A11F8A9B5DF5B98BA3508FBCA575D09570E0D2C6`
     */
    static create_client_with_mtls_windows_cert_store_path(certificate_path: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.windows_cert_store_path = certificate_path;
        opt.verify_peer = true;
        return opt;
    }

    /**
     * Creates TLS context with peer verification disabled, along with a certificate and private key
     * @param certificate_filepath - Path to certificate, in PEM format
     * @param private_key_filepath - Path to private key, in PEM format
     *
     * @returns newly configured TlsContextOptions object
     */
    static create_server_with_mtls_from_path(certificate_filepath: string, private_key_filepath: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.certificate_filepath = certificate_filepath;
        opt.private_key_filepath = private_key_filepath;
        opt.verify_peer = false;
        return opt;
    }

    /**
     * Creates TLS context with peer verification disabled, along with a certificate and private key
     * in PKCS#12 format
     * @param pkcs12_filepath - Path to certificate, in PKCS#12 format
     * @param pkcs12_password - PKCS#12 Password
     *
     * @returns newly configured TlsContextOptions object
     */
    static create_server_with_mtls_pkcs_from_path(pkcs12_filepath: string, pkcs12_password: string): TlsContextOptions {
        let opt = new TlsContextOptions();
        opt.pkcs12_filepath = pkcs12_filepath;
        opt.pkcs12_password = pkcs12_password;
        opt.verify_peer = false;
        return opt;
    }
}

export namespace TlsContextOptions {

    /**
     * Options for TLS using a PKCS#11 library for private key operations.
     *
     * Unix only. nodejs only.
     *
     * @see [[TlsContextOptions.create_client_with_mtls_pkcs11]]
     */
    export type Pkcs11Options = {
        /**
         * Use this PKCS#11 library.
         */
        pkcs11_lib: Pkcs11Lib,

        /**
         * Use this PIN to log the user into the PKCS#11 token. Pass `null`
         * to log into a token with a "protected authentication path".
         */
        user_pin: null | string,

        /**
         * Specify the slot ID containing a PKCS#11 token. If not specified, the token
         * will be chosen based on other criteria (such as [[token_label]]).
         */
        slot_id?: number,

        /**
         * Specify the label of the PKCS#11 token to use. If not specified, the token
         * will be chosen based on other criteria (such as [[slot_id]]).
         */
        token_label?: string,

        /**
         * Specify the label of the private key object on the PKCS#11 token. If not
         * specified, the key will be chosen based on other criteria (such as being the
         * only available private key on the token).
         */
        private_key_object_label?: string,

        /**
         * Use this X.509 certificate (file on disk).
         * The certificate must be PEM-formatted.
         * The certificate may be specified by other means instead
         * (ex: [[cert_file_contents]])
         */
        cert_file_path?: string,

        /**
         * Use this X.509 certificate (contents in memory).
         * The certificate must be PEM-formatted.
         * The certificate may be specified by other means instead
         * (ex: [[cert_file_path]])
         */
        cert_file_contents?: string,
    }
}

/**
 * Abstract base TLS context used for client/server TLS communications over sockets.
 *
 * @see ClientTlsContext
 * @see ServerTlsContext
 *
 * nodejs only.
 * @category TLS
 */
export abstract class TlsContext extends NativeResource {
    constructor(ctx_opt: TlsContextOptions) {
        if (ctx_opt == null || ctx_opt == undefined) {
            throw new CrtError("TlsContext constructor: ctx_opt not defined");
        }
        super(crt_native.io_tls_ctx_new(
            ctx_opt.min_tls_version,
            ctx_opt.ca_filepath,
            ctx_opt.ca_dirpath,
            ctx_opt.certificate_authority,
            (ctx_opt.alpn_list && ctx_opt.alpn_list.length > 0) ? ctx_opt.alpn_list.join(';') : undefined,
            ctx_opt.certificate_filepath,
            ctx_opt.certificate,
            ctx_opt.private_key_filepath,
            ctx_opt.private_key,
            ctx_opt.pkcs12_filepath,
            ctx_opt.pkcs12_password,
            ctx_opt.pkcs11_options,
            ctx_opt.windows_cert_store_path,
            ctx_opt.verify_peer));
    }
}

/**
 * TLS context used for client TLS communications over sockets. If no
 * options are supplied, the context will default to enabling peer verification
 * only.
 *
 * nodejs only.
 * @category TLS
 */
export class ClientTlsContext extends TlsContext {
    constructor(ctx_opt?: TlsContextOptions) {
        if (!ctx_opt) {
            ctx_opt = new TlsContextOptions()
            ctx_opt.verify_peer = true;
        }
        super(ctx_opt);
    }
}

/**
 * TLS context used for server TLS communications over sockets. If no
 * options are supplied, the context will default to disabling peer verification
 * only.
 *
 * nodejs only.
 * @category TLS
 */
export class ServerTlsContext extends TlsContext {
    constructor(ctx_opt?: TlsContextOptions) {
        if (!ctx_opt) {
            ctx_opt = new TlsContextOptions();
            ctx_opt.verify_peer = false;
        }
        super(ctx_opt);
    }
}

/**
 * TLS options that are unique to a given connection using a shared TlsContext.
 *
 * nodejs only.
 * @category TLS
 */
export class TlsConnectionOptions extends NativeResource {
    constructor(readonly tls_ctx: TlsContext, readonly server_name?: string, readonly alpn_list: string[] = []) {
        if (tls_ctx == null || tls_ctx == undefined) {
            throw new CrtError("TlsConnectionOptions constructor: tls_ctx not defined");
        }
        super(crt_native.io_tls_connection_options_new(
            tls_ctx.native_handle(),
            server_name,
            (alpn_list && alpn_list.length > 0) ? alpn_list.join(';') : undefined
        ));
    }
}

/**
 * Handle to a loaded PKCS#11 library.
 *
 * For most use cases, a single instance of Pkcs11Lib should be used
 * for the lifetime of your application.
 *
 * nodejs only.
 * @category TLS
 */
export class Pkcs11Lib extends NativeResource {

    /**
     * @param path - Path to PKCS#11 library.
     * @param behavior - Specifies how `C_Initialize()` and `C_Finalize()`
     *                   will be called on the PKCS#11 library.
     */
    constructor(path: string, behavior: Pkcs11Lib.InitializeFinalizeBehavior = Pkcs11Lib.InitializeFinalizeBehavior.DEFAULT) {
        super(crt_native.io_pkcs11_lib_new(path, behavior));
    }

    /**
     * Release the PKCS#11 library immediately, without waiting for the GC.
     */
    close() {
        crt_native.io_pkcs11_lib_close(this.native_handle());
    }
}

export namespace Pkcs11Lib {

    /**
     * Controls `C_Initialize()` and `C_Finalize()` are called on the PKCS#11 library.
     */
    export enum InitializeFinalizeBehavior {
        /**
         * Default behavior that accommodates most use cases.
         *
         * `C_Initialize()` is called on creation, and "already-initialized"
         * errors are ignored. `C_Finalize()` is never called, just in case
         * another part of your application is still using the PKCS#11 library.
         */
        DEFAULT = 0,

        /**
         * Skip calling `C_Initialize()` and `C_Finalize()`.
         *
         * Use this if your application has already initialized the PKCS#11 library,
         * and you do not want `C_Initialize()` called again.
         */
        OMIT = 1,

        /**
         * `C_Initialize()` is called on creation and `C_Finalize()` is called on cleanup.
         *
         * If `C_Initialize()` reports that's it's already initialized, this is
         * treated as an error. Use this if you need perfect cleanup (ex: running
         * valgrind with --leak-check).
         */
        STRICT = 2,
    }
}
