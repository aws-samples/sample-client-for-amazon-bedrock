"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newLiftedPromise = exports.makeSelfCleaningPromise = void 0;
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
function makeSelfCleaningPromise(promise, cleaner) {
    if (!cleaner) {
        return promise;
    }
    return promise.finally(function () { cleaner(); });
}
exports.makeSelfCleaningPromise = makeSelfCleaningPromise;
/**
 * Factory function to create a new LiftedPromise
 *
 * @param promiseBody optional body function to invoke as part of promise creation
 *
 * @return a promise whose resolve and reject methods have been lifted out of the internal body function and made
 * available to external actors
 */
function newLiftedPromise(promiseBody) {
    var localResolve = undefined;
    var localReject = undefined;
    var promise = new Promise(function (resolve, reject) {
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
        promise: promise,
        resolve: localResolve,
        reject: localReject
    };
}
exports.newLiftedPromise = newLiftedPromise;
//# sourceMappingURL=promise.js.map