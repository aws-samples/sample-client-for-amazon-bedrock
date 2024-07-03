/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as platform from './platform'

test('platform.is_nodejs is correct', () => {
    expect(platform.is_nodejs()).not.toEqual(platform.is_browser());
});

test('platform.is_browser is correct', () => {
    expect(platform.is_browser()).not.toEqual(platform.is_nodejs());
});
