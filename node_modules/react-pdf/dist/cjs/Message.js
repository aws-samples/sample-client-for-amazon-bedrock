"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
function Message({ children, type }) {
    return react_1.default.createElement("div", { className: `react-pdf__message react-pdf__message--${type}` }, children);
}
exports.default = Message;
