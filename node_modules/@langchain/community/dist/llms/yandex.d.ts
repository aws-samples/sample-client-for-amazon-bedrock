import { LLM, type BaseLLMParams } from "@langchain/core/language_models/llms";
/** @deprecated Prefer @langchain/yandex */
export interface YandexGPTInputs extends BaseLLMParams {
    /**
     * What sampling temperature to use.
     * Should be a double number between 0 (inclusive) and 1 (inclusive).
     */
    temperature?: number;
    /**
     * Maximum limit on the total number of tokens
     * used for both the input prompt and the generated response.
     */
    maxTokens?: number;
    /** Model name to use. */
    model?: string;
    /**
     * Yandex Cloud Api Key for service account
     * with the `ai.languageModels.user` role.
     */
    apiKey?: string;
    /**
     * Yandex Cloud IAM token for service account
     * with the `ai.languageModels.user` role.
     */
    iamToken?: string;
}
/** @deprecated Prefer @langchain/yandex */
export declare class YandexGPT extends LLM implements YandexGPTInputs {
    lc_serializable: boolean;
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    temperature: number;
    maxTokens: number;
    model: string;
    apiKey?: string;
    iamToken?: string;
    constructor(fields?: YandexGPTInputs);
    _llmType(): string;
    /** @ignore */
    _call(prompt: string, options: this["ParsedCallOptions"]): Promise<string>;
}
