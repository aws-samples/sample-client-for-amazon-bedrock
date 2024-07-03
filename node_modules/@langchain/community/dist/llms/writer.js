import { Writer as WriterClient } from "@writerai/writer-sdk";
import { LLM } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * Class representing a Writer Large Language Model (LLM). It interacts
 * with the Writer API to generate text completions.
 */
export class Writer extends LLM {
    static lc_name() {
        return "Writer";
    }
    get lc_secrets() {
        return {
            apiKey: "WRITER_API_KEY",
            orgId: "WRITER_ORG_ID",
        };
    }
    get lc_aliases() {
        return {
            apiKey: "writer_api_key",
            orgId: "writer_org_id",
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
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "orgId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "palmyra-instruct"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "minTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bestOf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logprobs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey ?? getEnvironmentVariable("WRITER_API_KEY");
        const orgId = fields?.orgId ?? getEnvironmentVariable("WRITER_ORG_ID");
        if (!apiKey) {
            throw new Error("Please set the WRITER_API_KEY environment variable or pass it to the constructor as the apiKey field.");
        }
        if (!orgId) {
            throw new Error("Please set the WRITER_ORG_ID environment variable or pass it to the constructor as the orgId field.");
        }
        this.apiKey = apiKey;
        this.orgId = typeof orgId === "string" ? parseInt(orgId, 10) : orgId;
        this.model = fields?.model ?? this.model;
        this.temperature = fields?.temperature ?? this.temperature;
        this.minTokens = fields?.minTokens ?? this.minTokens;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.bestOf = fields?.bestOf ?? this.bestOf;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.logprobs = fields?.logprobs ?? this.logprobs;
        this.n = fields?.n ?? this.n;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.topP = fields?.topP ?? this.topP;
    }
    _llmType() {
        return "writer";
    }
    /** @ignore */
    async _call(prompt, options) {
        const sdk = new WriterClient({
            security: {
                apiKey: this.apiKey,
            },
            organizationId: this.orgId,
        });
        return this.caller.callWithOptions({ signal: options.signal }, async () => {
            try {
                const res = await sdk.completions.create({
                    completionRequest: {
                        prompt,
                        stop: options.stop,
                        temperature: this.temperature,
                        minTokens: this.minTokens,
                        maxTokens: this.maxTokens,
                        bestOf: this.bestOf,
                        n: this.n,
                        frequencyPenalty: this.frequencyPenalty,
                        logprobs: this.logprobs,
                        presencePenalty: this.presencePenalty,
                        topP: this.topP,
                    },
                    modelId: this.model,
                });
                return (res.completionResponse?.choices?.[0].text ?? "No completion found.");
            }
            catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                e.response = e.rawResponse;
                throw e;
            }
        });
    }
}
