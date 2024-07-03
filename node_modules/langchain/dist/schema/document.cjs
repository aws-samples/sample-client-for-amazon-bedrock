"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingDocumentTransformer = exports.BaseDocumentTransformer = void 0;
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "schema/document",
    newEntrypointName: "documents",
    newPackageName: "@langchain/core",
});
var documents_1 = require("@langchain/core/documents");
Object.defineProperty(exports, "BaseDocumentTransformer", { enumerable: true, get: function () { return documents_1.BaseDocumentTransformer; } });
Object.defineProperty(exports, "MappingDocumentTransformer", { enumerable: true, get: function () { return documents_1.MappingDocumentTransformer; } });
