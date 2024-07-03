"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitAllCallbacks = exports.consumeCallback = void 0;
const p_queue_1 = __importDefault(require("p-queue"));
let queue;
/**
 * Creates a queue using the p-queue library. The queue is configured to
 * auto-start and has a concurrency of 1, meaning it will process tasks
 * one at a time.
 */
function createQueue() {
    const PQueue = "default" in p_queue_1.default ? p_queue_1.default.default : p_queue_1.default;
    return new PQueue({
        autoStart: true,
        concurrency: 1,
    });
}
/**
 * Consume a promise, either adding it to the queue or waiting for it to resolve
 * @param promise Promise to consume
 * @param wait Whether to wait for the promise to resolve or resolve immediately
 */
async function consumeCallback(promiseFn, wait) {
    if (wait === true) {
        await promiseFn();
    }
    else {
        if (typeof queue === "undefined") {
            queue = createQueue();
        }
        void queue.add(promiseFn);
    }
}
exports.consumeCallback = consumeCallback;
/**
 * Waits for all promises in the queue to resolve. If the queue is
 * undefined, it immediately resolves a promise.
 */
function awaitAllCallbacks() {
    return typeof queue !== "undefined" ? queue.onIdle() : Promise.resolve();
}
exports.awaitAllCallbacks = awaitAllCallbacks;
