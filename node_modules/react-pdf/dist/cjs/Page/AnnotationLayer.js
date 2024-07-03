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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const make_cancellable_promise_1 = __importDefault(require("make-cancellable-promise"));
const clsx_1 = __importDefault(require("clsx"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
const pdfjs_js_1 = __importDefault(require("../pdfjs.js"));
const useDocumentContext_js_1 = __importDefault(require("../shared/hooks/useDocumentContext.js"));
const usePageContext_js_1 = __importDefault(require("../shared/hooks/usePageContext.js"));
const useResolver_js_1 = __importDefault(require("../shared/hooks/useResolver.js"));
const utils_js_1 = require("../shared/utils.js");
function AnnotationLayer() {
    const documentContext = (0, useDocumentContext_js_1.default)();
    const pageContext = (0, usePageContext_js_1.default)();
    (0, tiny_invariant_1.default)(pageContext, 'Unable to find Page context.');
    const mergedProps = Object.assign(Object.assign({}, documentContext), pageContext);
    const { imageResourcesPath, linkService, onGetAnnotationsError: onGetAnnotationsErrorProps, onGetAnnotationsSuccess: onGetAnnotationsSuccessProps, onRenderAnnotationLayerError: onRenderAnnotationLayerErrorProps, onRenderAnnotationLayerSuccess: onRenderAnnotationLayerSuccessProps, page, pdf, renderForms, rotate, scale = 1, } = mergedProps;
    (0, tiny_invariant_1.default)(pdf, 'Attempted to load page annotations, but no document was specified. Wrap <Page /> in a <Document /> or pass explicit `pdf` prop.');
    (0, tiny_invariant_1.default)(page, 'Attempted to load page annotations, but no page was specified.');
    (0, tiny_invariant_1.default)(linkService, 'Attempted to load page annotations, but no linkService was specified.');
    const [annotationsState, annotationsDispatch] = (0, useResolver_js_1.default)();
    const { value: annotations, error: annotationsError } = annotationsState;
    const layerElement = (0, react_1.useRef)(null);
    (0, warning_1.default)(parseInt(window.getComputedStyle(document.body).getPropertyValue('--react-pdf-annotation-layer'), 10) === 1, 'AnnotationLayer styles not found. Read more: https://github.com/wojtekmaj/react-pdf#support-for-annotations');
    function onLoadSuccess() {
        if (!annotations) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        if (onGetAnnotationsSuccessProps) {
            onGetAnnotationsSuccessProps(annotations);
        }
    }
    function onLoadError() {
        if (!annotationsError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        (0, warning_1.default)(false, annotationsError.toString());
        if (onGetAnnotationsErrorProps) {
            onGetAnnotationsErrorProps(annotationsError);
        }
    }
    function resetAnnotations() {
        annotationsDispatch({ type: 'RESET' });
    }
    (0, react_1.useEffect)(resetAnnotations, [annotationsDispatch, page]);
    function loadAnnotations() {
        if (!page) {
            return;
        }
        const cancellable = (0, make_cancellable_promise_1.default)(page.getAnnotations());
        const runningTask = cancellable;
        cancellable.promise
            .then((nextAnnotations) => {
            annotationsDispatch({ type: 'RESOLVE', value: nextAnnotations });
        })
            .catch((error) => {
            annotationsDispatch({ type: 'REJECT', error });
        });
        return () => {
            (0, utils_js_1.cancelRunningTask)(runningTask);
        };
    }
    (0, react_1.useEffect)(loadAnnotations, [annotationsDispatch, page, renderForms]);
    (0, react_1.useEffect)(() => {
        if (annotations === undefined) {
            return;
        }
        if (annotations === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations]);
    function onRenderSuccess() {
        if (onRenderAnnotationLayerSuccessProps) {
            onRenderAnnotationLayerSuccessProps();
        }
    }
    function onRenderError(error) {
        (0, warning_1.default)(false, `${error}`);
        if (onRenderAnnotationLayerErrorProps) {
            onRenderAnnotationLayerErrorProps(error);
        }
    }
    const viewport = (0, react_1.useMemo)(() => page.getViewport({ scale, rotation: rotate }), [page, rotate, scale]);
    function renderAnnotationLayer() {
        if (!pdf || !page || !linkService || !annotations) {
            return;
        }
        const { current: layer } = layerElement;
        if (!layer) {
            return;
        }
        const clonedViewport = viewport.clone({ dontFlip: true });
        const annotationLayerParameters = {
            accessibilityManager: null, // TODO: Implement this
            annotationCanvasMap: null, // TODO: Implement this
            div: layer,
            l10n: null, // TODO: Implement this
            page,
            viewport: clonedViewport,
        };
        const renderParameters = {
            annotations,
            annotationStorage: pdf.annotationStorage,
            div: layer,
            // See https://github.com/mozilla/pdf.js/issues/17029
            downloadManager: null,
            imageResourcesPath,
            linkService,
            page,
            renderForms,
            viewport: clonedViewport,
        };
        layer.innerHTML = '';
        try {
            new pdfjs_js_1.default.AnnotationLayer(annotationLayerParameters).render(renderParameters);
            // Intentional immediate callback
            onRenderSuccess();
        }
        catch (error) {
            onRenderError(error);
        }
        return () => {
            // TODO: Cancel running task?
        };
    }
    (0, react_1.useEffect)(renderAnnotationLayer, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations, imageResourcesPath, linkService, page, renderForms, viewport]);
    return (react_1.default.createElement("div", { className: (0, clsx_1.default)('react-pdf__Page__annotations', 'annotationLayer'), ref: layerElement }));
}
exports.default = AnnotationLayer;
