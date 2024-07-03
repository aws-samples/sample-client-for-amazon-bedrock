export declare const MAX_INT8: number;
export declare const MIN_INT8: number;
export declare const MAX_INT16: number;
export declare const MIN_INT16: number;
export declare const MAX_INT32: number;
export declare const MIN_INT32: number;
export declare const MAX_INT64: bigint;
export declare const MIN_INT64: bigint;
/** @internal */
export declare function marshalInt64BigintAsBuffer(value: bigint): Uint8Array;
/** @internal */
export declare function unmarshalInt64BigintFromBuffer(buffer: ArrayBuffer): bigint;
