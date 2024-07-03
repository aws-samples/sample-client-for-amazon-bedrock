import { OpenAIChat } from "@langchain/openai";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { promptLayerTrackRequest } from "../util/prompt-layer.js";
export { OpenAIChat };
/**
 * PromptLayer wrapper to OpenAIChat
 * @deprecated
 */
export class PromptLayerOpenAIChat extends OpenAIChat {
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
                getEnvironmentVariable("PROMPTLAYER_API_KEY");
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
            const promptLayerRespBody = await promptLayerTrackRequest(this.caller, "langchain.PromptLayerOpenAIChat", 
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
