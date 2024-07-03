/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/** @internal */
export function set_defined_property(object: any, propertyName: string, value: any) : boolean {
    if (value === undefined || value == null) {
        return false;
    }

    object[propertyName] = value;

    return true;
}
