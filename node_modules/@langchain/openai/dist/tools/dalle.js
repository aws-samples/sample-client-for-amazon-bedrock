import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { OpenAI as OpenAIClient } from "openai";
import { Tool } from "@langchain/core/tools";
/**
 * A tool for generating images with Open AIs Dall-E 2 or 3 API.
 */
export class DallEAPIWrapper extends Tool {
    static lc_name() {
        return "DallEAPIWrapper";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "dalle_api_wrapper"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A wrapper around OpenAI DALL-E API. Useful for when you need to generate images from a text description. Input should be an image description."
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "dall-e-3"
        });
        Object.defineProperty(this, "style", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "vivid"
        });
        Object.defineProperty(this, "quality", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "standard"
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "size", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "1024x1024"
        });
        Object.defineProperty(this, "responseFormat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "url"
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const openAIApiKey = fields?.openAIApiKey ?? getEnvironmentVariable("OPENAI_API_KEY");
        const organization = fields?.organization ?? getEnvironmentVariable("OPENAI_ORGANIZATION");
        const clientConfig = {
            apiKey: openAIApiKey,
            organization,
            dangerouslyAllowBrowser: true,
        };
        this.client = new OpenAIClient(clientConfig);
        this.modelName = fields?.modelName ?? this.modelName;
        this.style = fields?.style ?? this.style;
        this.quality = fields?.quality ?? this.quality;
        this.n = fields?.n ?? this.n;
        this.size = fields?.size ?? this.size;
        this.responseFormat = fields?.responseFormat ?? this.responseFormat;
        this.user = fields?.user;
    }
    /** @ignore */
    async _call(input) {
        const response = await this.client.images.generate({
            model: this.modelName,
            prompt: input,
            n: this.n,
            size: this.size,
            response_format: this.responseFormat,
            style: this.style,
            quality: this.quality,
            user: this.user,
        });
        let data = "";
        if (this.responseFormat === "url") {
            [data] = response.data
                .map((item) => item.url)
                .filter((url) => url !== "undefined");
        }
        else {
            [data] = response.data
                .map((item) => item.b64_json)
                .filter((b64_json) => b64_json !== "undefined");
        }
        return data;
    }
}
Object.defineProperty(DallEAPIWrapper, "toolName", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "dalle_api_wrapper"
});
