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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const structTreeUtils_js_1 = require("./shared/structTreeUtils.js");
function StructTreeItem({ className, node }) {
    const attributes = (0, react_1.useMemo)(() => (0, structTreeUtils_js_1.getAttributes)(node), [node]);
    const children = (0, react_1.useMemo)(() => {
        if (!(0, structTreeUtils_js_1.isStructTreeNode)(node)) {
            return null;
        }
        if ((0, structTreeUtils_js_1.isStructTreeNodeWithOnlyContentChild)(node)) {
            return null;
        }
        return node.children.map((child, index) => {
            return (
            // eslint-disable-next-line react/no-array-index-key
            react_1.default.createElement(StructTreeItem, { key: index, node: child }));
        });
    }, [node]);
    return (react_1.default.createElement("span", Object.assign({ className: className }, attributes), children));
}
exports.default = StructTreeItem;
