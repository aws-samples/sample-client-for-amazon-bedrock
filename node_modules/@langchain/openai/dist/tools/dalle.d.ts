import { OpenAI as OpenAIClient } from "openai";
import { Tool, ToolParams } from "@langchain/core/tools";
/**
 * An interface for the Dall-E API Wrapper.
 */
export interface DallEAPIWrapperParams extends ToolParams {
    /**
     * The OpenAI API key
     */
    openAIApiKey?: string;
    /**
     * The model to use.
     * @params "dall-e-2" | "dall-e-3"
     * @default "dall-e-3"
     */
    modelName?: string;
    /**
     * The style of the generated images. Must be one of vivid or natural.
     * Vivid causes the model to lean towards generating hyper-real and dramatic images.
     * Natural causes the model to produce more natural, less hyper-real looking images.
     * @default "vivid"
     */
    style?: "natural" | "vivid";
    /**
     * The quality of the image that will be generated. ‘hd’ creates images with finer
     * details and greater consistency across the image.
     * @default "standard"
     */
    quality?: "standard" | "hd";
    /**
     * The number of images to generate.
     * Must be between 1 and 10.
     * For dall-e-3, only `n: 1` is supported.
     * @default 1
     */
    n?: number;
    /**
     * The size of the generated images.
     * Must be one of 256x256, 512x512, or 1024x1024 for DALL·E-2 models.
     * Must be one of 1024x1024, 1792x1024, or 1024x1792 for DALL·E-3 models.
     * @default "1024x1024"
     */
    size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
    /**
     * The format in which the generated images are returned.
     * Must be one of "url" or "b64_json".
     * @default "url"
     */
    responseFormat?: "url" | "b64_json";
    /**
     * A unique identifier representing your end-user, which will help
     * OpenAI to monitor and detect abuse.
     */
    user?: string;
    /**
     * The organization to use
     */
    organization?: string;
}
/**
 * A tool for generating images with Open AIs Dall-E 2 or 3 API.
 */
export declare class DallEAPIWrapper extends Tool {
    static lc_name(): string;
    name: string;
    description: string;
    protected client: OpenAIClient;
    static readonly toolName = "dalle_api_wrapper";
    private modelName;
    private style;
    private quality;
    private n;
    private size;
    private responseFormat;
    private user?;
    constructor(fields?: DallEAPIWrapperParams);
    /** @ignore */
    _call(input: string): Promise<string>;
}
