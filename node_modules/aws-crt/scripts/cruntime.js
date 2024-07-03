/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const os = require("os")
const child_process = require('child_process')

function getCRuntime() {
    const platform = os.platform();
    let non_linux_runtime_tag = 'cruntime';
    let musl_tag = 'musl';
    let glibc_tag = 'glibc';

    if(platform !== "linux") {
        return non_linux_runtime_tag;
    }

    try {
        // sometimes, ldd's output goes to stderr, so capture that too
        // Using spawnSync because execSync treats any output to stderr as an exception.
        const spawnedProcess = child_process.spawnSync('ldd', ['--version'], { encoding: 'utf8' });
        const output = spawnedProcess.stdout + spawnedProcess.stderr;
        if (output.includes(musl_tag)) {
            return musl_tag;
        } else {
            return glibc_tag;
        }
    } catch (error) {
        return glibc_tag;
    }

}

module.exports = getCRuntime;
