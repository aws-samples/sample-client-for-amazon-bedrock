/**
 * Represents an object allocated natively inside the AWS CRT.
 * @internal
 */
export declare class NativeResource {
    private handle;
    constructor(handle: any);
    /** @internal */
    native_handle(): any;
}
/** @internal */
type Ctor<T> = new (...args: any[]) => T;
/**
 * Represents an object allocated natively inside the AWS CRT which also
 * needs a node/TS base class
 * @internal
 */
export declare function NativeResourceMixin<T extends Ctor<{}>>(Base: T): {
    new (...args: any[]): {
        /** @internal */
        _handle: any;
        /** @internal */
        _super(handle: any): void;
        /** @internal */
        native_handle(): any;
    };
} & T;
export {};
