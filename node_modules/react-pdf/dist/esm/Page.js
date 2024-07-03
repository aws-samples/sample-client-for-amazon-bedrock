'use client';
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
import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import makeCancellable from 'make-cancellable-promise';
import makeEventProps from 'make-event-props';
import clsx from 'clsx';
import mergeRefs from 'merge-refs';
import invariant from 'tiny-invariant';
import warning from 'warning';
import PageContext from './PageContext.js';
import Message from './Message.js';
import PageCanvas from './Page/PageCanvas.js';
import PageSVG from './Page/PageSVG.js';
import TextLayer from './Page/TextLayer.js';
import AnnotationLayer from './Page/AnnotationLayer.js';
import { cancelRunningTask, isProvided, makePageCallback } from './shared/utils.js';
import useDocumentContext from './shared/hooks/useDocumentContext.js';
import useResolver from './shared/hooks/useResolver.js';
import { eventProps, isClassName, isPageIndex, isPageNumber, isPdf, isRef, isRenderMode, isRotate, } from './shared/propTypes.js';
const defaultScale = 1;
/**
 * Displays a page.
 *
 * Should be placed inside `<Document />`. Alternatively, it can have `pdf` prop passed, which can be obtained from `<Document />`'s `onLoadSuccess` callback function, however some advanced functions like linking between pages inside a document may not be working correctly.
 */
const Page = function Page(props) {
    const documentContext = useDocumentContext();
    const mergedProps = Object.assign(Object.assign({}, documentContext), props);
    const { _className = 'react-pdf__Page', _enableRegisterUnregisterPage = true, canvasBackground, canvasRef, children, className, customRenderer: CustomRenderer, customTextRenderer, devicePixelRatio, error = 'Failed to load the page.', height, inputRef, loading = 'Loading page…', noData = 'No page specified.', onGetAnnotationsError: onGetAnnotationsErrorProps, onGetAnnotationsSuccess: onGetAnnotationsSuccessProps, onGetStructTreeError: onGetStructTreeErrorProps, onGetStructTreeSuccess: onGetStructTreeSuccessProps, onGetTextError: onGetTextErrorProps, onGetTextSuccess: onGetTextSuccessProps, onLoadError: onLoadErrorProps, onLoadSuccess: onLoadSuccessProps, onRenderAnnotationLayerError: onRenderAnnotationLayerErrorProps, onRenderAnnotationLayerSuccess: onRenderAnnotationLayerSuccessProps, onRenderError: onRenderErrorProps, onRenderSuccess: onRenderSuccessProps, onRenderTextLayerError: onRenderTextLayerErrorProps, onRenderTextLayerSuccess: onRenderTextLayerSuccessProps, pageIndex: pageIndexProps, pageNumber: pageNumberProps, pdf, registerPage, renderAnnotationLayer: renderAnnotationLayerProps = true, renderForms = false, renderMode = 'canvas', renderTextLayer: renderTextLayerProps = true, rotate: rotateProps, scale: scaleProps = defaultScale, unregisterPage, width } = mergedProps, otherProps = __rest(mergedProps, ["_className", "_enableRegisterUnregisterPage", "canvasBackground", "canvasRef", "children", "className", "customRenderer", "customTextRenderer", "devicePixelRatio", "error", "height", "inputRef", "loading", "noData", "onGetAnnotationsError", "onGetAnnotationsSuccess", "onGetStructTreeError", "onGetStructTreeSuccess", "onGetTextError", "onGetTextSuccess", "onLoadError", "onLoadSuccess", "onRenderAnnotationLayerError", "onRenderAnnotationLayerSuccess", "onRenderError", "onRenderSuccess", "onRenderTextLayerError", "onRenderTextLayerSuccess", "pageIndex", "pageNumber", "pdf", "registerPage", "renderAnnotationLayer", "renderForms", "renderMode", "renderTextLayer", "rotate", "scale", "unregisterPage", "width"]);
    const [pageState, pageDispatch] = useResolver();
    const { value: page, error: pageError } = pageState;
    const pageElement = useRef(null);
    invariant(pdf, 'Attempted to load a page, but no document was specified. Wrap <Page /> in a <Document /> or pass explicit `pdf` prop.');
    const pageIndex = isProvided(pageNumberProps) ? pageNumberProps - 1 : pageIndexProps !== null && pageIndexProps !== void 0 ? pageIndexProps : null;
    const pageNumber = pageNumberProps !== null && pageNumberProps !== void 0 ? pageNumberProps : (isProvided(pageIndexProps) ? pageIndexProps + 1 : null);
    const rotate = rotateProps !== null && rotateProps !== void 0 ? rotateProps : (page ? page.rotate : null);
    const scale = useMemo(() => {
        if (!page) {
            return null;
        }
        // Be default, we'll render page at 100% * scale width.
        let pageScale = 1;
        // Passing scale explicitly null would cause the page not to render
        const scaleWithDefault = scaleProps !== null && scaleProps !== void 0 ? scaleProps : defaultScale;
        // If width/height is defined, calculate the scale of the page so it could be of desired width.
        if (width || height) {
            const viewport = page.getViewport({ scale: 1, rotation: rotate });
            if (width) {
                pageScale = width / viewport.width;
            }
            else if (height) {
                pageScale = height / viewport.height;
            }
        }
        return scaleWithDefault * pageScale;
    }, [height, page, rotate, scaleProps, width]);
    function hook() {
        return () => {
            if (!isProvided(pageIndex)) {
                // Impossible, but TypeScript doesn't know that
                return;
            }
            if (_enableRegisterUnregisterPage && unregisterPage) {
                unregisterPage(pageIndex);
            }
        };
    }
    useEffect(hook, [_enableRegisterUnregisterPage, pdf, pageIndex, unregisterPage]);
    /**
     * Called when a page is loaded successfully
     */
    function onLoadSuccess() {
        if (onLoadSuccessProps) {
            if (!page || !scale) {
                // Impossible, but TypeScript doesn't know that
                return;
            }
            onLoadSuccessProps(makePageCallback(page, scale));
        }
        if (_enableRegisterUnregisterPage && registerPage) {
            if (!isProvided(pageIndex) || !pageElement.current) {
                // Impossible, but TypeScript doesn't know that
                return;
            }
            registerPage(pageIndex, pageElement.current);
        }
    }
    /**
     * Called when a page failed to load
     */
    function onLoadError() {
        if (!pageError) {
            // Impossible, but TypeScript doesn't know that
            return;
        }
        warning(false, pageError.toString());
        if (onLoadErrorProps) {
            onLoadErrorProps(pageError);
        }
    }
    function resetPage() {
        pageDispatch({ type: 'RESET' });
    }
    useEffect(resetPage, [pageDispatch, pdf, pageIndex]);
    function loadPage() {
        if (!pdf || !pageNumber) {
            return;
        }
        const cancellable = makeCancellable(pdf.getPage(pageNumber));
        const runningTask = cancellable;
        cancellable.promise
            .then((nextPage) => {
            pageDispatch({ type: 'RESOLVE', value: nextPage });
        })
            .catch((error) => {
            pageDispatch({ type: 'REJECT', error });
        });
        return () => cancelRunningTask(runningTask);
    }
    useEffect(loadPage, [pageDispatch, pdf, pageIndex, pageNumber, registerPage]);
    useEffect(() => {
        if (page === undefined) {
            return;
        }
        if (page === false) {
            onLoadError();
            return;
        }
        onLoadSuccess();
    }, 
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, scale]);
    const childContext = useMemo(() => 
    // Technically there cannot be page without pageIndex, pageNumber, rotate and scale, but TypeScript doesn't know that
    page && isProvided(pageIndex) && pageNumber && isProvided(rotate) && isProvided(scale)
        ? {
            _className,
            canvasBackground,
            customTextRenderer,
            devicePixelRatio,
            onGetAnnotationsError: onGetAnnotationsErrorProps,
            onGetAnnotationsSuccess: onGetAnnotationsSuccessProps,
            onGetStructTreeError: onGetStructTreeErrorProps,
            onGetStructTreeSuccess: onGetStructTreeSuccessProps,
            onGetTextError: onGetTextErrorProps,
            onGetTextSuccess: onGetTextSuccessProps,
            onRenderAnnotationLayerError: onRenderAnnotationLayerErrorProps,
            onRenderAnnotationLayerSuccess: onRenderAnnotationLayerSuccessProps,
            onRenderError: onRenderErrorProps,
            onRenderSuccess: onRenderSuccessProps,
            onRenderTextLayerError: onRenderTextLayerErrorProps,
            onRenderTextLayerSuccess: onRenderTextLayerSuccessProps,
            page,
            pageIndex,
            pageNumber,
            renderForms,
            renderTextLayer: renderTextLayerProps,
            rotate,
            scale,
        }
        : null, [
        _className,
        canvasBackground,
        customTextRenderer,
        devicePixelRatio,
        onGetAnnotationsErrorProps,
        onGetAnnotationsSuccessProps,
        onGetStructTreeErrorProps,
        onGetStructTreeSuccessProps,
        onGetTextErrorProps,
        onGetTextSuccessProps,
        onRenderAnnotationLayerErrorProps,
        onRenderAnnotationLayerSuccessProps,
        onRenderErrorProps,
        onRenderSuccessProps,
        onRenderTextLayerErrorProps,
        onRenderTextLayerSuccessProps,
        page,
        pageIndex,
        pageNumber,
        renderForms,
        renderTextLayerProps,
        rotate,
        scale,
    ]);
    const eventProps = useMemo(() => makeEventProps(otherProps, () => page ? (scale ? makePageCallback(page, scale) : undefined) : page), [otherProps, page, scale]);
    const pageKey = `${pageIndex}@${scale}/${rotate}`;
    const pageKeyNoScale = `${pageIndex}/${rotate}`;
    function renderMainLayer() {
        switch (renderMode) {
            case 'custom': {
                invariant(CustomRenderer, `renderMode was set to "custom", but no customRenderer was passed.`);
                return React.createElement(CustomRenderer, { key: `${pageKey}_custom` });
            }
            case 'none':
                return null;
            case 'svg':
                return React.createElement(PageSVG, { key: `${pageKeyNoScale}_svg` });
            case 'canvas':
            default:
                return React.createElement(PageCanvas, { key: `${pageKey}_canvas`, canvasRef: canvasRef });
        }
    }
    function renderTextLayer() {
        if (!renderTextLayerProps) {
            return null;
        }
        return React.createElement(TextLayer, { key: `${pageKey}_text` });
    }
    function renderAnnotationLayer() {
        if (!renderAnnotationLayerProps) {
            return null;
        }
        /**
         * As of now, PDF.js 2.0.943 returns warnings on unimplemented annotations in SVG mode.
         * Therefore, as a fallback, we render "traditional" AnnotationLayer component.
         */
        return React.createElement(AnnotationLayer, { key: `${pageKey}_annotations` });
    }
    function renderChildren() {
        return (React.createElement(PageContext.Provider, { value: childContext },
            renderMainLayer(),
            renderTextLayer(),
            renderAnnotationLayer(),
            children));
    }
    function renderContent() {
        if (!pageNumber) {
            return React.createElement(Message, { type: "no-data" }, typeof noData === 'function' ? noData() : noData);
        }
        if (pdf === null || page === undefined || page === null) {
            return (React.createElement(Message, { type: "loading" }, typeof loading === 'function' ? loading() : loading));
        }
        if (pdf === false || page === false) {
            return React.createElement(Message, { type: "error" }, typeof error === 'function' ? error() : error);
        }
        return renderChildren();
    }
    return (React.createElement("div", Object.assign({ className: clsx(_className, className), "data-page-number": pageNumber, ref: mergeRefs(inputRef, pageElement), style: {
            ['--scale-factor']: `${scale}`,
            backgroundColor: canvasBackground || 'white',
            position: 'relative',
            minWidth: 'min-content',
            minHeight: 'min-content',
        } }, eventProps), renderContent()));
};
const isFunctionOrNode = PropTypes.oneOfType([PropTypes.func, PropTypes.node]);
Page.propTypes = Object.assign(Object.assign({}, eventProps), { canvasBackground: PropTypes.string, canvasRef: isRef, children: PropTypes.node, className: isClassName, customRenderer: PropTypes.func, customTextRenderer: PropTypes.func, devicePixelRatio: PropTypes.number, error: isFunctionOrNode, height: PropTypes.number, imageResourcesPath: PropTypes.string, inputRef: isRef, loading: isFunctionOrNode, noData: isFunctionOrNode, onGetTextError: PropTypes.func, onGetTextSuccess: PropTypes.func, onLoadError: PropTypes.func, onLoadSuccess: PropTypes.func, onRenderError: PropTypes.func, onRenderSuccess: PropTypes.func, onRenderTextLayerError: PropTypes.func, onRenderTextLayerSuccess: PropTypes.func, pageIndex: isPageIndex, pageNumber: isPageNumber, pdf: isPdf, renderAnnotationLayer: PropTypes.bool, renderForms: PropTypes.bool, renderMode: isRenderMode, renderTextLayer: PropTypes.bool, rotate: isRotate, scale: PropTypes.number, width: PropTypes.number });
export default Page;
