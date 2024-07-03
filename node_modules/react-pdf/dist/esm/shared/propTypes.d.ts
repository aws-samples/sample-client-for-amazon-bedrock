import PropTypes from 'prop-types';
import { allEvents } from 'make-event-props';
import LinkService from '../LinkService.js';
import type { Validator } from 'prop-types';
type AllEvents = (typeof allEvents)[number];
type Props = {
    [K in AllEvents]?: typeof PropTypes.func;
};
export declare const eventProps: Props;
export declare const isClassName: PropTypes.Requireable<NonNullable<string | (string | null | undefined)[] | null | undefined>>;
export declare const isFile: PropTypes.Requireable<NonNullable<string | ArrayBuffer | PropTypes.InferProps<{
    data: PropTypes.Validator<NonNullable<NonNullable<string | ArrayBuffer | number[] | null | undefined>>>;
}> | PropTypes.InferProps<{
    range: PropTypes.Validator<import("pdfjs-dist").PDFDataRangeTransport>;
}> | PropTypes.InferProps<{
    url: PropTypes.Validator<string>;
}> | null | undefined>>;
export declare const isLinkService: PropTypes.Requireable<LinkService>;
export declare const isLinkTarget: PropTypes.Requireable<"_self" | "_blank" | "_parent" | "_top">;
export declare const isPage: PropTypes.Requireable<PropTypes.InferProps<{
    commonObjs: PropTypes.Validator<NonNullable<PropTypes.InferProps<{}>>>;
    getAnnotations: PropTypes.Validator<(...args: any[]) => any>;
    getTextContent: PropTypes.Validator<(...args: any[]) => any>;
    getViewport: PropTypes.Validator<(...args: any[]) => any>;
    render: PropTypes.Validator<(...args: any[]) => any>;
}>>;
export declare const isPageIndex: Validator<number>;
export declare const isPageNumber: Validator<number>;
export declare const isPdf: PropTypes.Requireable<any>;
export declare const isRef: PropTypes.Requireable<NonNullable<((...args: any[]) => any) | Required<PropTypes.InferProps<{
    current: PropTypes.Requireable<any>;
}>> | null | undefined>>;
export declare const isRenderMode: PropTypes.Requireable<"canvas" | "custom" | "none" | "svg">;
export declare const isRotate: PropTypes.Requireable<0 | 90 | 180 | 270>;
export {};
