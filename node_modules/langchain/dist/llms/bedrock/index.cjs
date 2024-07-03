"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bedrock = void 0;
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const web_js_1 = require("./web.cjs");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "llms/bedrock",
});
class Bedrock extends web_js_1.Bedrock {
    static lc_name() {
        return "Bedrock";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(fields) {
        super({
            ...fields,
            credentials: fields?.credentials ?? (0, credential_provider_node_1.defaultProvider)(),
        });
    }
}
exports.Bedrock = Bedrock;
