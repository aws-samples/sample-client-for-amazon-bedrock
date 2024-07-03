/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

// This is the entry point for the browser AWS CRT shim library

import './browser/polyfills';

/* common libs */
import * as cancel from './common/cancel';
import * as platform from './common/platform';
import * as promise from './common/promise';
import * as resource_safety from './common/resource_safety';

/* browser specific libs */
import * as io from './browser/io';
import * as mqtt from './browser/mqtt';
import * as mqtt5 from './browser/mqtt5';
import * as http from './browser/http';
import * as crypto from './browser/crypto';
import * as iot from './browser/iot';
import * as auth from './browser/auth';
import { ICrtError, CrtError } from './browser/error';

export {
    auth,
    cancel,
    crypto,
    http,
    io,
    iot,
    mqtt,
    mqtt5,
    platform,
    promise,
    resource_safety,
    ICrtError,
    CrtError
};
