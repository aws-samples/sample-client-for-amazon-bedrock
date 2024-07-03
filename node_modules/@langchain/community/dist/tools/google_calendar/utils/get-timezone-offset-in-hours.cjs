"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimezoneOffsetInHours = void 0;
const getTimezoneOffsetInHours = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetInHours = -offsetInMinutes / 60;
    return offsetInHours;
};
exports.getTimezoneOffsetInHours = getTimezoneOffsetInHours;
