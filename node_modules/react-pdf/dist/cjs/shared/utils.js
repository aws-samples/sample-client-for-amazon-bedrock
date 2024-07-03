"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFromFile = exports.isCancelException = exports.makePageCallback = exports.cancelRunningTask = exports.displayWorkerWarning = exports.displayCORSWarning = exports.getDevicePixelRatio = exports.dataURItoByteString = exports.isDataURI = exports.isBlob = exports.isArrayBuffer = exports.isString = exports.isProvided = exports.isDefined = exports.isLocalFileSystem = exports.isBrowser = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const warning_1 = __importDefault(require("warning"));
/**
 * Checks if we're running in a browser environment.
 */
exports.isBrowser = typeof document !== 'undefined';
/**
 * Checks whether we're running from a local file system.
 */
exports.isLocalFileSystem = exports.isBrowser && window.location.protocol === 'file:';
/**
 * Checks whether a variable is defined.
 *
 * @param {*} variable Variable to check
 */
function isDefined(variable) {
    return typeof variable !== 'undefined';
}
exports.isDefined = isDefined;
/**
 * Checks whether a variable is defined and not null.
 *
 * @param {*} variable Variable to check
 */
function isProvided(variable) {
    return isDefined(variable) && variable !== null;
}
exports.isProvided = isProvided;
/**
 * Checks whether a variable provided is a string.
 *
 * @param {*} variable Variable to check
 */
function isString(variable) {
    return typeof variable === 'string';
}
exports.isString = isString;
/**
 * Checks whether a variable provided is an ArrayBuffer.
 *
 * @param {*} variable Variable to check
 */
function isArrayBuffer(variable) {
    return variable instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;
/**
 * Checks whether a variable provided is a Blob.
 *
 * @param {*} variable Variable to check
 */
function isBlob(variable) {
    (0, tiny_invariant_1.default)(exports.isBrowser, 'isBlob can only be used in a browser environment');
    return variable instanceof Blob;
}
exports.isBlob = isBlob;
/**
 * Checks whether a variable provided is a data URI.
 *
 * @param {*} variable String to check
 */
function isDataURI(variable) {
    return isString(variable) && /^data:/.test(variable);
}
exports.isDataURI = isDataURI;
function dataURItoByteString(dataURI) {
    (0, tiny_invariant_1.default)(isDataURI(dataURI), 'Invalid data URI.');
    const [headersString = '', dataString = ''] = dataURI.split(',');
    const headers = headersString.split(';');
    if (headers.indexOf('base64') !== -1) {
        return atob(dataString);
    }
    return unescape(dataString);
}
exports.dataURItoByteString = dataURItoByteString;
function getDevicePixelRatio() {
    return (exports.isBrowser && window.devicePixelRatio) || 1;
}
exports.getDevicePixelRatio = getDevicePixelRatio;
const allowFileAccessFromFilesTip = 'On Chromium based browsers, you can use --allow-file-access-from-files flag for debugging purposes.';
function displayCORSWarning() {
    (0, warning_1.default)(!exports.isLocalFileSystem, `Loading PDF as base64 strings/URLs may not work on protocols other than HTTP/HTTPS. ${allowFileAccessFromFilesTip}`);
}
exports.displayCORSWarning = displayCORSWarning;
function displayWorkerWarning() {
    (0, warning_1.default)(!exports.isLocalFileSystem, `Loading PDF.js worker may not work on protocols other than HTTP/HTTPS. ${allowFileAccessFromFilesTip}`);
}
exports.displayWorkerWarning = displayWorkerWarning;
function cancelRunningTask(runningTask) {
    if (runningTask && runningTask.cancel)
        runningTask.cancel();
}
exports.cancelRunningTask = cancelRunningTask;
function makePageCallback(page, scale) {
    Object.defineProperty(page, 'width', {
        get() {
            return this.view[2] * scale;
        },
        configurable: true,
    });
    Object.defineProperty(page, 'height', {
        get() {
            return this.view[3] * scale;
        },
        configurable: true,
    });
    Object.defineProperty(page, 'originalWidth', {
        get() {
            return this.view[2];
        },
        configurable: true,
    });
    Object.defineProperty(page, 'originalHeight', {
        get() {
            return this.view[3];
        },
        configurable: true,
    });
    return page;
}
exports.makePageCallback = makePageCallback;
function isCancelException(error) {
    return error.name === 'RenderingCancelledException';
}
exports.isCancelException = isCancelException;
function loadFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (!reader.result) {
                return reject(new Error('Error while reading a file.'));
            }
            resolve(reader.result);
        };
        reader.onerror = (event) => {
            if (!event.target) {
                return reject(new Error('Error while reading a file.'));
            }
            const { error } = event.target;
            if (!error) {
                return reject(new Error('Error while reading a file.'));
            }
            switch (error.code) {
                case error.NOT_FOUND_ERR:
                    return reject(new Error('Error while reading a file: File not found.'));
                case error.SECURITY_ERR:
                    return reject(new Error('Error while reading a file: Security error.'));
                case error.ABORT_ERR:
                    return reject(new Error('Error while reading a file: Aborted.'));
                default:
                    return reject(new Error('Error while reading a file.'));
            }
        };
        reader.readAsArrayBuffer(file);
    });
}
exports.loadFromFile = loadFromFile;
