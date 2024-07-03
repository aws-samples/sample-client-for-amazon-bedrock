"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddings = void 0;
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "embeddings/openai",
    newEntrypointName: "",
    newPackageName: "@langchain/openai",
});
var openai_1 = require("@langchain/openai");
Object.defineProperty(exports, "OpenAIEmbeddings", { enumerable: true, get: function () { return openai_1.OpenAIEmbeddings; } });
