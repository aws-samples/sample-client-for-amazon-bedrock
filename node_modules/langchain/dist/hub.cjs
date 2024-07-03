"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = exports.push = void 0;
const langchainhub_1 = require("langchainhub");
const index_js_1 = require("./load/index.cjs");
/**
 * Push a prompt to the hub.
 * If the specified repo doesn't already exist, it will be created.
 * @param repoFullName The full name of the repo.
 * @param runnable The prompt to push.
 * @param options
 * @returns The URL of the newly pushed prompt in the hub.
 */
async function push(repoFullName, runnable, options) {
    const client = new langchainhub_1.Client(options);
    return client.push(repoFullName, JSON.stringify(runnable), options);
}
exports.push = push;
/**
 * Pull a prompt from the hub.
 * @param ownerRepoCommit The name of the repo containing the prompt, as well as an optional commit hash separated by a slash.
 * @param options
 * @returns
 */
async function pull(ownerRepoCommit, options) {
    const client = new langchainhub_1.Client(options);
    const result = await client.pull(ownerRepoCommit);
    return (0, index_js_1.load)(result);
}
exports.pull = pull;
