"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/generic.ts
var generic_exports = {};
__export(generic_exports, {
  inject: () => inject
});
module.exports = __toCommonJS(generic_exports);

// package.json
var name = "@vercel/analytics";
var version = "0.1.11";

// src/queue.ts
var initQueue = () => {
  if (window.va)
    return;
  window.va = function a(...params) {
    (window.vaq = window.vaq || []).push(params);
  };
};

// src/utils.ts
function isBrowser() {
  return typeof window !== "undefined";
}
function isDevelopment() {
  try {
    const env = process.env.NODE_ENV;
    return env === "development" || env === "test";
  } catch (e) {
    return false;
  }
}
function getMode(mode = "auto") {
  if (mode === "auto") {
    return isDevelopment() ? "development" : "production";
  }
  return mode;
}

// src/generic.ts
var inject = (props = {
  debug: true
}) => {
  var _a;
  if (!isBrowser())
    return;
  const mode = getMode(props.mode);
  initQueue();
  if (props.beforeSend) {
    (_a = window.va) == null ? void 0 : _a.call(window, "beforeSend", props.beforeSend);
  }
  const src = mode === "development" ? "https://cdn.vercel-insights.com/v1/script.debug.js" : "/_vercel/insights/script.js";
  if (document.head.querySelector(`script[src*="${src}"]`))
    return;
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  script.setAttribute("data-sdkn", name);
  script.setAttribute("data-sdkv", version);
  if (mode === "development" && props.debug === false) {
    script.setAttribute("data-debug", "false");
  }
  document.head.appendChild(script);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  inject
});
//# sourceMappingURL=index.cjs.map