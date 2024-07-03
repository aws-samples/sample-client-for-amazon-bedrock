import type { GAParams } from '../types/google';
declare global {
    interface Window {
        dataLayer?: Object[];
    }
}
export declare function GoogleAnalytics(props: GAParams): import("react/jsx-runtime").JSX.Element;
export declare const sendGAEvent: (...args: Object[]) => void;
