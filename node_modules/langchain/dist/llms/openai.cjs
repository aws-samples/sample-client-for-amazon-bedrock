"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptLayerOpenAIChat = exports.OpenAIChat = exports.PromptLayerOpenAI = exports.OpenAI = void 0;
const openai_1 = require("@langchain/openai");
Object.defineProperty(exports, "OpenAI", { enumerable: true, get: function () { return openai_1.OpenAI; } });
const env_1 = require("@langchain/core/utils/env");
const prompt_layer_js_1 = require("../util/prompt-layer.cjs");
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "llms/openai",
    newEntrypointName: "",
    newPackageName: "@langchain/openai",
});
/**
 * PromptLayer wrapper to OpenAI
 * @augments OpenAI
 */
class PromptLayerOpenAI extends openai_1.OpenAI {
    get lc_secrets() {
        return {
            promptLayerApiKey: "PROMPTLAYER_API_KEY",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "promptLayerApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "plTags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "returnPromptLayerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.plTags = fields?.plTags ?? [];
        this.promptLayerApiKey =
            fields?.promptLayerApiKey ??
                (0, env_1.getEnvironmentVariable)("PROMPTLAYER_API_KEY");
        this.returnPromptLayerId = fields?.returnPromptLayerId;
        if (!this.promptLayerApiKey) {
            throw new Error("Missing PromptLayer API key");
        }
    }
    async _generate(prompts, options, runManager) {
        const requestStartTime = Date.now();
        const generations = await super._generate(prompts, options, runManager);
        for (let i = 0; i < generations.generations.length; i += 1) {
            const requestEndTime = Date.now();
            const parsedResp = {
                text: generations.generations[i][0].text,
                llm_output: generations.llmOutput,
            };
            const promptLayerRespBody = await (0, prompt_layer_js_1.promptLayerTrackRequest)(this.caller, "langchain.PromptLayerOpenAI", 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { ...this._identifyingParams(), prompt: prompts[i] }, this.plTags, parsedResp, requestStartTime, requestEndTime, this.promptLayerApiKey);
            let promptLayerRequestId;
            if (this.returnPromptLayerId === true) {
                if (promptLayerRespBody && promptLayerRespBody.success === true) {
                    promptLayerRequestId = promptLayerRespBody.request_id;
                }
                generations.generations[i][0].generationInfo = {
                    ...generations.generations[i][0].generationInfo,
                    promptLayerRequestId,
                };
            }
        }
        return generations;
    }
}
exports.PromptLayerOpenAI = PromptLayerOpenAI;
var openai_chat_js_1 = require("./openai-chat.cjs");
Object.defineProperty(exports, "OpenAIChat", { enumerable: true, get: function () { return openai_chat_js_1.OpenAIChat; } });
Object.defineProperty(exports, "PromptLayerOpenAIChat", { enumerable: true, get: function () { return openai_chat_js_1.PromptLayerOpenAIChat; } });
