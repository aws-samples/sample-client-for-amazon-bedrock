"use strict";
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
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
const StructTreeItem_js_1 = __importDefault(require("./StructTreeItem.js"));
const usePageContext_js_1 = __importDefault(require("./shared/hooks/usePageContext.js"));
const useResolver_js_1 = __importDefault(require("./shared/hooks/useResolver.js"));
const utils_js_1 = require("./shared/utils.js");
function StructTree() {
    const pageContext = (0, usePageContext_js_1.default)();
    (0, tiny_invariant_1.default)(pageContext, 'Unable to find Page context.');
    const { onGetStructTreeError: onGetStructTreeErrorProps, onGetStructTreeSuccess: onGetStructTreeSuccessProps, } = pageContext;
    const [structTreeState, structTreeDispatch] = (0, useResolver_js_1.default)();
    const { value: structTree, error: structTreeError } = structTreeState;
    const { customTextRenderer, page } = pageContext;
    function onLoadSuccess() {
        if (!structTree) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        if (onGetStructTreeSuccessProps) {
            onGetStructTreeSuccessProps(structTree);
        }
    }
    function onLoadError() {
        if (!structTreeError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        (0, warning_1.default)(false, structTreeError.toString());
        if (onGetStructTreeErrorProps) {
            onGetStructTreeErrorProps(structTreeError);
        }
    }
    function resetAnnotations() {
        structTreeDispatch({ type: 'RESET' });
    }
    (0, react_1.useEffect)(resetAnnotations, [structTreeDispatch, page]);
    function loadStructTree() {
        if (customTextRenderer) {
            // TODO: Document why this is necessary
            return;
        }
        if (!page) {
            return;
        }
        const cancellable = (0, make_cancellable_promise_1.default)(page.getStructTree());
        const runningTask = cancellable;
        cancellable.promise
            .then((nextStructTree) => {
            structTreeDispatch({ type: 'RESOLVE', value: nextStructTree });
        })
            .catch((error) => {
            structTreeDispatch({ type: 'REJECT', error });
        });
        return () => (0, utils_js_1.cancelRunningTask)(runningTask);
    }
    (0, react_1.useEffect)(loadStructTree, [customTextRenderer, page, structTreeDispatch]);
    (0, react_1.useEffect)(() => {
        if (structTree === undefined) {
            return;
        }
        if (structTree === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structTree]);
    if (!structTree) {
        return null;
    }
    return react_1.default.createElement(StructTreeItem_js_1.default, { className: "react-pdf__Page__structTree structTree", node: structTree });
}
exports.default = StructTree;
