/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 *
 * A module containing promise-related utility types and functions
 *
 * @packageDocumentation
 * @module promise
 */

/**
 * Signature for a function that will perform some arbitrary promise-related cleanup task, like removing one or
 * more event listeners from an EventEmitter.
 */
export type PromiseCleanupFunctor = () => void;

/**
 * A helper function that takes a promise and creates a wrapper promise that invokes a cleanup function when the inner
 * promise is completed for any reason.  The primary use is to remove event listeners related to promise completion
 * when the promise actually completes.  This allows us to keep the number of listeners on a CancelController bounded by
 * the number of incomplete promises associated with it.  If we didn't clean up, the listener set would grow
 * without limit.
 *
 * For cancellation, this leads to an internal usage pattern that is strongly recommended:
 *
 * ```
 * async doSomethingCancellable(...) : Promise<...> {
 *    removeListenerFunctor = undefined;
 *
 *    innerPromise = new Promise(async (resolve, reject) => {
 *       ...
 *
 *       cancelListenerFunction = () => { clean up and reject innerPromise };
 *       removeListenerFunctor = cancelController.addListener(cancelListenerFunction);
 *
 *       ...
 *    }
 *
 *    return makeSelfCleaningPromise(innerPromise, removeListenerFunctor);
 * }
 * ```
 *
 * @param promise promise to wrap with automatic cleanup
 * @param cleaner cleaner function to invoke when the promise is completed
 *
 * @return a promise with matching result/err, that invokes the cleaner function on inner promise completion
 */
export function makeSelfCleaningPromise<ResultType>(promise: Promise<ResultType>, cleaner? : PromiseCleanupFunctor) : Promise<ResultType> {
    if (!cleaner) {
        return promise;
    }

    return promise.finally(() => { cleaner(); });
}

/**
 * Generic type signature for a promise resolution function
 */
export type LiftedResolver<ResultType> = (value : ResultType) => void;

/**
 * Generic type signature for a promise rejection function
 */
export type LiftedRejecter = (error? : any) => void;

/**
 * A promise variant that makes the resolve and reject functions available for external invocations.
 *
 * Useful for situations where you want to await for something that might never complete while still allowing
 * the promise to be cancellable.
 *
 * You get around the potentially infinite await by not awaiting at all and instead letting external events trigger
 * resolve and reject (in particular, CancelController).
 */
export interface LiftedPromise<ResultType> {

    /**
     * The actual promise whose resolve and reject methods have been exposed.
     */
    promise: Promise<ResultType>;

    /**
     * Resolve function for the associated promise
     */
    resolve: LiftedResolver<ResultType>;

    /**
     * Reject function for the associated promise
     */
    reject: LiftedRejecter;
}

/**
 * Factory function to create a new LiftedPromise
 *
 * @param promiseBody optional body function to invoke as part of promise creation
 *
 * @return a promise whose resolve and reject methods have been lifted out of the internal body function and made
 * available to external actors
 */
export function newLiftedPromise<ResultType>(promiseBody?: (resolve : LiftedResolver<ResultType>, reject : LiftedRejecter) => void) : LiftedPromise<ResultType> {
    let localResolve : LiftedResolver<ResultType> | undefined = undefined;
    let localReject : LiftedRejecter | undefined = undefined;

    let promise = new Promise<ResultType>((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    if (!localResolve || !localReject) {
        // should never happen
        throw new Error("Failed to bind resolve and reject when making lifted promise");
    }

    if (promiseBody) {
        promiseBody(localResolve, localReject);
    }

    return {
        promise : promise,
        resolve: localResolve,
        reject : localReject
    };
}


