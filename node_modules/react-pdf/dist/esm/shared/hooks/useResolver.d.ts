/// <reference types="react" />
type State<T> = {
    value: T;
    error: undefined;
} | {
    value: false;
    error: Error;
} | {
    value: undefined;
    error: undefined;
};
type Action<T> = {
    type: 'RESOLVE';
    value: T;
} | {
    type: 'REJECT';
    error: Error;
} | {
    type: 'RESET';
};
export default function useResolver<T>(): [State<T>, import("react").Dispatch<Action<T>>];
export {};
