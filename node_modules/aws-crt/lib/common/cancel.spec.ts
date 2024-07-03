/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

import * as cancel from "./cancel";
import {EventEmitter} from "events";

jest.setTimeout(10000);

test('Simple cancel test - after await', async () => {
    let controller : cancel.CancelController = new cancel.CancelController();

    let emptyPromise : Promise<void> = new Promise<void>((resolve, reject) => {
       controller.addListener(() => { resolve(); });
    });

    setTimeout(() => {controller.cancel();}, 1000);

    await emptyPromise;

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);
});

test('Simple cancel test - before await', async () => {
    let controller : cancel.CancelController = new cancel.CancelController();
    controller.cancel();

    let emptyPromise : Promise<void> = new Promise<void>((resolve, reject) => {
        controller.addListener(() => { resolve(); });
    });

    await emptyPromise;

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);
});

test('Cancellable next event promise - event resolve', async () => {
    const eventName : string = "DISASTER";
    let controller : cancel.CancelController = new cancel.CancelController();
    let emitter : EventEmitter = new EventEmitter();

    let nextEventPromise : Promise<string> = cancel.newCancellablePromiseFromNextEvent({
        cancelController: controller,
        emitter : emitter,
        eventName : eventName,
        eventDataTransformer : (value : any) => { return value.toString(); },
        cancelMessage : "Won't happen"
    });

    setTimeout(() => { emitter.emit(eventName, 1); });

    let result : string = await nextEventPromise;
    expect(result).toEqual("1");

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);
    expect(emitter.listenerCount(eventName)).toEqual(0);
});

test('Cancellable next event promise - cancel reject', async () => {
    const eventName : string = "DISASTER";
    let controller : cancel.CancelController = new cancel.CancelController();
    let emitter : EventEmitter = new EventEmitter();

    let nextEventPromise : Promise<string> = cancel.newCancellablePromiseFromNextEvent({
        cancelController: controller,
        emitter : emitter,
        eventName : eventName,
        eventDataTransformer : (value : any) => { return value.toString(); },
        cancelMessage : "Will happen"
    });

    setTimeout(() => { controller.cancel(); });

    await expect(nextEventPromise).rejects.toMatch("Will happen");

    // @ts-ignore
    expect(controller.emitter.listenerCount(cancel.EVENT_NAME)).toEqual(0);
    expect(emitter.listenerCount(eventName)).toEqual(0);
});