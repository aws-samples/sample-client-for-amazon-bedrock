import { BaseLLM } from "@langchain/core/language_models/llms";
import { Generation, GenerationChunk, LLMResult } from "@langchain/core/outputs";
import type { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GoogleVertexAILLMConnection, GoogleVertexAILLMResponse } from "../../utils/googlevertexai-connection.js";
import { GoogleVertexAIBaseLLMInput, GoogleVertexAIBasePrediction, GoogleVertexAIModelParams } from "../../types/googlevertexai-types.js";
/**
 * Interface representing the instance of text input to the Google Vertex
 * AI model.
 */
interface GoogleVertexAILLMTextInstance {
    content: string;
}
/**
 * Interface representing the instance of code input to the Google Vertex
 * AI model.
 */
interface GoogleVertexAILLMCodeInstance {
    prefix: string;
}
/**
 * Type representing an instance of either text or code input to the
 * Google Vertex AI model.
 */
type GoogleVertexAILLMInstance = GoogleVertexAILLMTextInstance | GoogleVertexAILLMCodeInstance;
/**
 * Models the data returned from the API call
 */
interface TextPrediction extends GoogleVertexAIBasePrediction {
    content: string;
}
/**
 * Base class for Google Vertex AI LLMs.
 * Implemented subclasses must provide a GoogleVertexAILLMConnection
 * with an appropriate auth client.
 */
export declare class BaseGoogleVertexAI<AuthOptions> extends BaseLLM implements GoogleVertexAIBaseLLMInput<AuthOptions> {
    lc_serializable: boolean;
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    protected connection: GoogleVertexAILLMConnection<BaseLanguageModelCallOptions, GoogleVertexAILLMInstance, TextPrediction, AuthOptions>;
    protected streamedConnection: GoogleVertexAILLMConnection<BaseLanguageModelCallOptions, GoogleVertexAILLMInstance, TextPrediction, AuthOptions>;
    get lc_aliases(): Record<string, string>;
    constructor(fields?: GoogleVertexAIBaseLLMInput<AuthOptions>);
    _llmType(): string;
    _streamResponseChunks(_input: string, _options: this["ParsedCallOptions"], _runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
    _generate(prompts: string[], options: this["ParsedCallOptions"]): Promise<LLMResult>;
    _generatePrompt(prompt: string, options: this["ParsedCallOptions"]): Promise<Generation[]>;
    /**
     * Formats the input instance as a text instance for the Google Vertex AI
     * model.
     * @param prompt Prompt to be formatted as a text instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted text instance.
     */
    formatInstanceText(prompt: string): GoogleVertexAILLMInstance;
    /**
     * Formats the input instance as a code instance for the Google Vertex AI
     * model.
     * @param prompt Prompt to be formatted as a code instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted code instance.
     */
    formatInstanceCode(prompt: string): GoogleVertexAILLMInstance;
    /**
     * Formats the input instance for the Google Vertex AI model based on the
     * model type (text or code).
     * @param prompt Prompt to be formatted as an instance.
     * @returns A GoogleVertexAILLMInstance object representing the formatted instance.
     */
    formatInstance(prompt: string): GoogleVertexAILLMInstance;
    formatParameters(): GoogleVertexAIModelParams;
    /**
     * Extracts the prediction from the API response.
     * @param result The API response from which to extract the prediction.
     * @returns A TextPrediction object representing the extracted prediction.
     */
    extractPredictionFromResponse(result: GoogleVertexAILLMResponse<TextPrediction>): TextPrediction;
    extractGenerationFromPrediction(prediction: TextPrediction): Generation;
}
export {};
