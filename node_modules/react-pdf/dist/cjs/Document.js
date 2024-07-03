"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const prop_types_1 = __importDefault(require("prop-types"));
const make_event_props_1 = __importDefault(require("make-event-props"));
const make_cancellable_promise_1 = __importDefault(require("make-cancellable-promise"));
const clsx_1 = __importDefault(require("clsx"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
const dequal_1 = require("dequal");
const pdfjs_js_1 = __importDefault(require("./pdfjs.js"));
const DocumentContext_js_1 = __importDefault(require("./DocumentContext.js"));
const Message_js_1 = __importDefault(require("./Message.js"));
const LinkService_js_1 = __importDefault(require("./LinkService.js"));
const PasswordResponses_js_1 = __importDefault(require("./PasswordResponses.js"));
const utils_js_1 = require("./shared/utils.js");
const useResolver_js_1 = __importDefault(require("./shared/hooks/useResolver.js"));
const propTypes_js_1 = require("./shared/propTypes.js");
const { PDFDataRangeTransport } = pdfjs_js_1.default;
const defaultOnPassword = (callback, reason) => {
    switch (reason) {
        case PasswordResponses_js_1.default.NEED_PASSWORD: {
            // eslint-disable-next-line no-alert
            const password = prompt('Enter the password to open this PDF file.');
            callback(password);
            break;
        }
        case PasswordResponses_js_1.default.INCORRECT_PASSWORD: {
            // eslint-disable-next-line no-alert
            const password = prompt('Invalid password. Please try again.');
            callback(password);
            break;
        }
        default:
    }
};
function isParameterObject(file) {
    return (typeof file === 'object' &&
        file !== null &&
        ('data' in file || 'range' in file || 'url' in file));
}
/**
 * Loads a document passed using `file` prop.
 */
const Document = (0, react_1.forwardRef)(function Document(_a, ref) {
    var { children, className, error = 'Failed to load PDF file.', externalLinkRel, externalLinkTarget, file, inputRef, imageResourcesPath, loading = 'Loading PDF…', noData = 'No PDF file specified.', onItemClick, onLoadError: onLoadErrorProps, onLoadProgress, onLoadSuccess: onLoadSuccessProps, onPassword = defaultOnPassword, onSourceError: onSourceErrorProps, onSourceSuccess: onSourceSuccessProps, options, renderMode, rotate } = _a, otherProps = __rest(_a, ["children", "className", "error", "externalLinkRel", "externalLinkTarget", "file", "inputRef", "imageResourcesPath", "loading", "noData", "onItemClick", "onLoadError", "onLoadProgress", "onLoadSuccess", "onPassword", "onSourceError", "onSourceSuccess", "options", "renderMode", "rotate"]);
    const [sourceState, sourceDispatch] = (0, useResolver_js_1.default)();
    const { value: source, error: sourceError } = sourceState;
    const [pdfState, pdfDispatch] = (0, useResolver_js_1.default)();
    const { value: pdf, error: pdfError } = pdfState;
    const linkService = (0, react_1.useRef)(new LinkService_js_1.default());
    const pages = (0, react_1.useRef)([]);
    const prevFile = (0, react_1.useRef)();
    const prevOptions = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        if (file && file !== prevFile.current && isParameterObject(file)) {
            (0, warning_1.default)(!(0, dequal_1.dequal)(file, prevFile.current), `File prop passed to <Document /> changed, but it's equal to previous one. This might result in unnecessary reloads. Consider memoizing the value passed to "file" prop.`);
            prevFile.current = file;
        }
    }, [file]);
    // Detect non-memoized changes in options prop
    (0, react_1.useEffect)(() => {
        if (options && options !== prevOptions.current) {
            (0, warning_1.default)(!(0, dequal_1.dequal)(options, prevOptions.current), `Options prop passed to <Document /> changed, but it's equal to previous one. This might result in unnecessary reloads. Consider memoizing the value passed to "options" prop.`);
            prevOptions.current = options;
        }
    }, [options]);
    const viewer = (0, react_1.useRef)({
        // Handling jumping to internal links target
        scrollPageIntoView: (args) => {
            const { dest, pageNumber, pageIndex = pageNumber - 1 } = args;
            // First, check if custom handling of onItemClick was provided
            if (onItemClick) {
                onItemClick({ dest, pageIndex, pageNumber });
                return;
            }
            // If not, try to look for target page within the <Document>.
            const page = pages.current[pageIndex];
            if (page) {
                // Scroll to the page automatically
                page.scrollIntoView();
                return;
            }
            (0, warning_1.default)(false, `An internal link leading to page ${pageNumber} was clicked, but neither <Document> was provided with onItemClick nor it was able to find the page within itself. Either provide onItemClick to <Document> and handle navigating by yourself or ensure that all pages are rendered within <Document>.`);
        },
    });
    (0, react_1.useImperativeHandle)(ref, () => ({
        linkService,
        pages,
        viewer,
    }), []);
    /**
     * Called when a document source is resolved correctly
     */
    function onSourceSuccess() {
        if (onSourceSuccessProps) {
            onSourceSuccessProps();
        }
    }
    /**
     * Called when a document source failed to be resolved correctly
     */
    function onSourceError() {
        if (!sourceError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        (0, warning_1.default)(false, sourceError.toString());
        if (onSourceErrorProps) {
            onSourceErrorProps(sourceError);
        }
    }
    function resetSource() {
        sourceDispatch({ type: 'RESET' });
    }
    (0, react_1.useEffect)(resetSource, [file, sourceDispatch]);
    const findDocumentSource = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!file) {
            return null;
        }
        // File is a string
        if (typeof file === 'string') {
            if ((0, utils_js_1.isDataURI)(file)) {
                const fileByteString = (0, utils_js_1.dataURItoByteString)(file);
                return { data: fileByteString };
            }
            (0, utils_js_1.displayCORSWarning)();
            return { url: file };
        }
        // File is PDFDataRangeTransport
        if (file instanceof PDFDataRangeTransport) {
            return { range: file };
        }
        // File is an ArrayBuffer
        if ((0, utils_js_1.isArrayBuffer)(file)) {
            return { data: file };
        }
        /**
         * The cases below are browser-only.
         * If you're running on a non-browser environment, these cases will be of no use.
         */
        if (utils_js_1.isBrowser) {
            // File is a Blob
            if ((0, utils_js_1.isBlob)(file)) {
                const data = yield (0, utils_js_1.loadFromFile)(file);
                return { data };
            }
        }
        // At this point, file must be an object
        (0, tiny_invariant_1.default)(typeof file === 'object', 'Invalid parameter in file, need either Uint8Array, string or a parameter object');
        (0, tiny_invariant_1.default)(isParameterObject(file), 'Invalid parameter object: need either .data, .range or .url');
        // File .url is a string
        if ('url' in file && typeof file.url === 'string') {
            if ((0, utils_js_1.isDataURI)(file.url)) {
                const { url } = file, otherParams = __rest(file, ["url"]);
                const fileByteString = (0, utils_js_1.dataURItoByteString)(url);
                return Object.assign({ data: fileByteString }, otherParams);
            }
            (0, utils_js_1.displayCORSWarning)();
        }
        return file;
    }), [file]);
    (0, react_1.useEffect)(() => {
        const cancellable = (0, make_cancellable_promise_1.default)(findDocumentSource());
        cancellable.promise
            .then((nextSource) => {
            sourceDispatch({ type: 'RESOLVE', value: nextSource });
        })
            .catch((error) => {
            sourceDispatch({ type: 'REJECT', error });
        });
        return () => {
            (0, utils_js_1.cancelRunningTask)(cancellable);
        };
    }, [findDocumentSource, sourceDispatch]);
    (0, react_1.useEffect)(() => {
        if (typeof source === 'undefined') {
            return;
        }
        if (source === false) {
            onSourceError();
            return;
        }
        onSourceSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source]);
    /**
     * Called when a document is read successfully
     */
    function onLoadSuccess() {
        if (!pdf) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        if (onLoadSuccessProps) {
            onLoadSuccessProps(pdf);
        }
        pages.current = new Array(pdf.numPages);
        linkService.current.setDocument(pdf);
    }
    /**
     * Called when a document failed to read successfully
     */
    function onLoadError() {
        if (!pdfError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        (0, warning_1.default)(false, pdfError.toString());
        if (onLoadErrorProps) {
            onLoadErrorProps(pdfError);
        }
    }
    function resetDocument() {
        pdfDispatch({ type: 'RESET' });
    }
    (0, react_1.useEffect)(resetDocument, [pdfDispatch, source]);
    function loadDocument() {
        if (!source) {
            return;
        }
        const documentInitParams = options
            ? Object.assign(Object.assign({}, source), options) : source;
        const destroyable = pdfjs_js_1.default.getDocument(documentInitParams);
        if (onLoadProgress) {
            destroyable.onProgress = onLoadProgress;
        }
        if (onPassword) {
            destroyable.onPassword = onPassword;
        }
        const loadingTask = destroyable;
        loadingTask.promise
            .then((nextPdf) => {
            pdfDispatch({ type: 'RESOLVE', value: nextPdf });
        })
            .catch((error) => {
            if (loadingTask.destroyed) {
                return;
            }
            pdfDispatch({ type: 'REJECT', error });
        });
        return () => {
            loadingTask.destroy();
        };
    }
    (0, react_1.useEffect)(loadDocument, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, pdfDispatch, source]);
    (0, react_1.useEffect)(() => {
        if (typeof pdf === 'undefined') {
            return;
        }
        if (pdf === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pdf]);
    function setupLinkService() {
        linkService.current.setViewer(viewer.current);
        linkService.current.setExternalLinkRel(externalLinkRel);
        linkService.current.setExternalLinkTarget(externalLinkTarget);
    }
    (0, react_1.useEffect)(setupLinkService, [externalLinkRel, externalLinkTarget]);
    function registerPage(pageIndex, ref) {
        pages.current[pageIndex] = ref;
    }
    function unregisterPage(pageIndex) {
        delete pages.current[pageIndex];
    }
    const childContext = (0, react_1.useMemo)(() => ({
        imageResourcesPath,
        linkService: linkService.current,
        onItemClick,
        pdf,
        registerPage,
        renderMode,
        rotate,
        unregisterPage,
    }), [imageResourcesPath, onItemClick, pdf, renderMode, rotate]);
    const eventProps = (0, react_1.useMemo)(() => (0, make_event_props_1.default)(otherProps, () => pdf), [otherProps, pdf]);
    function renderChildren() {
        return react_1.default.createElement(DocumentContext_js_1.default.Provider, { value: childContext }, children);
    }
    function renderContent() {
        if (!file) {
            return react_1.default.createElement(Message_js_1.default, { type: "no-data" }, typeof noData === 'function' ? noData() : noData);
        }
        if (pdf === undefined || pdf === null) {
            return (react_1.default.createElement(Message_js_1.default, { type: "loading" }, typeof loading === 'function' ? loading() : loading));
        }
        if (pdf === false) {
            return react_1.default.createElement(Message_js_1.default, { type: "error" }, typeof error === 'function' ? error() : error);
        }
        return renderChildren();
    }
    return (react_1.default.createElement("div", Object.assign({ className: (0, clsx_1.default)('react-pdf__Document', className), ref: inputRef, style: {
            ['--scale-factor']: '1',
        } }, eventProps), renderContent()));
});
const isFunctionOrNode = prop_types_1.default.oneOfType([prop_types_1.default.func, prop_types_1.default.node]);
Document.propTypes = Object.assign(Object.assign({}, propTypes_js_1.eventProps), { children: prop_types_1.default.node, className: propTypes_js_1.isClassName, error: isFunctionOrNode, externalLinkRel: prop_types_1.default.string, externalLinkTarget: prop_types_1.default.oneOf(['_self', '_blank', '_parent', '_top']), file: propTypes_js_1.isFile, imageResourcesPath: prop_types_1.default.string, inputRef: propTypes_js_1.isRef, loading: isFunctionOrNode, noData: isFunctionOrNode, onItemClick: prop_types_1.default.func, onLoadError: prop_types_1.default.func, onLoadProgress: prop_types_1.default.func, onLoadSuccess: prop_types_1.default.func, onPassword: prop_types_1.default.func, onSourceError: prop_types_1.default.func, onSourceSuccess: prop_types_1.default.func, options: prop_types_1.default.shape({
        canvasFactory: prop_types_1.default.any,
        canvasMaxAreaInBytes: prop_types_1.default.number,
        cMapPacked: prop_types_1.default.bool,
        CMapReaderFactory: prop_types_1.default.any,
        cMapUrl: prop_types_1.default.string,
        disableAutoFetch: prop_types_1.default.bool,
        disableFontFace: prop_types_1.default.bool,
        disableRange: prop_types_1.default.bool,
        disableStream: prop_types_1.default.bool,
        docBaseUrl: prop_types_1.default.string,
        enableXfa: prop_types_1.default.bool,
        filterFactory: prop_types_1.default.any,
        fontExtraProperties: prop_types_1.default.bool,
        httpHeaders: prop_types_1.default.object,
        isEvalSupported: prop_types_1.default.bool,
        isOffscreenCanvasSupported: prop_types_1.default.bool,
        length: prop_types_1.default.number,
        maxImageSize: prop_types_1.default.number,
        ownerDocument: prop_types_1.default.any,
        password: prop_types_1.default.string,
        pdfBug: prop_types_1.default.bool,
        rangeChunkSize: prop_types_1.default.number,
        StandardFontDataFactory: prop_types_1.default.any,
        standardFontDataUrl: prop_types_1.default.string,
        stopAtErrors: prop_types_1.default.bool,
        useSystemFonts: prop_types_1.default.bool,
        useWorkerFetch: prop_types_1.default.bool,
        verbosity: prop_types_1.default.number,
        withCredentials: prop_types_1.default.bool,
        worker: prop_types_1.default.any,
    }), rotate: prop_types_1.default.number });
exports.default = Document;
