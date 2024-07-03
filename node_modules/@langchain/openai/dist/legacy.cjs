"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIChat = void 0;
const openai_1 = require("openai");
const outputs_1 = require("@langchain/core/outputs");
const env_1 = require("@langchain/core/utils/env");
const llms_1 = require("@langchain/core/language_models/llms");
const azure_js_1 = require("./utils/azure.cjs");
const openai_js_1 = require("./utils/openai.cjs");
/**
 * @deprecated For legacy compatibility. Use ChatOpenAI instead.
 *
 * Wrapper around OpenAI large language models that use the Chat endpoint.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the `openai` package installed, with the
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 *
 * @augments BaseLLM
 * @augments OpenAIInput
 * @augments AzureOpenAIChatInput
 * @example
 * ```typescript
 * const model = new OpenAIChat({
 *   prefixMessages: [
 *     {
 *       role: "system",
 *       content: "You are a helpful assistant that answers in pirate language",
 *     },
 *   ],
 *   maxTokens: 50,
 * });
 *
 * const res = await model.call(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 * ```
 */
class OpenAIChat extends llms_1.LLM {
    static lc_name() {
        return "OpenAIChat";
    }
    get callKeys() {
        return [...super.callKeys, "options", "promptIndex"];
    }
    get lc_secrets() {
        return {
            openAIApiKey: "OPENAI_API_KEY",
            azureOpenAIApiKey: "AZURE_OPENAI_API_KEY",
            organization: "OPENAI_ORGANIZATION",
        };
    }
    get lc_aliases() {
        return {
            modelName: "model",
            openAIApiKey: "openai_api_key",
            azureOpenAIApiVersion: "azure_openai_api_version",
            azureOpenAIApiKey: "azure_openai_api_key",
            azureOpenAIApiInstanceName: "azure_openai_api_instance_name",
            azureOpenAIApiDeploymentName: "azure_openai_api_deployment_name",
        };
    }
    constructor(fields, 
    /** @deprecated */
    configuration) {
        super(fields ?? {});
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
            value: 1
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logitBias", {
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
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt-3.5-turbo"
        });
        Object.defineProperty(this, "prefixMessages", {
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
        Object.defineProperty(this, "timeout", {
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
        Object.defineProperty(this, "user", {
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
        Object.defineProperty(this, "openAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiDeploymentName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIBasePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "organization", {
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
        Object.defineProperty(this, "clientConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.openAIApiKey =
            fields?.openAIApiKey ?? (0, env_1.getEnvironmentVariable)("OPENAI_API_KEY");
        this.azureOpenAIApiKey =
            fields?.azureOpenAIApiKey ??
                (0, env_1.getEnvironmentVariable)("AZURE_OPENAI_API_KEY");
        if (!this.azureOpenAIApiKey && !this.openAIApiKey) {
            throw new Error("OpenAI or Azure OpenAI API key not found");
        }
        this.azureOpenAIApiInstanceName =
            fields?.azureOpenAIApiInstanceName ??
                (0, env_1.getEnvironmentVariable)("AZURE_OPENAI_API_INSTANCE_NAME");
        this.azureOpenAIApiDeploymentName =
            (fields?.azureOpenAIApiCompletionsDeploymentName ||
                fields?.azureOpenAIApiDeploymentName) ??
                ((0, env_1.getEnvironmentVariable)("AZURE_OPENAI_API_COMPLETIONS_DEPLOYMENT_NAME") ||
                    (0, env_1.getEnvironmentVariable)("AZURE_OPENAI_API_DEPLOYMENT_NAME"));
        this.azureOpenAIApiVersion =
            fields?.azureOpenAIApiVersion ??
                (0, env_1.getEnvironmentVariable)("AZURE_OPENAI_API_VERSION");
        this.azureOpenAIBasePath =
            fields?.azureOpenAIBasePath ??
                (0, env_1.getEnvironmentVariable)("AZURE_OPENAI_BASE_PATH");
        this.organization =
            fields?.configuration?.organization ??
                (0, env_1.getEnvironmentVariable)("OPENAI_ORGANIZATION");
        this.modelName = fields?.modelName ?? this.modelName;
        this.prefixMessages = fields?.prefixMessages ?? this.prefixMessages;
        this.modelKwargs = fields?.modelKwargs ?? {};
        this.timeout = fields?.timeout;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.n = fields?.n ?? this.n;
        this.logitBias = fields?.logitBias;
        this.maxTokens = fields?.maxTokens;
        this.stop = fields?.stop;
        this.user = fields?.user;
        this.streaming = fields?.streaming ?? false;
        if (this.n > 1) {
            throw new Error("Cannot use n > 1 in OpenAIChat LLM. Use ChatOpenAI Chat Model instead.");
        }
        if (this.azureOpenAIApiKey) {
            if (!this.azureOpenAIApiInstanceName && !this.azureOpenAIBasePath) {
                throw new Error("Azure OpenAI API instance name not found");
            }
            if (!this.azureOpenAIApiDeploymentName) {
                throw new Error("Azure OpenAI API deployment name not found");
            }
            if (!this.azureOpenAIApiVersion) {
                throw new Error("Azure OpenAI API version not found");
            }
            this.openAIApiKey = this.openAIApiKey ?? "";
        }
        this.clientConfig = {
            apiKey: this.openAIApiKey,
            organization: this.organization,
            baseURL: configuration?.basePath ?? fields?.configuration?.basePath,
            dangerouslyAllowBrowser: true,
            defaultHeaders: configuration?.baseOptions?.headers ??
                fields?.configuration?.baseOptions?.headers,
            defaultQuery: configuration?.baseOptions?.params ??
                fields?.configuration?.baseOptions?.params,
            ...configuration,
            ...fields?.configuration,
        };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options) {
        return {
            model: this.modelName,
            temperature: this.temperature,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            n: this.n,
            logit_bias: this.logitBias,
            max_tokens: this.maxTokens === -1 ? undefined : this.maxTokens,
            stop: options?.stop ?? this.stop,
            user: this.user,
            stream: this.streaming,
            ...this.modelKwargs,
        };
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    /**
     * Formats the messages for the OpenAI API.
     * @param prompt The prompt to be formatted.
     * @returns Array of formatted messages.
     */
    formatMessages(prompt) {
        const message = {
            role: "user",
            content: prompt,
        };
        return this.prefixMessages ? [...this.prefixMessages, message] : [message];
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        const params = {
            ...this.invocationParams(options),
            messages: this.formatMessages(prompt),
            stream: true,
        };
        const stream = await this.completionWithRetry(params, options);
        for await (const data of stream) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const { delta } = choice;
            const generationChunk = new outputs_1.GenerationChunk({
                text: delta.content ?? "",
            });
            yield generationChunk;
            const newTokenIndices = {
                prompt: options.promptIndex ?? 0,
                completion: choice.index ?? 0,
            };
            // eslint-disable-next-line no-void
            void runManager?.handleLLMNewToken(generationChunk.text ?? "", newTokenIndices);
        }
        if (options.signal?.aborted) {
            throw new Error("AbortError");
        }
    }
    /** @ignore */
    async _call(prompt, options, runManager) {
        const params = this.invocationParams(options);
        if (params.stream) {
            const stream = await this._streamResponseChunks(prompt, options, runManager);
            let finalChunk;
            for await (const chunk of stream) {
                if (finalChunk === undefined) {
                    finalChunk = chunk;
                }
                else {
                    finalChunk = finalChunk.concat(chunk);
                }
            }
            return finalChunk?.text ?? "";
        }
        else {
            const response = await this.completionWithRetry({
                ...params,
                stream: false,
                messages: this.formatMessages(prompt),
            }, {
                signal: options.signal,
                ...options.options,
            });
            return response?.choices[0]?.message?.content ?? "";
        }
    }
    async completionWithRetry(request, options) {
        const requestOptions = this._getClientOptions(options);
        return this.caller.call(async () => {
            try {
                const res = await this.client.chat.completions.create(request, requestOptions);
                return res;
            }
            catch (e) {
                const error = (0, openai_js_1.wrapOpenAIClientError)(e);
                throw error;
            }
        });
    }
    /** @ignore */
    _getClientOptions(options) {
        if (!this.client) {
            const openAIEndpointConfig = {
                azureOpenAIApiDeploymentName: this.azureOpenAIApiDeploymentName,
                azureOpenAIApiInstanceName: this.azureOpenAIApiInstanceName,
                azureOpenAIApiKey: this.azureOpenAIApiKey,
                azureOpenAIBasePath: this.azureOpenAIBasePath,
                baseURL: this.clientConfig.baseURL,
            };
            const endpoint = (0, azure_js_1.getEndpoint)(openAIEndpointConfig);
            const params = {
                ...this.clientConfig,
                baseURL: endpoint,
                timeout: this.timeout,
                maxRetries: 0,
            };
            if (!params.baseURL) {
                delete params.baseURL;
            }
            this.client = new openai_1.OpenAI(params);
        }
        const requestOptions = {
            ...this.clientConfig,
            ...options,
        };
        if (this.azureOpenAIApiKey) {
            requestOptions.headers = {
                "api-key": this.azureOpenAIApiKey,
                ...requestOptions.headers,
            };
            requestOptions.query = {
                "api-version": this.azureOpenAIApiVersion,
                ...requestOptions.query,
            };
        }
        return requestOptions;
    }
    _llmType() {
        return "openai";
    }
}
exports.OpenAIChat = OpenAIChat;
