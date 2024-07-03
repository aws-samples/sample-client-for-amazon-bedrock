"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnvironmentVariable = exports.getEnvironmentVariable = void 0;
function getEnvironmentVariable(name) {
    // Certain Deno setups will throw an error if you try to access environment variables
    // https://github.com/hwchase17/langchainjs/issues/1412
    try {
        return typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
                process.env?.[name]
            : undefined;
    }
    catch (e) {
        return undefined;
    }
}
exports.getEnvironmentVariable = getEnvironmentVariable;
function setEnvironmentVariable(name, value) {
    if (typeof process !== "undefined") {
        // eslint-disable-next-line no-process-env
        process.env[name] = value;
    }
}
exports.setEnvironmentVariable = setEnvironmentVariable;
