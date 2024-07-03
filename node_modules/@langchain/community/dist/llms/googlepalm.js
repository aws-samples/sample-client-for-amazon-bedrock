import { TextServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";
import { LLM } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * Google Palm 2 Language Model Wrapper to generate texts
 */
export class GooglePaLM extends LLM {
    get lc_secrets() {
        return {
            apiKey: "GOOGLE_PALM_API_KEY",
        };
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "models/text-bison-001"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "maxOutputTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // defaults to 64
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "stopSequences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "safetySettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default safety setting for that category
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.modelName = fields?.modelName ?? this.modelName;
        this.temperature = fields?.temperature ?? this.temperature;
        if (this.temperature && (this.temperature < 0 || this.temperature > 1)) {
            throw new Error("`temperature` must be in the range of [0.0,1.0]");
        }
        this.maxOutputTokens = fields?.maxOutputTokens ?? this.maxOutputTokens;
        if (this.maxOutputTokens && this.maxOutputTokens < 0) {
            throw new Error("`maxOutputTokens` must be a positive integer");
        }
        this.topP = fields?.topP ?? this.topP;
        if (this.topP && this.topP < 0) {
            throw new Error("`topP` must be a positive integer");
        }
        if (this.topP && this.topP > 1) {
            throw new Error("Google PaLM `topP` must in the range of [0,1]");
        }
        this.topK = fields?.topK ?? this.topK;
        if (this.topK && this.topK < 0) {
            throw new Error("`topK` must be a positive integer");
        }
        this.stopSequences = fields?.stopSequences ?? this.stopSequences;
        this.safetySettings = fields?.safetySettings ?? this.safetySettings;
        if (this.safetySettings && this.safetySettings.length > 0) {
            const safetySettingsSet = new Set(this.safetySettings.map((s) => s.category));
            if (safetySettingsSet.size !== this.safetySettings.length) {
                throw new Error("The categories in `safetySettings` array must be unique");
            }
        }
        this.apiKey =
            fields?.apiKey ?? getEnvironmentVariable("GOOGLE_PALM_API_KEY");
        if (!this.apiKey) {
            throw new Error("Please set an API key for Google Palm 2 in the environment variable GOOGLE_PALM_API_KEY or in the `apiKey` field of the GooglePalm constructor");
        }
        this.client = new TextServiceClient({
            authClient: new GoogleAuth().fromAPIKey(this.apiKey),
        });
    }
    _llmType() {
        return "googlepalm";
    }
    async _call(prompt, options) {
        const res = await this.caller.callWithOptions({ signal: options.signal }, this._generateText.bind(this), prompt);
        return res ?? "";
    }
    async _generateText(prompt) {
        const res = await this.client.generateText({
            model: this.modelName,
            temperature: this.temperature,
            candidateCount: 1,
            topK: this.topK,
            topP: this.topP,
            maxOutputTokens: this.maxOutputTokens,
            stopSequences: this.stopSequences,
            safetySettings: this.safetySettings,
            prompt: {
                text: prompt,
            },
        });
        return res[0].candidates && res[0].candidates.length > 0
            ? res[0].candidates[0].output
            : undefined;
    }
}
