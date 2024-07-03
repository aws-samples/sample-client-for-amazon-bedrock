"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferedEventEmitter = void 0;
/**
 * Module for base types related to event emission
 *
 * @packageDocumentation
 * @module event
 */
var events_1 = require("events");
/**
 * @internal
 */
var BufferedEvent = /** @class */ (function () {
    function BufferedEvent(event, args) {
        this.event = event;
        this.args = args;
    }
    return BufferedEvent;
}());
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
var BufferedEventEmitter = /** @class */ (function (_super) {
    __extends(BufferedEventEmitter, _super);
    function BufferedEventEmitter() {
        var _this = _super.call(this) || this;
        _this.corked = false;
        return _this;
    }
    /**
     * Forces all written events to be buffered in memory. The buffered data will be
     * flushed when {@link BufferedEventEmitter.uncork} is called.
     */
    BufferedEventEmitter.prototype.cork = function () {
        this.corked = true;
    };
    /**
     * Flushes all data buffered since {@link BufferedEventEmitter.cork} was called.
     *
     * NOTE: It is HIGHLY recommended that uncorking should always be done via
     * ``` process.nextTick```, not during the ```EventEmitter.on()``` call.
     */
    BufferedEventEmitter.prototype.uncork = function () {
        this.corked = false;
        while (this.eventQueue) {
            var event_1 = this.eventQueue;
            _super.prototype.emit.apply(this, __spreadArray([event_1.event], __read(event_1.args), false));
            this.eventQueue = this.eventQueue.next;
        }
    };
    /**
     * Synchronously calls each of the listeners registered for the event key supplied
     * in registration order. If the {@link BufferedEventEmitter} is currently corked,
     * the event will be buffered until {@link BufferedEventEmitter.uncork} is called.
     * @param event The name of the event
     * @param args Event payload
     */
    BufferedEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.corked) {
            // queue requests in order
            var last = this.lastQueuedEvent;
            this.lastQueuedEvent = new BufferedEvent(event, args);
            if (last) {
                last.next = this.lastQueuedEvent;
            }
            else {
                this.eventQueue = this.lastQueuedEvent;
            }
            return this.listeners(event).length > 0;
        }
        return _super.prototype.emit.apply(this, __spreadArray([event], __read(args), false));
    };
    return BufferedEventEmitter;
}(events_1.EventEmitter));
exports.BufferedEventEmitter = BufferedEventEmitter;
//# sourceMappingURL=event.js.map