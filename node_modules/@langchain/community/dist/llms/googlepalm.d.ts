import { protos } from "@google-ai/generativelanguage";
import { type BaseLLMParams, LLM } from "@langchain/core/language_models/llms";
/**
 * Input for Text generation for Google Palm
 */
export interface GooglePaLMTextInput extends BaseLLMParams {
    /**
     * Model Name to use
     *
     * Note: The format must follow the pattern - `models/{model}`
     */
    modelName?: string;
    /**
     * Controls the randomness of the output.
     *
     * Values can range from [0.0,1.0], inclusive. A value closer to 1.0
     * will produce responses that are more varied and creative, while
     * a value closer to 0.0 will typically result in more straightforward
     * responses from the model.
     *
     * Note: The default value varies by model
     */
    temperature?: number;
    /**
     * Maximum number of tokens to generate in the completion.
     */
    maxOutputTokens?: number;
    /**
     * Top-p changes how the model selects tokens for output.
     *
     * Tokens are selected from most probable to least until the sum
     * of their probabilities equals the top-p value.
     *
     * For example, if tokens A, B, and C have a probability of
     * .3, .2, and .1 and the top-p value is .5, then the model will
     * select either A or B as the next token (using temperature).
     *
     * Note: The default value varies by model
     */
    topP?: number;
    /**
     * Top-k changes how the model selects tokens for output.
     *
     * A top-k of 1 means the selected token is the most probable among
     * all tokens in the model’s vocabulary (also called greedy decoding),
     * while a top-k of 3 means that the next token is selected from
     * among the 3 most probable tokens (using temperature).
     *
     * Note: The default value varies by model
     */
    topK?: number;
    /**
     * The set of character sequences (up to 5) that will stop output generation.
     * If specified, the API will stop at the first appearance of a stop
     * sequence.
     *
     * Note: The stop sequence will not be included as part of the response.
     */
    stopSequences?: string[];
    /**
     * A list of unique `SafetySetting` instances for blocking unsafe content. The API will block
     * any prompts and responses that fail to meet the thresholds set by these settings. If there
     * is no `SafetySetting` for a given `SafetyCategory` provided in the list, the API will use
     * the default safety setting for that category.
     */
    safetySettings?: protos.google.ai.generativelanguage.v1beta2.ISafetySetting[];
    /**
     * Google Palm API key to use
     */
    apiKey?: string;
}
/**
 * Google Palm 2 Language Model Wrapper to generate texts
 */
export declare class GooglePaLM extends LLM implements GooglePaLMTextInput {
    lc_serializable: boolean;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    modelName: string;
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences: string[];
    safetySettings?: protos.google.ai.generativelanguage.v1beta2.ISafetySetting[];
    apiKey?: string;
    private client;
    constructor(fields?: GooglePaLMTextInput);
    _llmType(): string;
    _call(prompt: string, options: this["ParsedCallOptions"]): Promise<string>;
    protected _generateText(prompt: string): Promise<string | null | undefined>;
}
