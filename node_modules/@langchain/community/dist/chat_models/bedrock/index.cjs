"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatBedrock = exports.convertMessagesToPrompt = exports.convertMessagesToPromptAnthropic = exports.BedrockChat = void 0;
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const web_js_1 = require("./web.cjs");
/**
 * @example
 * ```typescript
 * const model = new BedrockChat({
 *   model: "anthropic.claude-v2",
 *   region: "us-east-1",
 * });
 * const res = await model.invoke([{ content: "Tell me a joke" }]);
 * console.log(res);
 * ```
 */
class BedrockChat extends web_js_1.BedrockChat {
    static lc_name() {
        return "BedrockChat";
    }
    constructor(fields) {
        super({
            ...fields,
            credentials: fields?.credentials ?? (0, credential_provider_node_1.defaultProvider)(),
        });
    }
}
exports.BedrockChat = BedrockChat;
var web_js_2 = require("./web.cjs");
Object.defineProperty(exports, "convertMessagesToPromptAnthropic", { enumerable: true, get: function () { return web_js_2.convertMessagesToPromptAnthropic; } });
Object.defineProperty(exports, "convertMessagesToPrompt", { enumerable: true, get: function () { return web_js_2.convertMessagesToPrompt; } });
/**
 * @deprecated Use `BedrockChat` instead.
 */
exports.ChatBedrock = BedrockChat;
