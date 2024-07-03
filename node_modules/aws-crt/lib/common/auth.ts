/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * @packageDocumentation
 * @module auth
 */

/**
 * Configuration for use in AWS-related signing.
 * AwsSigningConfig is immutable.
 * It is good practice to use a new config for each signature, or the date might get too old.
 *
 */
export interface AwsSigningConfigBase {

    /** The region to sign against */
    region: string;
    /** Name of service to sign a request for */
    service?: string;
    /**
     * Date and time to use during the signing process. If not provided then
     * the current time in UTC is used. Naive dates (lacking timezone info)
     * are assumed to be in local time
     */
    date?: Date;
}

/**
 * Configuration for websocket signing
 * It is good practice to use a new config for each signature, or the date might get too old.
 *
 */
export interface WebsocketOptionsBase {
    /**
     * (Optional) factory function to create the configuration used to sign the websocket handshake.  Leave null
     * to use the default settings.
     */
    create_signing_config ?: ()=> AwsSigningConfigBase;

    /**
     * (Optional) override for the service name used in signing the websocket handshake.  Leave null to use the
     * default (iotdevicegateway)
     */
     service?: string;
}
