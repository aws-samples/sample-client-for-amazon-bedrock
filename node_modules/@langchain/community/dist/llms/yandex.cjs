"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YandexGPT = void 0;
const env_1 = require("@langchain/core/utils/env");
const llms_1 = require("@langchain/core/language_models/llms");
const apiUrl = "https://llm.api.cloud.yandex.net/llm/v1alpha/instruct";
/** @deprecated Prefer @langchain/yandex */
class YandexGPT extends llms_1.LLM {
    static lc_name() {
        return "Yandex GPT";
    }
    get lc_secrets() {
        return {
            apiKey: "YC_API_KEY",
            iamToken: "YC_IAM_TOKEN",
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
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.6
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1700
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "general"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iamToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("YC_API_KEY");
        const iamToken = fields?.iamToken ?? (0, env_1.getEnvironmentVariable)("YC_IAM_TOKEN");
        if (apiKey === undefined && iamToken === undefined) {
            throw new Error("Please set the YC_API_KEY or YC_IAM_TOKEN environment variable or pass it to the constructor as the apiKey or iamToken field.");
        }
        this.apiKey = apiKey;
        this.iamToken = iamToken;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.temperature = fields?.temperature ?? this.temperature;
        this.model = fields?.model ?? this.model;
    }
    _llmType() {
        return "yandexgpt";
    }
    /** @ignore */
    async _call(prompt, options) {
        // Hit the `generate` endpoint on the `large` model
        return this.caller.callWithOptions({ signal: options.signal }, async () => {
            const headers = { "Content-Type": "application/json", Authorization: "" };
            if (this.apiKey !== undefined) {
                headers.Authorization = `Api-Key ${this.apiKey}`;
            }
            else {
                headers.Authorization = `Bearer ${this.iamToken}`;
            }
            const bodyData = {
                model: this.model,
                generationOptions: {
                    temperature: this.temperature,
                    maxTokens: this.maxTokens,
                },
                requestText: prompt,
            };
            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(bodyData),
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${apiUrl} from YandexGPT: ${response.status}`);
                }
                const responseData = await response.json();
                return responseData.result.alternatives[0].text;
            }
            catch (error) {
                throw new Error(`Failed to fetch ${apiUrl} from YandexGPT ${error}`);
            }
        });
    }
}
exports.YandexGPT = YandexGPT;
