import { LLM } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { GenerationChunk } from "@langchain/core/outputs";
import { convertEventStreamToIterableReadableDataStream } from "../utils/event_source_parse.js";
/**
 * @deprecated Install and import from "@langchain/cloudflare" instead.
 *
 * Class representing the CloudflareWorkersAI language model. It extends the LLM (Large
 * Language Model) class, providing a standard interface for interacting
 * with the CloudflareWorkersAI language model.
 */
export class CloudflareWorkersAI extends LLM {
    static lc_name() {
        return "CloudflareWorkersAI";
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "@cf/meta/llama-2-7b-chat-int8"
        });
        Object.defineProperty(this, "cloudflareAccountId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cloudflareApiToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baseUrl", {
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
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        this.model = fields?.model ?? this.model;
        this.streaming = fields?.streaming ?? this.streaming;
        this.cloudflareAccountId =
            fields?.cloudflareAccountId ??
                getEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID");
        this.cloudflareApiToken =
            fields?.cloudflareApiToken ??
                getEnvironmentVariable("CLOUDFLARE_API_TOKEN");
        this.baseUrl =
            fields?.baseUrl ??
                `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/ai/run`;
        if (this.baseUrl.endsWith("/")) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }
    }
    /**
     * Method to validate the environment.
     */
    validateEnvironment() {
        if (this.baseUrl === undefined) {
            if (!this.cloudflareAccountId) {
                throw new Error(`No Cloudflare account ID found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_ACCOUNT_ID" in your environment variables.`);
            }
            if (!this.cloudflareApiToken) {
                throw new Error(`No Cloudflare API key found. Please provide it when instantiating the CloudflareWorkersAI class, or set it as "CLOUDFLARE_API_KEY" in your environment variables.`);
            }
        }
    }
    /** Get the identifying parameters for this LLM. */
    get identifyingParams() {
        return { model: this.model };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            model: this.model,
        };
    }
    /** Get the type of LLM. */
    _llmType() {
        return "cloudflare";
    }
    async _request(prompt, options, stream) {
        this.validateEnvironment();
        const url = `${this.baseUrl}/${this.model}`;
        const headers = {
            Authorization: `Bearer ${this.cloudflareApiToken}`,
            "Content-Type": "application/json",
        };
        const data = { prompt, stream };
        return this.caller.call(async () => {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(data),
                signal: options.signal,
            });
            if (!response.ok) {
                const error = new Error(`Cloudflare LLM call failed with status code ${response.status}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error.response = response;
                throw error;
            }
            return response;
        });
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        const response = await this._request(prompt, options, true);
        if (!response.body) {
            throw new Error("Empty response from Cloudflare. Please try again.");
        }
        const stream = convertEventStreamToIterableReadableDataStream(response.body);
        for await (const chunk of stream) {
            if (chunk !== "[DONE]") {
                const parsedChunk = JSON.parse(chunk);
                const generationChunk = new GenerationChunk({
                    text: parsedChunk.response,
                });
                yield generationChunk;
                // eslint-disable-next-line no-void
                void runManager?.handleLLMNewToken(generationChunk.text ?? "");
            }
        }
    }
    /** Call out to CloudflareWorkersAI's complete endpoint.
     Args:
         prompt: The prompt to pass into the model.
     Returns:
         The string generated by the model.
     Example:
     let response = CloudflareWorkersAI.call("Tell me a joke.");
     */
    async _call(prompt, options, runManager) {
        if (!this.streaming) {
            const response = await this._request(prompt, options);
            const responseData = await response.json();
            return responseData.result.response;
        }
        else {
            const stream = this._streamResponseChunks(prompt, options, runManager);
            let finalResult;
            for await (const chunk of stream) {
                if (finalResult === undefined) {
                    finalResult = chunk;
                }
                else {
                    finalResult = finalResult.concat(chunk);
                }
            }
            return finalResult?.text ?? "";
        }
    }
}
