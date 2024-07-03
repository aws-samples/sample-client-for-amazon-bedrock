import { LLM, } from "@langchain/core/language_models/llms";
import { GenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { convertEventStreamToIterableReadableDataStream } from "../utils/event_source_parse.js";
export class TogetherAI extends LLM {
    static lc_name() {
        return "TogetherAI";
    }
    constructor(inputs) {
        super(inputs);
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
            value: 0.7
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.7
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "repetitionPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logprobs", {
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
        Object.defineProperty(this, "safetyModel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inferenceAPIUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.together.xyz/inference"
        });
        const apiKey = inputs.apiKey ?? getEnvironmentVariable("TOGETHER_AI_API_KEY");
        if (!apiKey) {
            throw new Error("TOGETHER_AI_API_KEY not found.");
        }
        this.apiKey = apiKey;
        this.temperature = inputs?.temperature ?? this.temperature;
        this.topK = inputs?.topK ?? this.topK;
        this.topP = inputs?.topP ?? this.topP;
        this.modelName = inputs.modelName;
        this.streaming = inputs.streaming ?? this.streaming;
        this.repetitionPenalty = inputs.repetitionPenalty ?? this.repetitionPenalty;
        this.logprobs = inputs.logprobs;
        this.safetyModel = inputs.safetyModel;
        this.maxTokens = inputs.maxTokens;
        this.stop = inputs.stop;
    }
    _llmType() {
        return "together_ai";
    }
    constructHeaders() {
        return {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };
    }
    constructBody(prompt, options) {
        const body = {
            model: options?.modelName ?? this?.modelName,
            prompt,
            temperature: this?.temperature ?? options?.temperature,
            top_k: this?.topK ?? options?.topK,
            top_p: this?.topP ?? options?.topP,
            repetition_penalty: this?.repetitionPenalty ?? options?.repetitionPenalty,
            logprobs: this?.logprobs ?? options?.logprobs,
            stream_tokens: this?.streaming,
            safety_model: this?.safetyModel ?? options?.safetyModel,
            max_tokens: this?.maxTokens ?? options?.maxTokens,
            stop: this?.stop ?? options?.stop,
        };
        return body;
    }
    async completionWithRetry(prompt, options) {
        return this.caller.call(async () => {
            const fetchResponse = await fetch(this.inferenceAPIUrl, {
                method: "POST",
                headers: {
                    ...this.constructHeaders(),
                },
                body: JSON.stringify(this.constructBody(prompt, options)),
            });
            if (fetchResponse.status === 200) {
                return fetchResponse.json();
            }
            const errorResponse = await fetchResponse.json();
            throw new Error(`Error getting prompt completion from Together AI. ${JSON.stringify(errorResponse, null, 2)}`);
        });
    }
    /** @ignore */
    async _call(prompt, options) {
        const response = await this.completionWithRetry(prompt, options);
        const outputText = response.output.choices[0].text;
        return outputText ?? "";
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        const fetchResponse = await fetch(this.inferenceAPIUrl, {
            method: "POST",
            headers: {
                ...this.constructHeaders(),
            },
            body: JSON.stringify(this.constructBody(prompt, options)),
        });
        if (fetchResponse.status !== 200 ?? !fetchResponse.body) {
            const errorResponse = await fetchResponse.json();
            throw new Error(`Error getting prompt completion from Together AI. ${JSON.stringify(errorResponse, null, 2)}`);
        }
        const stream = convertEventStreamToIterableReadableDataStream(fetchResponse.body);
        for await (const chunk of stream) {
            if (chunk !== "[DONE]") {
                const parsedChunk = JSON.parse(chunk);
                const generationChunk = new GenerationChunk({
                    text: parsedChunk.choices[0].text ?? "",
                });
                yield generationChunk;
                // eslint-disable-next-line no-void
                void runManager?.handleLLMNewToken(generationChunk.text ?? "");
            }
        }
    }
}
