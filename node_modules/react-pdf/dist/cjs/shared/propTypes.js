"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRotate = exports.isRenderMode = exports.isRef = exports.isPdf = exports.isPageNumber = exports.isPageIndex = exports.isPage = exports.isLinkTarget = exports.isLinkService = exports.isFile = exports.isClassName = exports.eventProps = void 0;
const prop_types_1 = __importDefault(require("prop-types"));
const make_event_props_1 = require("make-event-props");
const pdfjs_js_1 = __importDefault(require("../pdfjs.js"));
const utils_js_1 = require("./utils.js");
const LinkService_js_1 = __importDefault(require("../LinkService.js"));
const { PDFDataRangeTransport } = pdfjs_js_1.default;
exports.eventProps = (() => {
    const result = {};
    make_event_props_1.allEvents.forEach((eventName) => {
        result[eventName] = prop_types_1.default.func;
    });
    return result;
})();
const isTypedArray = prop_types_1.default.oneOfType([
    prop_types_1.default.instanceOf(Int8Array),
    prop_types_1.default.instanceOf(Uint8Array),
    prop_types_1.default.instanceOf(Uint8ClampedArray),
    prop_types_1.default.instanceOf(Int16Array),
    prop_types_1.default.instanceOf(Uint16Array),
    prop_types_1.default.instanceOf(Int32Array),
    prop_types_1.default.instanceOf(Uint32Array),
    prop_types_1.default.instanceOf(Float32Array),
    prop_types_1.default.instanceOf(Float64Array),
]);
const fileTypes = [
    prop_types_1.default.string,
    prop_types_1.default.instanceOf(ArrayBuffer),
    prop_types_1.default.shape({
        data: prop_types_1.default.oneOfType([
            prop_types_1.default.string,
            prop_types_1.default.instanceOf(ArrayBuffer),
            prop_types_1.default.arrayOf(prop_types_1.default.number.isRequired),
            isTypedArray,
        ]).isRequired,
    }),
    prop_types_1.default.shape({
        range: prop_types_1.default.instanceOf(PDFDataRangeTransport).isRequired,
    }),
    prop_types_1.default.shape({
        url: prop_types_1.default.string.isRequired,
    }),
];
if (typeof Blob !== 'undefined') {
    fileTypes.push(prop_types_1.default.instanceOf(Blob));
}
exports.isClassName = prop_types_1.default.oneOfType([
    prop_types_1.default.string,
    prop_types_1.default.arrayOf(prop_types_1.default.string),
]);
exports.isFile = prop_types_1.default.oneOfType(fileTypes);
exports.isLinkService = prop_types_1.default.instanceOf(LinkService_js_1.default);
exports.isLinkTarget = prop_types_1.default.oneOf(['_self', '_blank', '_parent', '_top']);
exports.isPage = prop_types_1.default.shape({
    commonObjs: prop_types_1.default.shape({}).isRequired,
    getAnnotations: prop_types_1.default.func.isRequired,
    getTextContent: prop_types_1.default.func.isRequired,
    getViewport: prop_types_1.default.func.isRequired,
    render: prop_types_1.default.func.isRequired,
});
const isPageIndex = function isPageIndex(props, propName, componentName) {
    const { [propName]: pageIndex, pageNumber, pdf } = props;
    if (!(0, utils_js_1.isDefined)(pdf)) {
        return null;
    }
    if ((0, utils_js_1.isDefined)(pageIndex)) {
        if (typeof pageIndex !== 'number') {
            return new Error(`\`${propName}\` of type \`${typeof pageIndex}\` supplied to \`${componentName}\`, expected \`number\`.`);
        }
        if (pageIndex < 0) {
            return new Error(`Expected \`${propName}\` to be greater or equal to 0.`);
        }
        const { numPages } = pdf;
        if (pageIndex + 1 > numPages) {
            return new Error(`Expected \`${propName}\` to be less or equal to ${numPages - 1}.`);
        }
    }
    else if (!(0, utils_js_1.isDefined)(pageNumber)) {
        return new Error(`\`${propName}\` not supplied. Either pageIndex or pageNumber must be supplied to \`${componentName}\`.`);
    }
    // Everything is fine
    return null;
};
exports.isPageIndex = isPageIndex;
const isPageNumber = function isPageNumber(props, propName, componentName) {
    const { [propName]: pageNumber, pageIndex, pdf } = props;
    if (!(0, utils_js_1.isDefined)(pdf)) {
        return null;
    }
    if ((0, utils_js_1.isDefined)(pageNumber)) {
        if (typeof pageNumber !== 'number') {
            return new Error(`\`${propName}\` of type \`${typeof pageNumber}\` supplied to \`${componentName}\`, expected \`number\`.`);
        }
        if (pageNumber < 1) {
            return new Error(`Expected \`${propName}\` to be greater or equal to 1.`);
        }
        const { numPages } = pdf;
        if (pageNumber > numPages) {
            return new Error(`Expected \`${propName}\` to be less or equal to ${numPages}.`);
        }
    }
    else if (!(0, utils_js_1.isDefined)(pageIndex)) {
        return new Error(`\`${propName}\` not supplied. Either pageIndex or pageNumber must be supplied to \`${componentName}\`.`);
    }
    // Everything is fine
    return null;
};
exports.isPageNumber = isPageNumber;
exports.isPdf = prop_types_1.default.oneOfType([
    // Ideally, this would be `PropTypes.instanceOf(PDFDocumentProxy)`, but it can't be imported.
    prop_types_1.default.any,
    prop_types_1.default.oneOf([false]),
]);
exports.isRef = prop_types_1.default.oneOfType([
    prop_types_1.default.func,
    prop_types_1.default.exact({
        current: prop_types_1.default.any,
    }),
]);
exports.isRenderMode = prop_types_1.default.oneOf(['canvas', 'custom', 'none', 'svg']);
exports.isRotate = prop_types_1.default.oneOf([0, 90, 180, 270]);
