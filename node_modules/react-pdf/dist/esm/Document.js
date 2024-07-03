'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, } from 'react';
import PropTypes from 'prop-types';
import makeEventProps from 'make-event-props';
import makeCancellable from 'make-cancellable-promise';
import clsx from 'clsx';
import invariant from 'tiny-invariant';
import warning from 'warning';
import { dequal } from 'dequal';
import pdfjs from './pdfjs.js';
import DocumentContext from './DocumentContext.js';
import Message from './Message.js';
import LinkService from './LinkService.js';
import PasswordResponses from './PasswordResponses.js';
import { cancelRunningTask, dataURItoByteString, displayCORSWarning, isArrayBuffer, isBlob, isBrowser, isDataURI, loadFromFile, } from './shared/utils.js';
import useResolver from './shared/hooks/useResolver.js';
import { eventProps, isClassName, isFile, isRef } from './shared/propTypes.js';
const { PDFDataRangeTransport } = pdfjs;
const defaultOnPassword = (callback, reason) => {
    switch (reason) {
        case PasswordResponses.NEED_PASSWORD: {
            // eslint-disable-next-line no-alert
            const password = prompt('Enter the password to open this PDF file.');
            callback(password);
            break;
        }
        case PasswordResponses.INCORRECT_PASSWORD: {
            // eslint-disable-next-line no-alert
            const password = prompt('Invalid password. Please try again.');
            callback(password);
            break;
        }
        default:
    }
};
function isParameterObject(file) {
    return (typeof file === 'object' &&
        file !== null &&
        ('data' in file || 'range' in file || 'url' in file));
}
/**
 * Loads a document passed using `file` prop.
 */
const Document = forwardRef(function Document(_a, ref) {
    var { children, className, error = 'Failed to load PDF file.', externalLinkRel, externalLinkTarget, file, inputRef, imageResourcesPath, loading = 'Loading PDF…', noData = 'No PDF file specified.', onItemClick, onLoadError: onLoadErrorProps, onLoadProgress, onLoadSuccess: onLoadSuccessProps, onPassword = defaultOnPassword, onSourceError: onSourceErrorProps, onSourceSuccess: onSourceSuccessProps, options, renderMode, rotate } = _a, otherProps = __rest(_a, ["children", "className", "error", "externalLinkRel", "externalLinkTarget", "file", "inputRef", "imageResourcesPath", "loading", "noData", "onItemClick", "onLoadError", "onLoadProgress", "onLoadSuccess", "onPassword", "onSourceError", "onSourceSuccess", "options", "renderMode", "rotate"]);
    const [sourceState, sourceDispatch] = useResolver();
    const { value: source, error: sourceError } = sourceState;
    const [pdfState, pdfDispatch] = useResolver();
    const { value: pdf, error: pdfError } = pdfState;
    const linkService = useRef(new LinkService());
    const pages = useRef([]);
    const prevFile = useRef();
    const prevOptions = useRef();
    useEffect(() => {
        if (file && file !== prevFile.current && isParameterObject(file)) {
            warning(!dequal(file, prevFile.current), `File prop passed to <Document /> changed, but it's equal to previous one. This might result in unnecessary reloads. Consider memoizing the value passed to "file" prop.`);
            prevFile.current = file;
        }
    }, [file]);
    // Detect non-memoized changes in options prop
    useEffect(() => {
        if (options && options !== prevOptions.current) {
            warning(!dequal(options, prevOptions.current), `Options prop passed to <Document /> changed, but it's equal to previous one. This might result in unnecessary reloads. Consider memoizing the value passed to "options" prop.`);
            prevOptions.current = options;
        }
    }, [options]);
    const viewer = useRef({
        // Handling jumping to internal links target
        scrollPageIntoView: (args) => {
            const { dest, pageNumber, pageIndex = pageNumber - 1 } = args;
            // First, check if custom handling of onItemClick was provided
            if (onItemClick) {
                onItemClick({ dest, pageIndex, pageNumber });
                return;
            }
            // If not, try to look for target page within the <Document>.
            const page = pages.current[pageIndex];
            if (page) {
                // Scroll to the page automatically
                page.scrollIntoView();
                return;
            }
            warning(false, `An internal link leading to page ${pageNumber} was clicked, but neither <Document> was provided with onItemClick nor it was able to find the page within itself. Either provide onItemClick to <Document> and handle navigating by yourself or ensure that all pages are rendered within <Document>.`);
        },
    });
    useImperativeHandle(ref, () => ({
        linkService,
        pages,
        viewer,
    }), []);
    /**
     * Called when a document source is resolved correctly
     */
    function onSourceSuccess() {
        if (onSourceSuccessProps) {
            onSourceSuccessProps();
        }
    }
    /**
     * Called when a document source failed to be resolved correctly
     */
    function onSourceError() {
        if (!sourceError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        warning(false, sourceError.toString());
        if (onSourceErrorProps) {
            onSourceErrorProps(sourceError);
        }
    }
    function resetSource() {
        sourceDispatch({ type: 'RESET' });
    }
    useEffect(resetSource, [file, sourceDispatch]);
    const findDocumentSource = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (!file) {
            return null;
        }
        // File is a string
        if (typeof file === 'string') {
            if (isDataURI(file)) {
                const fileByteString = dataURItoByteString(file);
                return { data: fileByteString };
            }
            displayCORSWarning();
            return { url: file };
        }
        // File is PDFDataRangeTransport
        if (file instanceof PDFDataRangeTransport) {
            return { range: file };
        }
        // File is an ArrayBuffer
        if (isArrayBuffer(file)) {
            return { data: file };
        }
        /**
         * The cases below are browser-only.
         * If you're running on a non-browser environment, these cases will be of no use.
         */
        if (isBrowser) {
            // File is a Blob
            if (isBlob(file)) {
                const data = yield loadFromFile(file);
                return { data };
            }
        }
        // At this point, file must be an object
        invariant(typeof file === 'object', 'Invalid parameter in file, need either Uint8Array, string or a parameter object');
        invariant(isParameterObject(file), 'Invalid parameter object: need either .data, .range or .url');
        // File .url is a string
        if ('url' in file && typeof file.url === 'string') {
            if (isDataURI(file.url)) {
                const { url } = file, otherParams = __rest(file, ["url"]);
                const fileByteString = dataURItoByteString(url);
                return Object.assign({ data: fileByteString }, otherParams);
            }
            displayCORSWarning();
        }
        return file;
    }), [file]);
    useEffect(() => {
        const cancellable = makeCancellable(findDocumentSource());
        cancellable.promise
            .then((nextSource) => {
            sourceDispatch({ type: 'RESOLVE', value: nextSource });
        })
            .catch((error) => {
            sourceDispatch({ type: 'REJECT', error });
        });
        return () => {
            cancelRunningTask(cancellable);
        };
    }, [findDocumentSource, sourceDispatch]);
    useEffect(() => {
        if (typeof source === 'undefined') {
            return;
        }
        if (source === false) {
            onSourceError();
            return;
        }
        onSourceSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source]);
    /**
     * Called when a document is read successfully
     */
    function onLoadSuccess() {
        if (!pdf) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        if (onLoadSuccessProps) {
            onLoadSuccessProps(pdf);
        }
        pages.current = new Array(pdf.numPages);
        linkService.current.setDocument(pdf);
    }
    /**
     * Called when a document failed to read successfully
     */
    function onLoadError() {
        if (!pdfError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        warning(false, pdfError.toString());
        if (onLoadErrorProps) {
            onLoadErrorProps(pdfError);
        }
    }
    function resetDocument() {
        pdfDispatch({ type: 'RESET' });
    }
    useEffect(resetDocument, [pdfDispatch, source]);
    function loadDocument() {
        if (!source) {
            return;
        }
        const documentInitParams = options
            ? Object.assign(Object.assign({}, source), options) : source;
        const destroyable = pdfjs.getDocument(documentInitParams);
        if (onLoadProgress) {
            destroyable.onProgress = onLoadProgress;
        }
        if (onPassword) {
            destroyable.onPassword = onPassword;
        }
        const loadingTask = destroyable;
        loadingTask.promise
            .then((nextPdf) => {
            pdfDispatch({ type: 'RESOLVE', value: nextPdf });
        })
            .catch((error) => {
            if (loadingTask.destroyed) {
                return;
            }
            pdfDispatch({ type: 'REJECT', error });
        });
        return () => {
            loadingTask.destroy();
        };
    }
    useEffect(loadDocument, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, pdfDispatch, source]);
    useEffect(() => {
        if (typeof pdf === 'undefined') {
            return;
        }
        if (pdf === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pdf]);
    function setupLinkService() {
        linkService.current.setViewer(viewer.current);
        linkService.current.setExternalLinkRel(externalLinkRel);
        linkService.current.setExternalLinkTarget(externalLinkTarget);
    }
    useEffect(setupLinkService, [externalLinkRel, externalLinkTarget]);
    function registerPage(pageIndex, ref) {
        pages.current[pageIndex] = ref;
    }
    function unregisterPage(pageIndex) {
        delete pages.current[pageIndex];
    }
    const childContext = useMemo(() => ({
        imageResourcesPath,
        linkService: linkService.current,
        onItemClick,
        pdf,
        registerPage,
        renderMode,
        rotate,
        unregisterPage,
    }), [imageResourcesPath, onItemClick, pdf, renderMode, rotate]);
    const eventProps = useMemo(() => makeEventProps(otherProps, () => pdf), [otherProps, pdf]);
    function renderChildren() {
        return React.createElement(DocumentContext.Provider, { value: childContext }, children);
    }
    function renderContent() {
        if (!file) {
            return React.createElement(Message, { type: "no-data" }, typeof noData === 'function' ? noData() : noData);
        }
        if (pdf === undefined || pdf === null) {
            return (React.createElement(Message, { type: "loading" }, typeof loading === 'function' ? loading() : loading));
        }
        if (pdf === false) {
            return React.createElement(Message, { type: "error" }, typeof error === 'function' ? error() : error);
        }
        return renderChildren();
    }
    return (React.createElement("div", Object.assign({ className: clsx('react-pdf__Document', className), ref: inputRef, style: {
            ['--scale-factor']: '1',
        } }, eventProps), renderContent()));
});
const isFunctionOrNode = PropTypes.oneOfType([PropTypes.func, PropTypes.node]);
Document.propTypes = Object.assign(Object.assign({}, eventProps), { children: PropTypes.node, className: isClassName, error: isFunctionOrNode, externalLinkRel: PropTypes.string, externalLinkTarget: PropTypes.oneOf(['_self', '_blank', '_parent', '_top']), file: isFile, imageResourcesPath: PropTypes.string, inputRef: isRef, loading: isFunctionOrNode, noData: isFunctionOrNode, onItemClick: PropTypes.func, onLoadError: PropTypes.func, onLoadProgress: PropTypes.func, onLoadSuccess: PropTypes.func, onPassword: PropTypes.func, onSourceError: PropTypes.func, onSourceSuccess: PropTypes.func, options: PropTypes.shape({
        canvasFactory: PropTypes.any,
        canvasMaxAreaInBytes: PropTypes.number,
        cMapPacked: PropTypes.bool,
        CMapReaderFactory: PropTypes.any,
        cMapUrl: PropTypes.string,
        disableAutoFetch: PropTypes.bool,
        disableFontFace: PropTypes.bool,
        disableRange: PropTypes.bool,
        disableStream: PropTypes.bool,
        docBaseUrl: PropTypes.string,
        enableXfa: PropTypes.bool,
        filterFactory: PropTypes.any,
        fontExtraProperties: PropTypes.bool,
        httpHeaders: PropTypes.object,
        isEvalSupported: PropTypes.bool,
        isOffscreenCanvasSupported: PropTypes.bool,
        length: PropTypes.number,
        maxImageSize: PropTypes.number,
        ownerDocument: PropTypes.any,
        password: PropTypes.string,
        pdfBug: PropTypes.bool,
        rangeChunkSize: PropTypes.number,
        StandardFontDataFactory: PropTypes.any,
        standardFontDataUrl: PropTypes.string,
        stopAtErrors: PropTypes.bool,
        useSystemFonts: PropTypes.bool,
        useWorkerFetch: PropTypes.bool,
        verbosity: PropTypes.number,
        withCredentials: PropTypes.bool,
        worker: PropTypes.any,
    }), rotate: PropTypes.number });
export default Document;
