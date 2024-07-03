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
 */

/**
 * TLS Version
 *
 * @category TLS
 */
export enum TlsVersion {
    SSLv3 = 0,
    TLSv1 = 1,
    TLSv1_1 = 2,
    TLSv1_2 = 3,
    TLSv1_3 = 4,
    Default = 128,
}

/**
 * @category Network
 */
export enum SocketType {
    /**
     * A streaming socket sends reliable messages over a two-way connection.
     * This means TCP when used with {@link SocketDomain.IPV4}/{@link SocketDomain.IPV6},
     * and Unix domain sockets when used with {@link SocketDomain.LOCAL }
      */
    STREAM = 0,
    /**
     * A datagram socket is connectionless and sends unreliable messages.
     * This means UDP when used with {@link SocketDomain.IPV4}/{@link SocketDomain.IPV6}.
     * {@link SocketDomain.LOCAL} is not compatible with {@link DGRAM}
     */
    DGRAM = 1,
}

/**
 * @category Network
 */
export enum SocketDomain {
    /** IPv4 sockets */
    IPV4 = 0,

    /** IPv6 sockets */
    IPV6 = 1,

    /** UNIX domain socket/Windows named pipes */
    LOCAL = 2,
}
