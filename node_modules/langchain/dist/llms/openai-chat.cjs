"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptLayerOpenAIChat = exports.OpenAIChat = void 0;
const openai_1 = require("@langchain/openai");
Object.defineProperty(exports, "OpenAIChat", { enumerable: true, get: function () { return openai_1.OpenAIChat; } });
const env_1 = require("@langchain/core/utils/env");
const prompt_layer_js_1 = require("../util/prompt-layer.cjs");
/**
 * PromptLayer wrapper to OpenAIChat
 * @deprecated
 */
class PromptLayerOpenAIChat extends openai_1.OpenAIChat {
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
        this.returnPromptLayerId = fields?.returnPromptLayerId ?? false;
        this.promptLayerApiKey =
            fields?.promptLayerApiKey ??
                (0, env_1.getEnvironmentVariable)("PROMPTLAYER_API_KEY");
        if (!this.promptLayerApiKey) {
            throw new Error("Missing PromptLayer API key");
        }
    }
    async _generate(prompts, options, runManager) {
        let choice;
        const generations = await Promise.all(prompts.map(async (prompt) => {
            const requestStartTime = Date.now();
            const text = await this._call(prompt, options, runManager);
            const requestEndTime = Date.now();
            choice = [{ text }];
            const parsedResp = {
                text,
            };
            const promptLayerRespBody = await (0, prompt_layer_js_1.promptLayerTrackRequest)(this.caller, "langchain.PromptLayerOpenAIChat", 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { ...this._identifyingParams(), prompt }, this.plTags, parsedResp, requestStartTime, requestEndTime, this.promptLayerApiKey);
            if (this.returnPromptLayerId === true &&
                promptLayerRespBody.success === true) {
                choice[0].generationInfo = {
                    promptLayerRequestId: promptLayerRespBody.request_id,
                };
            }
            return choice;
        }));
        return { generations };
    }
}
exports.PromptLayerOpenAIChat = PromptLayerOpenAIChat;
