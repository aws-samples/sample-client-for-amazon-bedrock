/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const path = require("path");
const fs = require("fs");
const crypto = require('crypto');
const utils = require('./build_utils');

module.exports = {

    axios: null,
    clean_up_axios: false,
    axios_version: require("../../package.json").dependencies['axios'].replace("^", ""),

    /**
     * Loads the axios library. We want to do this seperate instead of having a performStep function
     * because the axios library is needed for multiple functions that have different data passed to them.
     */
    loadAxios: function () {
        const workDir = path.join(__dirname, "../../")
        process.chdir(workDir);
        if (this.axios == null) {
            if (utils.npmCheckIfPackageExists("axios", this.axios_version)) {
                this.axios = require("axios");
            } else {
                try {
                    this.clean_up_axios = utils.npmDownloadAndInstallRuntimePackage("axios", this.axios_version);
                    this.axios = require('axios');
                } catch (error) {
                    utils.npmErrorPrint("axios", this.axios_version);
                    process.exit(1);
                }
            }
        }
    },

    /**
     * Downloads the file from the given file URL and places it in the given output location path.
     * @param {*} fileUrl The file to download
     * @param {*} outputLocationPath The location to store the downloaded file
     * @returns A promise for the file download
     */
    downloadFile: function (fileUrl, outputLocationPath) {
        const writer = fs.createWriteStream(outputLocationPath);
        return this.axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
        }).then(response => {
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                let error = null;
                writer.on('error', err => {
                    error = err;
                    console.log("Source file download failed " + err);
                    writer.close();
                    reject(err);
                });
                writer.on('close', () => {
                    if (!error) {
                        console.log("Source file download succeed!");
                        resolve();
                    } else {
                        console.log("Source file download failed " + err);
                        reject(err);
                    }
                });
            });
        });
    },

    /**
     * Performs a checksum check on the given file. The checksum is downloaded from the given URL
     * and then the file given is checked using said checksum.
     * @param {*} url The URL containing the checksum
     * @param {*} local_file The file to check
     * @returns A promise for the result of the check
     */
    checkChecksum: function (url, local_file) {
        return this.axios({
            method: 'get',
            url: url,
            responseType: 'text',
        }).then(response => {
            return new Promise((resolve, reject) => {
                const filestream = fs.createReadStream(local_file);
                const hash = crypto.createHash('sha256');
                filestream.on('readable', () => {
                    // Only one element is going to be produced by the
                    // hash stream.
                    const data = filestream.read();
                    if (data)
                        hash.update(data);
                    else {
                        const checksum = hash.digest("hex")
                        if (checksum === response.data) {
                            resolve()
                        }
                        else {
                            reject(new Error("source code checksum mismatch"))
                        }
                    }
                });
            });
        })
    }

}
