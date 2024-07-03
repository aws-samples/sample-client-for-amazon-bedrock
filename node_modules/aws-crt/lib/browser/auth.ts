/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Module for AWS Authentication logic - signing http requests, events, chunks, etc...
 *
 * @packageDocumentation
 * @module auth
 * @mergeTarget
 */

import { AwsSigningConfigBase } from '../common/auth';

export { AwsSigningConfigBase } from '../common/auth';
 
/**
 * Standard AWS Credentials
 *
 * @category Auth
 */
export interface AWSCredentials{
    /** Optional region */
    aws_region?: string,
    /** AWS access id */
    aws_access_id: string,
    /** AWS secret access key */
    aws_secret_key: string,
    /** Session token for session credentials */
    aws_sts_token?: string,
}

/**
 * CredentialsProvider Base Class. The base class of credentials providers.
 *
 * @category Auth
 */
export class CredentialsProvider {
    /**
     * Return a valid credentials. Please note mqtt.js does not support promises, meaning that credentials
     * provider implementation should handle application-level authentication refreshing so that the websocket 
     * connection could simply grab the latest valid tokens when getCredentials() get called. 
     * 
     * @Returns AWSCredentials
     * 
     * */
    getCredentials() : AWSCredentials | undefined
    { 
        return undefined;
    }

    /**
     * Invoked by browser MQTT clients before a connection is attempted.  Sub-classes that source credentials
     * asynchronously should override this API to perform asynchronous credentials resolution.
     *
     * Asynchronous providers that cache session-based credentials should resolve the returned promise if
     * the cached credentials are still valid.
     *
     * @returns a promise that resolves if credentials were successfully refreshed, rejected otherwise.
     */
    async refreshCredentials() : Promise<void> {
        return new Promise<void>((resolve, reject) => {
            resolve();
        });
    }
}


/**
 * StaticCredentialProvider. The provider will always return the static AWSCredential.
 *
 * @category Auth
 */
export class StaticCredentialProvider extends CredentialsProvider{
    credentials : AWSCredentials;
    constructor(credentials: AWSCredentials)
    {
        super();
        this.credentials = credentials;
    }

    getCredentials = () : AWSCredentials | undefined =>
    {
        return this.credentials;
    }
}

/**
 * Configuration for use in browser credentials
 *
 * @category Auth
 */
export interface AwsSigningConfig extends AwsSigningConfigBase{
    credentials: AWSCredentials;
}
