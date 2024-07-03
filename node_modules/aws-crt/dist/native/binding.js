"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cRuntime = exports.CRuntimeType = void 0;
const path = __importStar(require("path"));
const os_1 = require("os");
const fs_1 = require("fs");
const process_1 = require("process");
const child_process_1 = __importDefault(require("child_process"));
const CRuntimeType = Object.freeze({
    NON_LINUX: "cruntime",
    MUSL: "musl",
    GLIBC: "glibc"
});
exports.CRuntimeType = CRuntimeType;
function getCRuntime() {
    if ((0, os_1.platform)() !== "linux") {
        return CRuntimeType.NON_LINUX;
    }
    try {
        // sometimes, ldd's output goes to stderr, so capture that too
        // Using spawnSync because execSync treats any output to stderr as an exception.
        const spawnedProcess = child_process_1.default.spawnSync('ldd', ['--version'], { encoding: 'utf8' });
        const output = spawnedProcess.stdout + spawnedProcess.stderr;
        if (output.includes(CRuntimeType.MUSL)) {
            return CRuntimeType.MUSL;
        }
        else {
            return CRuntimeType.GLIBC;
        }
    }
    catch (error) {
        return CRuntimeType.GLIBC;
    }
}
const upgrade_string = "Please upgrade to node >=10.16.0, or use the provided browser implementation.";
if ('napi' in process_1.versions) {
    // @ts-ignore
    const napi_version = parseInt(process_1.versions['napi']);
    if (napi_version < 4) {
        throw new Error("The AWS CRT native implementation requires that NAPI version 4 be present. " + upgrade_string);
    }
}
else {
    throw new Error("The current runtime is not reporting an NAPI version. " + upgrade_string);
}
const cRuntime = getCRuntime();
exports.cRuntime = cRuntime;
const binary_name = 'aws-crt-nodejs';
const platformDir = `${os_1.platform}-${os_1.arch}-${cRuntime}`;
let source_root = path.resolve(__dirname, '..', '..');
const dist = path.join(source_root, 'dist');
if ((0, fs_1.existsSync)(dist)) {
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
    let final_path = path.resolve(__dirname, ...relative_path.split(path.sep));
    search_paths.push(final_path);
}
if (process.env.AWS_CRT_NODEJS_BINARY_ABSOLUTE_PATH) {
    search_paths.push(process.env.AWS_CRT_NODEJS_BINARY_ABSOLUTE_PATH);
}
let binding;
for (const path of search_paths) {
    if ((0, fs_1.existsSync)(path)) {
        binding = require(path);
        break;
    }
}
if (binding == undefined) {
    throw new Error("AWS CRT binary not present in any of the following locations:\n\t" + search_paths.join('\n\t'));
}
const binding_1 = __importDefault(require("./binding"));
/** Electron will shutdown the node process on exit, which causes the threadsafe function to segfault. To prevent
  * the segfault we disable the threadsafe function on node process exit. */
if (process.versions.hasOwnProperty('electron')) {
    process.on('exit', function () {
        binding_1.default.disable_threadsafe_function();
    });
}
exports.default = binding;
//# sourceMappingURL=binding.js.map