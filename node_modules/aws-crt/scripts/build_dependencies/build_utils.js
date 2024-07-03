/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const child_process = require("child_process");

module.exports = {

    /**
     * Checks if the given node package exists. If it does, it returns true, otherwise it returns false.
     * This is used to check and see if we have a package before calling "require(<package_name>)".
     * @param {string} package_name
     * @param {string} package_version
     * @returns true if the package exists, false otherwise
     */
    npmCheckIfPackageExists: function (package_name, package_version) {

        // TODO - Look at using require.resolve instead of checking the node modules lists using "npm list"
        // This requires working around the issue where the package cannot be found, so it is downloaded but then
        // using require right afterwards causes a crash. This crash would need to be worked around and/or fixed.

        // Do we have it in our node list? If so, then use that!
        try {
            var list_output = child_process.execSync("npm list --depth 0 " + package_name, { encoding: "utf8" });
            if (list_output.indexOf(package_name + "@" + package_version) !== -1) {
                console.log("Found " + package_name + " in node list!");
                return true;
            }
        } catch (error) {
        }

        // Do we have it in our global list?
        try {
            var list_output = child_process.execSync("npm list -g --depth 0 " + package_name, { encoding: "utf8" });
            if (list_output.indexOf(package_name + "@" + package_version) !== -1) {
                console.log("Found " + package_name + " in node list!");
                return true;
            }
        } catch (error) {
        }

        console.log("Could not find " + package_name + " version " + package_version);
        return false;
    },

    /**
     * Downloads an NPM package for use dynamically - so it will only be loaded and used for this single script.
     * What it does under the hood is check for the npm package in the node modules, then in the npm list, and if
     * it does not find it in either location, it will download the package at that point, adding it as a dev-dependency.
     *
     * It it downloads it dynamically, then it will return true. This is so you can delete the package once you are done,
     * so it doesn't leave a zombie package in your node_modules. To remove the package, call npmDeleteRuntimePackage
     *
     * @param {string} package_name The name of the package you want to download (example: 'cmake-js')
     * @param {string} package_version The version of the package to download - leave blank for latest. (example: '6.3.2')
     * @returns True if the package was downloaded dynamically, otherwise false.
     */
    npmDownloadAndInstallRuntimePackage: function (package_name, package_version) {
        console.log("Looking for " + package_name + " version " + package_version + " as a dependency...");

        if (this.npmCheckIfPackageExists(package_name, package_version) == true) {
            return false;
        }

        // If it is not found, then download it into our node_modules
        try {
            console.log("Could not find " + package_name);
            console.log("Downloading " + package_name + " from npm for build...");
            // Try to intall the given package and ONLY the given package. Will throw an exception if there is an error.
            if (package_version != null) {
                child_process.execSync("npm install --no-package-lock --ignore-scripts --no-save " + package_name + "@" + package_version);
            } else {
                child_process.execSync("npm install --no-package-lock --ignore-scripts --no-save " + package_name);
            }
            return true;

        } catch (err) {
            console.log("ERROR - npm could not download " + package_name + "! " + package_name + " is required to build the CRT");
            throw err;
        }
    },

    /**
     * Prints an error message explaining why the script failed and encourages the reader to download the package
     * and make sure their development environment is setup correctly.
     * @param {string} package_name
     * @param {string} package_version
     */
    npmErrorPrint: function (package_name, package_version) {
        console.log("ERROR: Could not download " + package_name + "! Cannot build CRT");
        console.log("This is likely due to being unable to download the package.");
        console.log("Please install " + package_name + " version " + this.package_version + " and then run the aws-crt install script again");
        console.log("If that does not work, ensure that:");
        console.log("* you have npm (node package manager) installed");
        console.log("* " + package_name + " version " + package_version + " is available in your node package registry");
    }
};
