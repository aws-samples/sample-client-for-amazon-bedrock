import { OpenAI } from "@langchain/openai";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { promptLayerTrackRequest } from "../util/prompt-layer.js";
import { logVersion010MigrationWarning } from "../util/entrypoint_deprecation.js";
/* #__PURE__ */ logVersion010MigrationWarning({
    oldEntrypointName: "llms/openai",
    newEntrypointName: "",
    newPackageName: "@langchain/openai",
});
export { OpenAI };
/**
 * PromptLayer wrapper to OpenAI
 * @augments OpenAI
 */
export class PromptLayerOpenAI extends OpenAI {
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
                getEnvironmentVariable("PROMPTLAYER_API_KEY");
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
            const promptLayerRespBody = await promptLayerTrackRequest(this.caller, "langchain.PromptLayerOpenAI", 
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
export { OpenAIChat, PromptLayerOpenAIChat } from "./openai-chat.js";
