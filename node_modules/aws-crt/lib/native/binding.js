/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as path from 'path';
import { platform, arch } from 'os';
import { existsSync } from 'fs';
import { versions } from 'process';
import child_process from "child_process";

const CRuntimeType = Object.freeze({
    NON_LINUX: "cruntime",
    MUSL: "musl",
    GLIBC: "glibc"
});

function getCRuntime() {
    if (platform() !== "linux") {
        return CRuntimeType.NON_LINUX;
    }

    try {
        // sometimes, ldd's output goes to stderr, so capture that too
        // Using spawnSync because execSync treats any output to stderr as an exception.
        const spawnedProcess = child_process.spawnSync('ldd', ['--version'], { encoding: 'utf8' });
        const output = spawnedProcess.stdout + spawnedProcess.stderr;
        if (output.includes(CRuntimeType.MUSL)) {
            return CRuntimeType.MUSL;
        } else {
            return CRuntimeType.GLIBC;
        }
    } catch (error) {
        return CRuntimeType.GLIBC;
    }
}


const upgrade_string = "Please upgrade to node >=10.16.0, or use the provided browser implementation.";
if ('napi' in versions) {
    // @ts-ignore
    const napi_version = parseInt(versions['napi']);
    if (napi_version < 4) {
        throw new Error("The AWS CRT native implementation requires that NAPI version 4 be present. " + upgrade_string);
    }
} else {
    throw new Error("The current runtime is not reporting an NAPI version. " + upgrade_string);
}
const cRuntime = getCRuntime()
const binary_name = 'aws-crt-nodejs';
const platformDir = `${platform}-${arch}-${cRuntime}`;

let source_root = path.resolve(__dirname, '..', '..');
const dist = path.join(source_root, 'dist');
if (existsSync(dist)) {
    source_root = dist;
}

const bin_path = path.resolve(source_root, 'bin');

let search_paths = [
    path.join(bin_path, platformDir, binary_name) + '.node',
];

/*
 * Environment variables can inject (at lower-priority) paths into the search process as well.  Support both relative
 * and absolute path overrides.
 */
let relative_path = process.env.AWS_CRT_NODEJS_BINARY_RELATIVE_PATH;
if (relative_path) {
    let final_path = path.resolve(__dirname, ...relative_path.split(path.sep))
    search_paths.push(final_path);
}

if (process.env.AWS_CRT_NODEJS_BINARY_ABSOLUTE_PATH) {
    search_paths.push(process.env.AWS_CRT_NODEJS_BINARY_ABSOLUTE_PATH);
}

let binding;
for (const path of search_paths) {
    if (existsSync(path)) {
        binding = require(path);
        break;
    }
}

if (binding == undefined) {
    throw new Error("AWS CRT binary not present in any of the following locations:\n\t" + search_paths.join('\n\t'));
}

import crt_native from "./binding"
/** Electron will shutdown the node process on exit, which causes the threadsafe function to segfault. To prevent
  * the segfault we disable the threadsafe function on node process exit. */
if (process.versions.hasOwnProperty('electron')) {
    process.on('exit', function () {
        crt_native.disable_threadsafe_function();
    });
}


export default binding;
export { CRuntimeType, cRuntime };
