"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapePointer = exports.encodePointer = void 0;
function encodePointer(p) {
    return encodeURI(escapePointer(p));
}
exports.encodePointer = encodePointer;
function escapePointer(p) {
    return p.replace(/~/g, "~0").replace(/\//g, "~1");
}
exports.escapePointer = escapePointer;
