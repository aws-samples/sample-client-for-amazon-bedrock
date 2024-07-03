/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

const os = require('os');
const process = require("process");
const path = require("path");
const utils = require('./build_utils');
const getCRuntime = require("../cruntime")

module.exports = {
    cmake: null,
    cmake_version: require("../../package.json").devDependencies['cmake-js'].replace("^", ""),

    /**
     * Will compile the source code for the CRT using cmake-js. Will automatically either use
     * or download the runtime-package for cmake-js as needed.
     */
    performStep: async function () {
        if (utils.npmCheckIfPackageExists("cmake-js", this.cmake_version)) {
            await this.buildSource();
        } else {
            await this.getPackageAndBuildSource();
        }
    },

    /**
     * Will compile the source code for the CRT using cmake-js. Will NOT download or check
     * to see if cmake-js is in the node_modules or otherwise exists.
     */
    buildSource: async function () {
        this.cmake = require("cmake-js");
        await this.buildLocally();
        return;
    },

    /**
     * Will compile the source code for the CRT using cmake-js. Will ALWAYS download
     * cmake-js to the node_modules in scripts/build_dependencies/node_modules.
     */
    getPackageAndBuildSource: async function () {
        const workDir = path.join(__dirname, "../../")
        process.chdir(workDir);

        if (this.cmake == null) {
            try {
                utils.npmDownloadAndInstallRuntimePackage("cmake-js", this.cmake_version);
                this.cmake = require('cmake-js');
            } catch (error) {
                utils.npmErrorPrint("cmake-js", this.cmake_version);
                process.exit(1);
            }
        }

        await this.buildSource();
        return;
    },

    /**
     * Builds the cmake source using cmake-js. You should not call this directly and instead call
     * "performStep", "buildSource", or "getPackageAndBuildSource" depending on your need.
     */
    buildLocally: function () {
        const platform = os.platform();
        let arch = os.arch();

        // Allow cross-compile (so OSX can do arm64 or x64 builds) via:
        // --target-arch ARCH
        if (process.argv.includes('--target-arch')) {
            arch = process.argv[process.argv.indexOf('--target-arch') + 1];
        }

        // options for cmake.BuildSystem
        let options = {
            target: "install",
            debug: process.argv.includes('--debug'),
            arch: arch,
            out: path.join('build', `${platform}-${arch}-${getCRuntime()}`),
            cMakeOptions: {
                CMAKE_EXPORT_COMPILE_COMMANDS: true,
                CMAKE_JS_PLATFORM: platform,
                BUILD_TESTING: 'OFF',
                CMAKE_INSTALL_PREFIX: 'crt/install',
                CMAKE_PREFIX_PATH: 'crt/install',
            }
        }


        // We need to pass some extra flags to pull off cross-compiling
        // because cmake-js doesn't set everything we need.
        //
        // See the docs on `arch`: https://github.com/cmake-js/cmake-js/blob/v6.1.0/README.md?#runtimes
        // > Notice: on non-Windows systems the C++ toolset's architecture's gonna be used despite this setting.
        if (platform === 'darwin') {
            // What Node calls "x64", Apple calls "x86_64". They both agree on the term "arm64" though.
            options.cMakeOptions.CMAKE_OSX_ARCHITECTURES = (arch === 'x64') ? 'x86_64' : arch;
            options.cMakeOptions.CMAKE_OSX_DEPLOYMENT_TARGET = "10.9";
        }

        // Convert any -D arguments to this script to cmake -D arguments
        for (const arg of process.argv) {
            if (arg.startsWith('-D')) {
                const option = arg.substring(2).split('=')
                options.cMakeOptions[option[0]] = option[1]
            }
        }

        // Enable parallel build (ignored by cmake older than 3.12)
        process.env.CMAKE_BUILD_PARALLEL_LEVEL = `${Math.max(os.cpus().length, 1)}`;

        // Run the build
        var buildSystem = new this.cmake.BuildSystem(options);
        return buildSystem.build();
    }
};
