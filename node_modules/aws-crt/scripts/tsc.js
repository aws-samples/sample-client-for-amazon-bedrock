/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
const fs = require("fs");
const child_process = require("child_process");

function run(cmd) {
    console.log(`> ${cmd}`)
    child_process.execSync(cmd, {
        stdio: "inherit"
    });
}

// Run TSC
run('npx tsc -p tsconfig.json')
run('npx tsc -p tsconfig.browser.json');

// Copy the binding declaration file over verbatim
fs.copyFileSync('lib/native/binding.d.ts', 'dist/native/binding.d.ts');
