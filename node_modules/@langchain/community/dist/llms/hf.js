import { LLM } from "@langchain/core/language_models/llms";
import { GenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * Class implementing the Large Language Model (LLM) interface using the
 * Hugging Face Inference API for text generation.
 * @example
 * ```typescript
 * const model = new HuggingFaceInference({
 *   model: "gpt2",
 *   temperature: 0.7,
 *   maxTokens: 50,
 * });
 *
 * const res = await model.invoke(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 */
export class HuggingFaceInference extends LLM {
    get lc_secrets() {
        return {
            apiKey: "HUGGINGFACEHUB_API_KEY",
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
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt2"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "stopSequences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "endpointUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "includeCredentials", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        this.model = fields?.model ?? this.model;
        this.temperature = fields?.temperature ?? this.temperature;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.stopSequences = fields?.stopSequences ?? this.stopSequences;
        this.topP = fields?.topP ?? this.topP;
        this.topK = fields?.topK ?? this.topK;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.apiKey =
            fields?.apiKey ?? getEnvironmentVariable("HUGGINGFACEHUB_API_KEY");
        this.endpointUrl = fields?.endpointUrl;
        this.includeCredentials = fields?.includeCredentials;
        if (!this.apiKey) {
            throw new Error(`Please set an API key for HuggingFace Hub in the environment variable "HUGGINGFACEHUB_API_KEY" or in the apiKey field of the HuggingFaceInference constructor.`);
        }
    }
    _llmType() {
        return "hf";
    }
    invocationParams(options) {
        return {
            model: this.model,
            parameters: {
                // make it behave similar to openai, returning only the generated text
                return_full_text: false,
                temperature: this.temperature,
                max_new_tokens: this.maxTokens,
                stop: options?.stop ?? this.stopSequences,
                top_p: this.topP,
                top_k: this.topK,
                repetition_penalty: this.frequencyPenalty,
            },
        };
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        const hfi = await this._prepareHFInference();
        const stream = await this.caller.call(async () => hfi.textGenerationStream({
            ...this.invocationParams(options),
            inputs: prompt,
        }));
        for await (const chunk of stream) {
            const token = chunk.token.text;
            yield new GenerationChunk({ text: token, generationInfo: chunk });
            await runManager?.handleLLMNewToken(token ?? "");
            // stream is done
            if (chunk.generated_text)
                yield new GenerationChunk({
                    text: "",
                    generationInfo: { finished: true },
                });
        }
    }
    /** @ignore */
    async _call(prompt, options) {
        const hfi = await this._prepareHFInference();
        const args = { ...this.invocationParams(options), inputs: prompt };
        const res = await this.caller.callWithOptions({ signal: options.signal }, hfi.textGeneration.bind(hfi), args);
        return res.generated_text;
    }
    /** @ignore */
    async _prepareHFInference() {
        const { HfInference } = await HuggingFaceInference.imports();
        const hfi = new HfInference(this.apiKey, {
            includeCredentials: this.includeCredentials,
        });
        return this.endpointUrl ? hfi.endpoint(this.endpointUrl) : hfi;
    }
    /** @ignore */
    static async imports() {
        try {
            const { HfInference } = await import("@huggingface/inference");
            return { HfInference };
        }
        catch (e) {
            throw new Error("Please install huggingface as a dependency with, e.g. `yarn add @huggingface/inference`");
        }
    }
}
