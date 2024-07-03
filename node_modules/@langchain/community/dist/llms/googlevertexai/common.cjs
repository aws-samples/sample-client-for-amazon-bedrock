"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGoogleVertexAI = void 0;
const llms_1 = require("@langchain/core/language_models/llms");
const outputs_1 = require("@langchain/core/outputs");
/**
 * Base class for Google Vertex AI LLMs.
 * Implemented subclasses must provide a GoogleVertexAILLMConnection
 * with an appropriate auth client.
 */
class BaseGoogleVertexAI extends llms_1.BaseLLM {
    get lc_aliases() {
        return {
            model: "model_name",
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
            value: "text-bison"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.7
        });
        Object.defineProperty(this, "maxOutputTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1024
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.8
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 40
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streamedConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.model = fields?.model ?? this.model;
        // Change the defaults for code models
        if (this.model.startsWith("code-gecko")) {
            this.maxOutputTokens = 64;
        }
        if (this.model.startsWith("code-")) {
            this.temperature = 0.2;
        }
        this.temperature = fields?.temperature ?? this.temperature;
        this.maxOutputTokens = fields?.maxOutputTokens ?? this.maxOutputTokens;
        this.topP = fields?.topP ?? this.topP;
        this.topK = fields?.topK ?? this.topK;
    }
    _llmType() {
        return "vertexai";
    }
    async *_streamResponseChunks(_input, _options, _runManager) {
        // Make the call as a streaming request
        const instance = this.formatInstance(_input);
        const parameters = this.formatParameters();
        const result = await this.streamedConnection.request([instance], parameters, _options);
        // Get the streaming parser of the response
        const stream = result.data;
        // Loop until the end of the stream
        // During the loop, yield each time we get a chunk from the streaming parser
        // that is either available or added to the queue
        while (!stream.streamDone) {
            const output = await stream.nextChunk();
            const chunk = output !== null
                ? new outputs_1.GenerationChunk(this.extractGenerationFromPrediction(output.outputs[0]))
                : new outputs_1.GenerationChunk({
                    text: "",
                    generationInfo: { finishReason: "stop" },
                });
            yield chunk;
        }
    }
    async _generate(prompts, options) {
        const generations = await Promise.all(prompts.map((prompt) => this._generatePrompt(prompt, options)));
        return { generations };
    }
    async _generatePrompt(prompt, options) {
        const instance = this.formatInstance(prompt);
        const parameters = this.formatParameters();
        const result = await this.connection.request([instance], parameters, options);
        const prediction = this.extractPredictionFromResponse(result);
        return [this.extractGenerationFromPrediction(prediction)];
    }
    /**
     * Formats the input instance as a text instance for the Google Vertex AI
     * model.
     * @param prompt Prompt to be formatted as a text instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted text instance.
     */
    formatInstanceText(prompt) {
        return { content: prompt };
    }
    /**
     * Formats the input instance as a code instance for the Google Vertex AI
     * model.
     * @param prompt Prompt to be formatted as a code instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted code instance.
     */
    formatInstanceCode(prompt) {
        return { prefix: prompt };
    }
    /**
     * Formats the input instance for the Google Vertex AI model based on the
     * model type (text or code).
     * @param prompt Prompt to be formatted as an instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted instance.
     */
    formatInstance(prompt) {
        return this.model.startsWith("code-")
            ? this.formatInstanceCode(prompt)
            : this.formatInstanceText(prompt);
    }
    formatParameters() {
        return {
            temperature: this.temperature,
            topK: this.topK,
            topP: this.topP,
            maxOutputTokens: this.maxOutputTokens,
        };
    }
    /**
     * Extracts the prediction from the API response.
     * @param result The API response from which to extract the prediction.
     * @returns A TextPrediction object representing the extracted prediction.
     */
    extractPredictionFromResponse(result) {
        return result?.data
            ?.predictions[0];
    }
    extractGenerationFromPrediction(prediction) {
        return {
            text: prediction.content,
            generationInfo: prediction,
        };
    }
}
exports.BaseGoogleVertexAI = BaseGoogleVertexAI;
