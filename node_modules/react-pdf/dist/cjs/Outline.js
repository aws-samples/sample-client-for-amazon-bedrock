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
const make_cancellable_promise_1 = __importDefault(require("make-cancellable-promise"));
const make_event_props_1 = __importDefault(require("make-event-props"));
const clsx_1 = __importDefault(require("clsx"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
const OutlineContext_js_1 = __importDefault(require("./OutlineContext.js"));
const OutlineItem_js_1 = __importDefault(require("./OutlineItem.js"));
const utils_js_1 = require("./shared/utils.js");
const useDocumentContext_js_1 = __importDefault(require("./shared/hooks/useDocumentContext.js"));
const useResolver_js_1 = __importDefault(require("./shared/hooks/useResolver.js"));
const propTypes_js_1 = require("./shared/propTypes.js");
/**
 * Displays an outline (table of contents).
 *
 * Should be placed inside `<Document />`. Alternatively, it can have `pdf` prop passed, which can be obtained from `<Document />`'s `onLoadSuccess` callback function.
 */
const Outline = function Outline(props) {
    const documentContext = (0, useDocumentContext_js_1.default)();
    const mergedProps = Object.assign(Object.assign({}, documentContext), props);
    const { className, inputRef, onItemClick, onLoadError: onLoadErrorProps, onLoadSuccess: onLoadSuccessProps, pdf } = mergedProps, otherProps = __rest(mergedProps, ["className", "inputRef", "onItemClick", "onLoadError", "onLoadSuccess", "pdf"]);
    (0, tiny_invariant_1.default)(pdf, 'Attempted to load an outline, but no document was specified. Wrap <Outline /> in a <Document /> or pass explicit `pdf` prop.');
    const [outlineState, outlineDispatch] = (0, useResolver_js_1.default)();
    const { value: outline, error: outlineError } = outlineState;
    /**
     * Called when an outline is read successfully
     */
    function onLoadSuccess() {
        if (typeof outline === 'undefined' || outline === false) {
            return;
        }
        if (onLoadSuccessProps) {
            onLoadSuccessProps(outline);
        }
    }
    /**
     * Called when an outline failed to read successfully
     */
    function onLoadError() {
        if (!outlineError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        (0, warning_1.default)(false, outlineError.toString());
        if (onLoadErrorProps) {
            onLoadErrorProps(outlineError);
        }
    }
    function resetOutline() {
        outlineDispatch({ type: 'RESET' });
    }
    (0, react_1.useEffect)(resetOutline, [outlineDispatch, pdf]);
    function loadOutline() {
        if (!pdf) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        const cancellable = (0, make_cancellable_promise_1.default)(pdf.getOutline());
        const runningTask = cancellable;
        cancellable.promise
            .then((nextOutline) => {
            outlineDispatch({ type: 'RESOLVE', value: nextOutline });
        })
            .catch((error) => {
            outlineDispatch({ type: 'REJECT', error });
        });
        return () => (0, utils_js_1.cancelRunningTask)(runningTask);
    }
    (0, react_1.useEffect)(loadOutline, [outlineDispatch, pdf]);
    (0, react_1.useEffect)(() => {
        if (outline === undefined) {
            return;
        }
        if (outline === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outline]);
    const childContext = (0, react_1.useMemo)(() => ({
        onItemClick,
    }), [onItemClick]);
    const eventProps = (0, react_1.useMemo)(() => (0, make_event_props_1.default)(otherProps, () => outline), [otherProps, outline]);
    if (!outline) {
        return null;
    }
    function renderOutline() {
        if (!outline) {
            return null;
        }
        return (react_1.default.createElement("ul", null, outline.map((item, itemIndex) => (react_1.default.createElement(OutlineItem_js_1.default, { key: typeof item.dest === 'string' ? item.dest : itemIndex, item: item, pdf: pdf })))));
    }
    return (react_1.default.createElement("div", Object.assign({ className: (0, clsx_1.default)('react-pdf__Outline', className), ref: inputRef }, eventProps),
        react_1.default.createElement(OutlineContext_js_1.default.Provider, { value: childContext }, renderOutline())));
};
Outline.propTypes = Object.assign(Object.assign({}, propTypes_js_1.eventProps), { className: propTypes_js_1.isClassName, inputRef: propTypes_js_1.isRef, onItemClick: prop_types_1.default.func, onLoadError: prop_types_1.default.func, onLoadSuccess: prop_types_1.default.func, pdf: propTypes_js_1.isPdf });
exports.default = Outline;
