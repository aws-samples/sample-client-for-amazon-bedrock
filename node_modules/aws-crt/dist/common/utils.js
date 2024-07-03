"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.set_defined_property = void 0;
/** @internal */
function set_defined_property(object, propertyName, value) {
    if (value === undefined || value == null) {
        return false;
    }
    object[propertyName] = value;
    return true;
}
exports.set_defined_property = set_defined_property;
//# sourceMappingURL=utils.js.map