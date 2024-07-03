"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bedrock = void 0;
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const web_js_1 = require("./web.cjs");
class Bedrock extends web_js_1.Bedrock {
    static lc_name() {
        return "Bedrock";
    }
    constructor(fields) {
        super({
            ...fields,
            credentials: fields?.credentials ?? (0, credential_provider_node_1.defaultProvider)(),
        });
    }
}
exports.Bedrock = Bedrock;
