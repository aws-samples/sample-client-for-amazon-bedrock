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
const merge_refs_1 = __importDefault(require("merge-refs"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
const pdfjs_js_1 = __importDefault(require("../pdfjs.js"));
const StructTree_js_1 = __importDefault(require("../StructTree.js"));
const usePageContext_js_1 = __importDefault(require("../shared/hooks/usePageContext.js"));
const utils_js_1 = require("../shared/utils.js");
const ANNOTATION_MODE = pdfjs_js_1.default.AnnotationMode;
function PageCanvas(props) {
    const pageContext = (0, usePageContext_js_1.default)();
    (0, tiny_invariant_1.default)(pageContext, 'Unable to find Page context.');
    const mergedProps = Object.assign(Object.assign({}, pageContext), props);
    const { _className, canvasBackground, devicePixelRatio = (0, utils_js_1.getDevicePixelRatio)(), onRenderError: onRenderErrorProps, onRenderSuccess: onRenderSuccessProps, page, renderForms, renderTextLayer, rotate, scale, } = mergedProps;
    const { canvasRef } = props;
    (0, tiny_invariant_1.default)(page, 'Attempted to render page canvas, but no page was specified.');
    const canvasElement = (0, react_1.useRef)(null);
    /**
     * Called when a page is rendered successfully.
     */
    function onRenderSuccess() {
        if (!page) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        if (onRenderSuccessProps) {
            onRenderSuccessProps((0, utils_js_1.makePageCallback)(page, scale));
        }
    }
    /**
     * Called when a page fails to render.
     */
    function onRenderError(error) {
        if ((0, utils_js_1.isCancelException)(error)) {
            return;
        }
        (0, warning_1.default)(false, error.toString());
        if (onRenderErrorProps) {
            onRenderErrorProps(error);
        }
    }
    const renderViewport = (0, react_1.useMemo)(() => page.getViewport({ scale: scale * devicePixelRatio, rotation: rotate }), [devicePixelRatio, page, rotate, scale]);
    const viewport = (0, react_1.useMemo)(() => page.getViewport({ scale, rotation: rotate }), [page, rotate, scale]);
    function drawPageOnCanvas() {
        if (!page) {
            return;
        }
        // Ensures the canvas will be re-rendered from scratch. Otherwise all form data will stay.
        page.cleanup();
        const { current: canvas } = canvasElement;
        if (!canvas) {
            return;
        }
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.visibility = 'hidden';
        const renderContext = {
            annotationMode: renderForms ? ANNOTATION_MODE.ENABLE_FORMS : ANNOTATION_MODE.ENABLE,
            canvasContext: canvas.getContext('2d', { alpha: false }),
            viewport: renderViewport,
        };
        if (canvasBackground) {
            renderContext.background = canvasBackground;
        }
        const cancellable = page.render(renderContext);
        const runningTask = cancellable;
        cancellable.promise
            .then(() => {
            canvas.style.visibility = '';
            onRenderSuccess();
        })
            .catch(onRenderError);
        return () => (0, utils_js_1.cancelRunningTask)(runningTask);
    }
    (0, react_1.useEffect)(drawPageOnCanvas, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        canvasBackground,
        canvasElement,
        devicePixelRatio,
        page,
        renderForms,
        renderViewport,
        viewport,
    ]);
    const cleanup = (0, react_1.useCallback)(() => {
        const { current: canvas } = canvasElement;
        /**
         * Zeroing the width and height cause most browsers to release graphics
         * resources immediately, which can greatly reduce memory consumption.
         */
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
        }
    }, [canvasElement]);
    (0, react_1.useEffect)(() => cleanup, [cleanup]);
    return (react_1.default.createElement("canvas", { className: `${_className}__canvas`, dir: "ltr", ref: (0, merge_refs_1.default)(canvasRef, canvasElement), style: {
            display: 'block',
            userSelect: 'none',
        } }, renderTextLayer ? react_1.default.createElement(StructTree_js_1.default, null) : null));
}
exports.default = PageCanvas;
