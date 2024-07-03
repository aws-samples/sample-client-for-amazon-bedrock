"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferedEventEmitter = void 0;
/**
 * Module for base types related to event emission
 *
 * @packageDocumentation
 * @module event
 */
const events_1 = require("events");
/**
 * @internal
 */
class BufferedEvent {
    constructor(event, args) {
        this.event = event;
        this.args = args;
    }
}
/**
 * Provides buffered event emitting semantics, similar to many Node-style streams.
 * Subclasses will override EventEmitter.on() and trigger uncorking.
 * NOTE: It is HIGHLY recommended that uncorking should always be done via
 * ```process.nextTick()```, not during the EventEmitter.on() call.
 *
 * See also: [Node writable streams](https://nodejs.org/api/stream.html#stream_writable_cork)
 *
 * @category Events
 */
class BufferedEventEmitter extends events_1.EventEmitter {
    constructor() {
        super();
        this.corked = false;
    }
    /**
     * Forces all written events to be buffered in memory. The buffered data will be
     * flushed when {@link BufferedEventEmitter.uncork} is called.
     */
    cork() {
        this.corked = true;
    }
    /**
     * Flushes all data buffered since {@link BufferedEventEmitter.cork} was called.
     *
     * NOTE: It is HIGHLY recommended that uncorking should always be done via
     * ``` process.nextTick```, not during the ```EventEmitter.on()``` call.
     */
    uncork() {
        this.corked = false;
        while (this.eventQueue) {
            const event = this.eventQueue;
            super.emit(event.event, ...event.args);
            this.eventQueue = this.eventQueue.next;
        }
    }
    /**
     * Synchronously calls each of the listeners registered for the event key supplied
     * in registration order. If the {@link BufferedEventEmitter} is currently corked,
     * the event will be buffered until {@link BufferedEventEmitter.uncork} is called.
     * @param event The name of the event
     * @param args Event payload
     */
    emit(event, ...args) {
        if (this.corked) {
            // queue requests in order
            let last = this.lastQueuedEvent;
            this.lastQueuedEvent = new BufferedEvent(event, args);
            if (last) {
                last.next = this.lastQueuedEvent;
            }
            else {
                this.eventQueue = this.lastQueuedEvent;
            }
            return this.listeners(event).length > 0;
        }
        return super.emit(event, ...args);
    }
}
exports.BufferedEventEmitter = BufferedEventEmitter;
//# sourceMappingURL=event.js.map