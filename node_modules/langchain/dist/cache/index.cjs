"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCache = void 0;
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "cache",
    newEntrypointName: "caches",
    newPackageName: "@langchain/core",
});
var caches_1 = require("@langchain/core/caches");
Object.defineProperty(exports, "InMemoryCache", { enumerable: true, get: function () { return caches_1.InMemoryCache; } });
