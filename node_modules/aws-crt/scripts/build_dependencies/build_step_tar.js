/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const path = require("path");
const process = require("process");
const build_step_axios = require("./build_step_axios");
const utils = require('./build_utils');

module.exports = {

    tar: null,
    tar_version: require("../../package.json").devDependencies['tar'].replace("^", ""),

    /**
     * Will download the file at the given url with the given version to the given path using tar.
     * Will automatically either use or download the runtime-package for tar as needed.
     */
    performStep: async function (url, version, path, nativeSourceDir) {
        if (utils.npmCheckIfPackageExists("tar", this.tar_version)) {
            this.tar = require('tar');
            await this.fetchNativeCode(url, version, path, nativeSourceDir);
        } else {
            await this.getPackageAndFetchNativeCode(url, version, path, nativeSourceDir);
        }
    },

    /**
     * Will download the file at the given url with the given version to the given path using tar.
     * Will ALWAYS download tar to the node_modules in scripts/build_dependencies/node_modules.
     */
    getPackageAndFetchNativeCode: async function (url, version, source_path, nativeSourceDir) {
        const workDir = path.join(__dirname, "../../")
        process.chdir(workDir);
        if (this.tar == null) {
            try {
                utils.npmDownloadAndInstallRuntimePackage("tar", this.tar_version);
                this.tar = require('tar');
            } catch (error) {
                utils.npmErrorPrint("tar", this.tar_version);
                process.exit(1);
            }
        }

        await this.fetchNativeCode(url, version, source_path, nativeSourceDir);
    },

    /**
     * Will download the file at the given url with the given version to the given path using tar.
     * Will NOT download or check to see if cmake-js is in the node_modules or otherwise exists.
     */
    fetchNativeCode: async function (url, version, source_path, nativeSourceDir) {
        build_step_axios.loadAxios();

        const sourceURL = `${url}/aws-crt-${version}-source.tgz`
        const tarballPath = source_path + "source.tgz";
        await build_step_axios.downloadFile(sourceURL, tarballPath);
        const sourceChecksumURL = `${url}/aws-crt-${version}-source.sha256`;
        await build_step_axios.checkChecksum(sourceChecksumURL, tarballPath);
        await this.tar.x({ file: tarballPath, strip: 2, C: nativeSourceDir });
    }
}
