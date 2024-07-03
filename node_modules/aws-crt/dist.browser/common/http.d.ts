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
export declare enum HttpVersion {
    Unknown = 0,
    /** HTTP/1.0 */
    Http1_0 = 1,
    /** HTTP/1.1 */
    Http1_1 = 2,
    /** HTTP/2 */
    Http2 = 3
}
/**
 * Headers are exposed as 2 element arrays: [name, value]
 *
 * @category HTTP
 */
export type HttpHeader = [string, string];
/**
 * Common interface for a set of HTTP headers.
 *
 * @category HTTP
 */
export interface HttpHeaders {
    readonly length: number;
    /**
     * Add a name/value pair
     * @param name - The header name
     * @param value - The header value
    */
    add(name: string, value: string): void;
    /**
     * Set a name/value pair, replacing any existing values for the name
     * @param name - The header name
     * @param value - The header value
    */
    set(name: string, value: string): void;
    /**
     * Get the list of values for the given name
     * @param name - The header name to look for
     * @return List of values, or empty list if none exist
     */
    get_values(name: string): string[];
    /**
     * Gets the first value for the given name, ignoring any additional values
     * @param name - The header name to look for
     * @param default_value - Value returned if no values are found for the given name
     * @return The first header value, or default if no values exist
     */
    get(name: string, default_value?: string): string;
    /**
     * Removes all values for the given name
     * @param name - The header to remove all values for
     */
    remove(name: string): void;
    /**
     * Removes a specific name/value pair
     * @param name - The header name to remove
     * @param value - The header value to remove
     */
    remove_value(name: string, value: string): void;
    /** Clears the entire header set */
    clear(): void;
    /**
     * Iterator. Allows for:
     * let headers = new HttpHeaders();
     * ...
     * for (const header of headers) { }
    */
    [Symbol.iterator](): Iterator<HttpHeader>;
    /** @hidden */
    _flatten(): HttpHeader[];
}
/**
 * Proxy authentication types
 *
 * @category HTTP
 */
export declare enum HttpProxyAuthenticationType {
    /**
     * No to-proxy authentication logic
     */
    None = 0,
    /**
     * Use basic authentication (user/pass).  Supply these values in {@link HttpProxyOptions}
     */
    Basic = 1
}
/**
 * Options used when connecting to an HTTP endpoint via a proxy
 *
 * @category HTTP
 */
export declare class CommonHttpProxyOptions {
    host_name: string;
    port: number;
    auth_method: HttpProxyAuthenticationType;
    auth_username?: string | undefined;
    auth_password?: string | undefined;
    /**
     *
     * @param host_name endpoint of the proxy to use
     * @param port port of proxy to use
     * @param auth_method type of authentication to use with the proxy
     * @param auth_username (basic authentication only) proxy username
     * @param auth_password (basic authentication only) password associated with the username
     */
    constructor(host_name: string, port: number, auth_method?: HttpProxyAuthenticationType, auth_username?: string | undefined, auth_password?: string | undefined);
}
/**
 * Listener signature for event emitted from an {@link HttpClientConnection} when the connection reaches the
 * connected state
 *
 * @category HTTP
 */
export type HttpClientConnectionConnected = () => void;
/**
 * Listener signature for event emitted from an {@link HttpClientConnection} when an error occurs
 *
 * @param error - A CrtError containing the error that occurred
 *
 * @category HTTP
 */
export type HttpClientConnectionError = (error: Error) => void;
/**
 * Listener signature for event emitted from an {@link HttpClientConnection} when the connection has been closed
 *
 * @category HTTP
 */
export type HttpClientConnectionClosed = () => void;
/**
 * Listener signature for event emitted from an {@link HttpClientStream} when http response data is available
 *
 * @param body_data - The chunk of body data
 *
 * @category HTTP
 */
export type HttpStreamData = (body_data: ArrayBuffer) => void;
/**
 * Listener signature for event emitted from an {@link HttpClientStream} when an http stream error occurs
 *
 * @param error - A CrtError containing the error that occurred
 *
 * @category HTTP
 */
export type HttpStreamError = (error: Error) => void;
/**
 * Listener signature for event emitted from an {@link HttpClientStream} when the http stream has completed.
 *
 * @category HTTP
 */
export type HttpStreamComplete = () => void;
