/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const fs = require("fs");
const crypto = require('crypto');
const process = require("process");
const path = require("path");

const nativeSourceDir = "crt/";
const build_step_tar = require("./build_dependencies/build_step_tar");
const build_step_cmake = require("./build_dependencies/build_step_cmake");

function rmRecursive(rmPath) {
    let rmBasePath = path.basename(rmPath);
    if (rmBasePath == "." || rmBasePath == "..") {
        throw new Error("\".\" and \"..\" may not be removed");
    }
    var files = [];
    if (fs.existsSync(rmPath)) {
        if (fs.lstatSync(rmPath).isDirectory()) {
            files = fs.readdirSync(rmPath);
            files.forEach(function (file,) {
                var curPath = rmPath + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    rmRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(rmPath);
        }
        else {
            fs.unlinkSync(rmPath);
        }
    }
};

async function buildFromRemoteSource(tmpPath) {
    if (fs.existsSync(nativeSourceDir)) {
        //teardown the local source code
        rmRecursive(nativeSourceDir);
    }
    fs.mkdirSync(tmpPath);
    fs.mkdirSync(nativeSourceDir);
    // AWS common runtime aws-crt-nodejs cloudfront distribution.
    let host = "https://d332vdhbectycy.cloudfront.net";
    if (process.env.AWS_CRT_BINARY_HOST) {
        // Use the host specified by user
        host = process.env.AWS_CRT_BINARY_HOST;
    }
    let rawData = fs.readFileSync('package.json');
    const version = JSON.parse(rawData)["version"];
    // Get the file using tar, loaded as an install-time dependency (see scripts/build_dependencies)
    try {
        await build_step_tar.performStep(host, version, tmpPath, nativeSourceDir);
    } catch (error) {
        console.log("tar perform step failed with" + error);
        throw error;
    } finally {
        rmRecursive(tmpPath);
    }
    // Clean up temp directory
    // Kick off local build using cmake-js loaded as an install-time dependency (see scripts/build_dependencies)
    try {
        await build_step_cmake.performStep();
    } catch (error) {
        console.log("tar perform step failed with" + error);
        throw error;
    } finally {
        // Local build finished successfully, we don't need source anymore.
        rmRecursive(nativeSourceDir);
    }
}

function checkDoDownload() {
    if (!fs.existsSync(".git/") || process.argv.includes('--source_download')) {
        return true;
    }
    return false;
}

(async function main() {
    // Makes sure the work directory is what we need
    const workDir = path.join(__dirname, "../")
    process.chdir(workDir);

    if (checkDoDownload()) {
        const tmpPath = path.join(__dirname, `temp${crypto.randomBytes(16).toString("hex")}/`);
        try {
            buildFromRemoteSource(tmpPath);
        }
        catch (err) {
            // teardown tmpPath and source directory on failure
            rmRecursive(tmpPath);
            rmRecursive(nativeSourceDir);
            console.log("build from remote source failed with" + err);
            throw err;
        }
    } else {
        // kick off local build
        await build_step_cmake.performStep();
    }
})().catch((reason) => {
    console.error(reason)
    process.exitCode = 1
})
