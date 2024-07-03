"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const utils_js_1 = require("../utils.js");
function useCachedValue(getter) {
    const ref = (0, react_1.useRef)();
    const currentValue = ref.current;
    if ((0, utils_js_1.isDefined)(currentValue)) {
        return () => currentValue;
    }
    return () => {
        const value = getter();
        ref.current = value;
        return value;
    };
}
exports.default = useCachedValue;
