"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betaWarning = void 0;
/**
 * Util function for logging a warning when a method is called.
 * @param {string} func The name of the function that is in beta.
 */
function betaWarning(func) {
    console.warn(`The function '${func}' is in beta. It is actively being worked on, so the API may change.`);
}
exports.betaWarning = betaWarning;
