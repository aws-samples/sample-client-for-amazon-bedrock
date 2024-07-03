/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing support for cancelling asynchronous operations
 *
 * @packageDocumentation
 * @module cancel
 */


import {EventEmitter} from "events";
import * as promise from "./promise";

/**
 * Callback signature for when cancel() has been invoked on a CancelController
 */
export type CancelListener = () => void;

/**
 * Abstract interface for an object capable of cancelling asynchronous operations.
 *
 * Modern browsers and Node 15+ include an AbortController which essentially does the same thing.  But our baseline
 * is still node 10, so we provide our own implementation.  Also, Abort is, unfortunately, a problematic term, so we
 * stick to Cancel.
 */
export interface ICancelController {

    /**
     * API to invoke to cancel all asynchronous operations connected to this controller
     */
    cancel() : void;

    /**
     * Checks whether or not the controller is in the cancelled state
     */
    hasBeenCancelled() : boolean;

    /**
     * Registers a callback to be notified when cancel() is invoked externally.  In general, the callback
     * will cancel an asynchronous operation by rejecting the associated promise.
     *
     * IMPORTANT: The listener is invoked synchronously if the controller has already been cancelled.
     *
     * @param listener - function to invoke on cancel; invoked synchronously if the controller has already been
     * cancelled
     *
     * @return undefined if the controller has already been cancelled, otherwise a function object whose invocation
     * will remove the listener from the controller's event emitter.
     *
     */
    addListener(listener: CancelListener) : promise.PromiseCleanupFunctor | undefined;

}

export const EVENT_NAME = 'cancelled';

/**
 * Signature for a factory function that can create EventEmitter objects
 */
export type EventEmitterFactory = () => EventEmitter;

/**
 * Configuration options for the CRT implementation of ICancelController
 */
export interface CancelControllerOptions {

    /**
     * Event emitters have, by default, a small maximum number of listeners.  When that default is insufficient for
     * a use case, this factory option allows for customization of how the internal event emitter is created.
     */
    emitterFactory? : EventEmitterFactory;
}

/**
 * CRT implementation of the ICancelController interface
 */
export class CancelController implements ICancelController {

    private cancelled : boolean;
    private emitter : EventEmitter;

    public constructor(options?: CancelControllerOptions) {
        this.cancelled = false;

        if (options && options.emitterFactory) {
            this.emitter = options.emitterFactory();
        } else {
            this.emitter = new EventEmitter();
        }
    }

    /**
     * Cancels all asynchronous operations associated with this controller
     */
    public cancel() {
        if (!this.cancelled) {
            this.cancelled = true;
            this.emitter.emit(EVENT_NAME);
            this.emitter.removeAllListeners(EVENT_NAME);
        }
    }

    /**
     * Checks whether or not the controller is in the cancelled state
     */
    public hasBeenCancelled() {
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
    public addListener(listener: CancelListener) : promise.PromiseCleanupFunctor | undefined {
        if (this.cancelled) {
            listener();
            return undefined;
        }

        this.emitter.on(EVENT_NAME, listener);

        return () => { this.emitter.removeListener(EVENT_NAME, listener); };
    }

}

/**
 * Configuration options for creating a promise that can be rejected by cancellation and resolved by the receipt
 * of an event from an EventEmitter.
 */
export interface CancellableNextEventPromiseOptions<ResultType> {

    /**
     * Optional cancel controller that can cancel the created promise
     */
    cancelController? : ICancelController;

    /**
     * Event emitter to listen to for potential promise completion
     */
    emitter : EventEmitter;

    /**
     * Name of the event to listen on for potential promise completion
     */
    eventName : string;

    /**
     * Optional transformation function for the event payload
     */
    eventDataTransformer? : (eventData : any) => ResultType;

    /**
     * Message to reject the promise with if cancellation is invoked
     */
    cancelMessage? : string;
}

/**
 * Creates a promise that can be rejected by a CancelController and resolved by the receipt of an event from an
 * EventEmitter.
 *
 * @param config promise creation options
 */
export function newCancellablePromiseFromNextEvent<ResultType>(config: CancellableNextEventPromiseOptions<ResultType>) : Promise<ResultType> {
    let onEvent : ((eventData : any) => void) | undefined = undefined;
    let cancelRemoveListener : promise.PromiseCleanupFunctor | undefined = undefined;

    let liftedPromise : promise.LiftedPromise<ResultType> = promise.newLiftedPromise<ResultType>();

    onEvent = (eventData : any) => {
        try {
            if (config.eventDataTransformer) {
                liftedPromise.resolve(config.eventDataTransformer(eventData));
            } else {
                liftedPromise.resolve(eventData as ResultType);
            }
        } catch (err) {
            liftedPromise.reject(err);
        }
    }

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
