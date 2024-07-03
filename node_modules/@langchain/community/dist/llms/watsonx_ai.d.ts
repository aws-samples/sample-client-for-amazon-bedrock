import { type BaseLLMCallOptions, type BaseLLMParams, LLM } from "@langchain/core/language_models/llms";
/**
 * The WatsonxAIParams interface defines the input parameters for
 * the WatsonxAI class.
 */
export interface WatsonxAIParams extends BaseLLMParams {
    /**
     * WatsonX AI Complete Endpoint.
     * Can be used if you want a fully custom endpoint.
     */
    endpoint?: string;
    /**
     * IBM Cloud Compute Region.
     * eg. us-south, us-east, etc.
     */
    region?: string;
    /**
     * WatsonX AI Version.
     * Date representing the WatsonX AI Version.
     * eg. 2023-05-29
     */
    version?: string;
    /**
     * WatsonX AI Key.
     * Provide API Key if you do not wish to automatically pull from env.
     */
    ibmCloudApiKey?: string;
    /**
     * WatsonX AI Key.
     * Provide API Key if you do not wish to automatically pull from env.
     */
    projectId?: string;
    /**
     * Parameters accepted by the WatsonX AI Endpoint.
     */
    modelParameters?: Record<string, unknown>;
    /**
     * WatsonX AI Model ID.
     */
    modelId?: string;
}
/**
 * The WatsonxAI class is used to interact with Watsonx AI
 * Inference Endpoint models. It uses IBM Cloud for authentication.
 * This requires your IBM Cloud API Key which is autoloaded if not specified.
 */
export declare class WatsonxAI extends LLM<BaseLLMCallOptions> {
    lc_serializable: boolean;
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    endpoint: string;
    region: string;
    version: string;
    modelId: string;
    modelKwargs?: Record<string, unknown>;
    ibmCloudApiKey?: string;
    ibmCloudToken?: string;
    ibmCloudTokenExpiresAt?: number;
    projectId?: string;
    modelParameters?: Record<string, unknown>;
    constructor(fields: WatsonxAIParams);
    _llmType(): string;
    /**
     * Calls the WatsonX AI endpoint and retrieves the result.
     * @param {string} prompt The input prompt.
     * @returns {Promise<string>} A promise that resolves to the generated string.
     */
    /** @ignore */
    _call(prompt: string, _options: this["ParsedCallOptions"]): Promise<string>;
    generateToken(): Promise<string>;
}
