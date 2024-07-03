"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGTMEvent = exports.GoogleTagManager = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
// TODO: Evaluate import 'client only'
const react_1 = require("react");
const script_1 = __importDefault(require("next/script"));
let currDataLayerName = undefined;
function GoogleTagManager(props) {
    const { gtmId, dataLayerName = 'dataLayer', auth, preview, dataLayer } = props;
    if (currDataLayerName === undefined) {
        currDataLayerName = dataLayerName;
    }
    const gtmLayer = dataLayerName !== 'dataLayer' ? `$l=${dataLayerName}` : '';
    const gtmAuth = auth ? `&gtm_auth=${auth}` : '';
    const gtmPreview = preview ? `&gtm_preview=${preview}&gtm_cookies_win=x` : '';
    (0, react_1.useEffect)(() => {
        // performance.mark is being used as a feature use signal. While it is traditionally used for performance
        // benchmarking it is low overhead and thus considered safe to use in production and it is a widely available
        // existing API.
        // The performance measurement will be handled by Chrome Aurora
        performance.mark('mark_feature_usage', {
            detail: {
                feature: 'next-third-parties-gtm',
            },
        });
    }, []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(script_1.default, { id: "_next-gtm-init", dangerouslySetInnerHTML: {
                    __html: `
      (function(w,l){
        w[l]=w[l]||[];
        w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
        ${dataLayer ? `w[l].push(${JSON.stringify(dataLayer)})` : ''}
      })(window,'${dataLayerName}');`,
                } }), (0, jsx_runtime_1.jsx)(script_1.default, { id: "_next-gtm", "data-ntpc": "GTM", src: `https://www.googletagmanager.com/gtm.js?id=${gtmId}${gtmLayer}${gtmAuth}${gtmPreview}` })] }));
}
exports.GoogleTagManager = GoogleTagManager;
const sendGTMEvent = (data) => {
    if (currDataLayerName === undefined) {
        console.warn(`@next/third-parties: GTM has not been initialized`);
        return;
    }
    if (window[currDataLayerName]) {
        window[currDataLayerName].push(data);
    }
    else {
        console.warn(`@next/third-parties: GTM dataLayer ${currDataLayerName} does not exist`);
    }
};
exports.sendGTMEvent = sendGTMEvent;
