"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_1 = __importDefault(require("buffer"));
var process_1 = __importDefault(require("process"));
// Workaround to get mqtt-js working with Webpack 5
if (window) {
    window.Buffer = buffer_1.default.Buffer;
    window.process = process_1.default;
    // NodeJS global shim workaround for Angular
    window.global = window;
}
//# sourceMappingURL=polyfills.js.map