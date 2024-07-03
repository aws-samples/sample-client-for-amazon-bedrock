"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelContextSize = exports.calculateMaxTokens = exports.BaseLanguageModel = exports.BaseLangChain = void 0;
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "base_language",
    newEntrypointName: "language_models/base",
    newPackageName: "@langchain/core",
});
var base_1 = require("@langchain/core/language_models/base");
Object.defineProperty(exports, "BaseLangChain", { enumerable: true, get: function () { return base_1.BaseLangChain; } });
Object.defineProperty(exports, "BaseLanguageModel", { enumerable: true, get: function () { return base_1.BaseLanguageModel; } });
/*
 * Export utility functions for token calculations:
 * - calculateMaxTokens: Calculate max tokens for a given model and prompt (the model context size - tokens in prompt).
 * - getModelContextSize: Get the context size for a specific model.
 */
var count_tokens_js_1 = require("./count_tokens.cjs");
Object.defineProperty(exports, "calculateMaxTokens", { enumerable: true, get: function () { return count_tokens_js_1.calculateMaxTokens; } });
Object.defineProperty(exports, "getModelContextSize", { enumerable: true, get: function () { return count_tokens_js_1.getModelContextSize; } });
