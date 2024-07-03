/// <reference types="node" />
/**
 *
 * A module containing support for cancelling asynchronous operations
 *
 * @packageDocumentation
 * @module cancel
 */
import { EventEmitter } from "events";
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
    cancel(): void;
    /**
     * Checks whether or not the controller is in the cancelled state
     */
    hasBeenCancelled(): boolean;
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
    addListener(listener: CancelListener): promise.PromiseCleanupFunctor | undefined;
}
export declare const EVENT_NAME = "cancelled";
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
    emitterFactory?: EventEmitterFactory;
}
/**
 * CRT implementation of the ICancelController interface
 */
export declare class CancelController implements ICancelController {
    private cancelled;
    private emitter;
    constructor(options?: CancelControllerOptions);
    /**
     * Cancels all asynchronous operations associated with this controller
     */
    cancel(): void;
    /**
     * Checks whether or not the controller is in the cancelled state
     */
    hasBeenCancelled(): boolean;
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
    addListener(listener: CancelListener): promise.PromiseCleanupFunctor | undefined;
}
/**
 * Configuration options for creating a promise that can be rejected by cancellation and resolved by the receipt
 * of an event from an EventEmitter.
 */
export interface CancellableNextEventPromiseOptions<ResultType> {
    /**
     * Optional cancel controller that can cancel the created promise
     */
    cancelController?: ICancelController;
    /**
     * Event emitter to listen to for potential promise completion
     */
    emitter: EventEmitter;
    /**
     * Name of the event to listen on for potential promise completion
     */
    eventName: string;
    /**
     * Optional transformation function for the event payload
     */
    eventDataTransformer?: (eventData: any) => ResultType;
    /**
     * Message to reject the promise with if cancellation is invoked
     */
    cancelMessage?: string;
}
/**
 * Creates a promise that can be rejected by a CancelController and resolved by the receipt of an event from an
 * EventEmitter.
 *
 * @param config promise creation options
 */
export declare function newCancellablePromiseFromNextEvent<ResultType>(config: CancellableNextEventPromiseOptions<ResultType>): Promise<ResultType>;
