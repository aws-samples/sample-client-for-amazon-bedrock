"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeListChatModel = void 0;
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "chat_models/fake",
    newEntrypointName: "utils/testing",
    newPackageName: "@langchain/core",
});
var testing_1 = require("@langchain/core/utils/testing");
Object.defineProperty(exports, "FakeListChatModel", { enumerable: true, get: function () { return testing_1.FakeListChatModel; } });
