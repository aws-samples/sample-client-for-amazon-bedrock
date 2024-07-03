"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCancellablePromiseFromNextEvent = exports.CancelController = exports.EVENT_NAME = void 0;
/**
 *
 * A module containing support for cancelling asynchronous operations
 *
 * @packageDocumentation
 * @module cancel
 */
const events_1 = require("events");
const promise = __importStar(require("./promise"));
exports.EVENT_NAME = 'cancelled';
/**
 * CRT implementation of the ICancelController interface
 */
class CancelController {
    constructor(options) {
        this.cancelled = false;
        if (options && options.emitterFactory) {
            this.emitter = options.emitterFactory();
        }
        else {
            this.emitter = new events_1.EventEmitter();
        }
    }
    /**
     * Cancels all asynchronous operations associated with this controller
     */
    cancel() {
        if (!this.cancelled) {
            this.cancelled = true;
            this.emitter.emit(exports.EVENT_NAME);
            this.emitter.removeAllListeners(exports.EVENT_NAME);
        }
    }
    /**
     * Checks whether or not the controller is in the cancelled state
     */
    hasBeenCancelled() {
        return this.cancelled;
    }
    /**
     * Registers a callback to be notified when cancel() is invoked externally.  In general, the callback
     * will cancel an asynchronous operation by rejecting the associated promise.
     *
     * IMPORTANT: The listener is invoked synchronously if the controller has already been cancelled.
     *
     * @param listener - function to invoke on cancel; invoked synchronously if the controller has been cancelled
     *
     * @return undefined if the controller has already been cancelled, otherwise a function object whose invocation
     * will remove the listener from the controller's event emitter.
     *
     */
    addListener(listener) {
        if (this.cancelled) {
            listener();
            return undefined;
        }
        this.emitter.on(exports.EVENT_NAME, listener);
        return () => { this.emitter.removeListener(exports.EVENT_NAME, listener); };
    }
}
exports.CancelController = CancelController;
/**
 * Creates a promise that can be rejected by a CancelController and resolved by the receipt of an event from an
 * EventEmitter.
 *
 * @param config promise creation options
 */
function newCancellablePromiseFromNextEvent(config) {
    let onEvent = undefined;
    let cancelRemoveListener = undefined;
    let liftedPromise = promise.newLiftedPromise();
    onEvent = (eventData) => {
        try {
            if (config.eventDataTransformer) {
                liftedPromise.resolve(config.eventDataTransformer(eventData));
            }
            else {
                liftedPromise.resolve(eventData);
            }
        }
        catch (err) {
            liftedPromise.reject(err);
        }
    };
    config.emitter.addListener(config.eventName, onEvent);
    if (config.cancelController) {
        cancelRemoveListener = config.cancelController.addListener(() => {
            liftedPromise.reject(config.cancelMessage);
        });
    }
    return promise.makeSelfCleaningPromise(liftedPromise.promise, () => {
        if (onEvent) {
            config.emitter.removeListener(config.eventName, onEvent);
        }
        if (cancelRemoveListener) {
            cancelRemoveListener();
        }
    });
}
exports.newCancellablePromiseFromNextEvent = newCancellablePromiseFromNextEvent;
//# sourceMappingURL=cancel.js.map