"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeResourceMixin = exports.NativeResource = void 0;
/**
 * Represents an object allocated natively inside the AWS CRT.
 * @internal
 */
class NativeResource {
    constructor(handle) {
        this.handle = handle;
    }
    /** @internal */
    native_handle() {
        return this.handle;
    }
}
exports.NativeResource = NativeResource;
/**
 * Represents an object allocated natively inside the AWS CRT which also
 * needs a node/TS base class
 * @internal
 */
function NativeResourceMixin(Base) {
    /** @internal */
    return class extends Base {
        /** @internal */
        constructor(...args) {
            const handle = args.shift();
            super(...args);
            this._handle = handle;
        }
        /** @internal */
        _super(handle) {
            this._handle = handle;
        }
        /** @internal */
        native_handle() {
            return this._handle;
        }
    };
}
exports.NativeResourceMixin = NativeResourceMixin;
//# sourceMappingURL=native_resource.js.map