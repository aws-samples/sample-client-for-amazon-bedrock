"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SageMakerEndpoint = exports.BaseSageMakerContentHandler = void 0;
const client_sagemaker_runtime_1 = require("@aws-sdk/client-sagemaker-runtime");
const outputs_1 = require("@langchain/core/outputs");
const llms_1 = require("@langchain/core/language_models/llms");
/**
 * A handler class to transform input from LLM to a format that SageMaker
 * endpoint expects. Similarily, the class also handles transforming output from
 * the SageMaker endpoint to a format that LLM class expects.
 *
 * Example:
 * ```
 * class ContentHandler implements ContentHandlerBase<string, string> {
 *   contentType = "application/json"
 *   accepts = "application/json"
 *
 *   transformInput(prompt: string, modelKwargs: Record<string, unknown>) {
 *     const inputString = JSON.stringify({
 *       prompt,
 *      ...modelKwargs
 *     })
 *     return Buffer.from(inputString)
 *   }
 *
 *   transformOutput(output: Uint8Array) {
 *     const responseJson = JSON.parse(Buffer.from(output).toString("utf-8"))
 *     return responseJson[0].generated_text
 *   }
 *
 * }
 * ```
 */
class BaseSageMakerContentHandler {
    constructor() {
        Object.defineProperty(this, "contentType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "text/plain"
        });
        Object.defineProperty(this, "accepts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "text/plain"
        });
    }
}
exports.BaseSageMakerContentHandler = BaseSageMakerContentHandler;
/**
 * The SageMakerEndpoint class is used to interact with SageMaker
 * Inference Endpoint models. It uses the AWS client for authentication,
 * which automatically loads credentials.
 * If a specific credential profile is to be used, the name of the profile
 * from the ~/.aws/credentials file must be passed. The credentials or
 * roles used should have the required policies to access the SageMaker
 * endpoint.
 */
class SageMakerEndpoint extends llms_1.LLM {
    static lc_name() {
        return "SageMakerEndpoint";
    }
    get lc_secrets() {
        return {
            "clientOptions.credentials.accessKeyId": "AWS_ACCESS_KEY_ID",
            "clientOptions.credentials.secretAccessKey": "AWS_SECRET_ACCESS_KEY",
            "clientOptions.credentials.sessionToken": "AWS_SESSION_TOKEN",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "endpointName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "endpointKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "contentHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!fields.clientOptions.region) {
            throw new Error(`Please pass a "clientOptions" object with a "region" field to the constructor`);
        }
        const endpointName = fields?.endpointName;
        if (!endpointName) {
            throw new Error(`Please pass an "endpointName" field to the constructor`);
        }
        const contentHandler = fields?.contentHandler;
        if (!contentHandler) {
            throw new Error(`Please pass a "contentHandler" field to the constructor`);
        }
        this.endpointName = fields.endpointName;
        this.contentHandler = fields.contentHandler;
        this.endpointKwargs = fields.endpointKwargs;
        this.modelKwargs = fields.modelKwargs;
        this.streaming = fields.streaming ?? false;
        this.client = new client_sagemaker_runtime_1.SageMakerRuntimeClient(fields.clientOptions);
    }
    _llmType() {
        return "sagemaker_endpoint";
    }
    /**
     * Calls the SageMaker endpoint and retrieves the result.
     * @param {string} prompt The input prompt.
     * @param {this["ParsedCallOptions"]} options Parsed call options.
     * @param {CallbackManagerForLLMRun} runManager Optional run manager.
     * @returns {Promise<string>} A promise that resolves to the generated string.
     */
    /** @ignore */
    async _call(prompt, options, runManager) {
        return this.streaming
            ? await this.streamingCall(prompt, options, runManager)
            : await this.noStreamingCall(prompt, options);
    }
    async streamingCall(prompt, options, runManager) {
        const chunks = [];
        for await (const chunk of this._streamResponseChunks(prompt, options, runManager)) {
            chunks.push(chunk.text);
        }
        return chunks.join("");
    }
    async noStreamingCall(prompt, options) {
        const body = await this.contentHandler.transformInput(prompt, this.modelKwargs ?? {});
        const { contentType, accepts } = this.contentHandler;
        const response = await this.caller.call(() => this.client.send(new client_sagemaker_runtime_1.InvokeEndpointCommand({
            EndpointName: this.endpointName,
            Body: body,
            ContentType: contentType,
            Accept: accepts,
            ...this.endpointKwargs,
        }), { abortSignal: options.signal }));
        if (response.Body === undefined) {
            throw new Error("Inference result missing Body");
        }
        return this.contentHandler.transformOutput(response.Body);
    }
    /**
     * Streams response chunks from the SageMaker endpoint.
     * @param {string} prompt The input prompt.
     * @param {this["ParsedCallOptions"]} options Parsed call options.
     * @returns {AsyncGenerator<GenerationChunk>} An asynchronous generator yielding generation chunks.
     */
    async *_streamResponseChunks(prompt, options, runManager) {
        const body = await this.contentHandler.transformInput(prompt, this.modelKwargs ?? {});
        const { contentType, accepts } = this.contentHandler;
        const stream = await this.caller.call(() => this.client.send(new client_sagemaker_runtime_1.InvokeEndpointWithResponseStreamCommand({
            EndpointName: this.endpointName,
            Body: body,
            ContentType: contentType,
            Accept: accepts,
            ...this.endpointKwargs,
        }), { abortSignal: options.signal }));
        if (!stream.Body) {
            throw new Error("Inference result missing Body");
        }
        for await (const chunk of stream.Body) {
            if (chunk.PayloadPart && chunk.PayloadPart.Bytes) {
                const text = await this.contentHandler.transformOutput(chunk.PayloadPart.Bytes);
                yield new outputs_1.GenerationChunk({
                    text,
                    generationInfo: {
                        ...chunk,
                        response: undefined,
                    },
                });
                await runManager?.handleLLMNewToken(text);
            }
            else if (chunk.InternalStreamFailure) {
                throw new Error(chunk.InternalStreamFailure.message);
            }
            else if (chunk.ModelStreamError) {
                throw new Error(chunk.ModelStreamError.message);
            }
        }
    }
}
exports.SageMakerEndpoint = SageMakerEndpoint;
