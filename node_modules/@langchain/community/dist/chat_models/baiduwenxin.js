import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import { AIMessage, ChatMessage } from "@langchain/core/messages";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * Function that extracts the custom role of a generic chat message.
 * @param message Chat message from which to extract the custom role.
 * @returns The custom role of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (message.role !== "assistant" && message.role !== "user") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
/**
 * Function that converts a base message to a Wenxin message role.
 * @param message Base message to convert.
 * @returns The Wenxin message role.
 */
function messageToWenxinRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            throw new Error("System messages should not be here");
        case "function":
            throw new Error("Function messages not supported");
        case "generic": {
            if (!ChatMessage.isInstance(message))
                throw new Error("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
/**
 * Wrapper around Baidu ERNIE large language models that use the Chat endpoint.
 *
 * To use you should have the `BAIDU_API_KEY` and `BAIDU_SECRET_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments BaiduERNIEInput
 * @example
 * ```typescript
 * const ernieTurbo = new ChatBaiduWenxin({
 *   baiduApiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const ernie = new ChatBaiduWenxin({
 *   modelName: "ERNIE-Bot",
 *   temperature: 1,
 *   baiduApiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const messages = [new HumanMessage("Hello")];
 *
 * let res = await ernieTurbo.call(messages);
 *
 * res = await ernie.call(messages);
 * ```
 */
export class ChatBaiduWenxin extends BaseChatModel {
    static lc_name() {
        return "ChatBaiduWenxin";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            baiduApiKey: "BAIDU_API_KEY",
            baiduSecretKey: "BAIDU_SECRET_KEY",
        };
    }
    get lc_aliases() {
        return undefined;
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "baiduApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baiduSecretKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessToken", {
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
        Object.defineProperty(this, "prefixMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ERNIE-Bot-turbo"
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "penaltyScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baiduApiKey =
            fields?.baiduApiKey ?? getEnvironmentVariable("BAIDU_API_KEY");
        if (!this.baiduApiKey) {
            throw new Error("Baidu API key not found");
        }
        this.baiduSecretKey =
            fields?.baiduSecretKey ?? getEnvironmentVariable("BAIDU_SECRET_KEY");
        if (!this.baiduSecretKey) {
            throw new Error("Baidu Secret key not found");
        }
        this.streaming = fields?.streaming ?? this.streaming;
        this.prefixMessages = fields?.prefixMessages ?? this.prefixMessages;
        this.userId = fields?.userId ?? this.userId;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.penaltyScore = fields?.penaltyScore ?? this.penaltyScore;
        this.modelName = fields?.modelName ?? this.modelName;
        if (this.modelName === "ERNIE-Bot") {
            this.apiUrl =
                "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions";
        }
        else if (this.modelName === "ERNIE-Bot-turbo") {
            this.apiUrl =
                "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant";
        }
        else if (this.modelName === "ERNIE-Bot-4") {
            this.apiUrl =
                "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro";
        }
        else {
            throw new Error(`Invalid model name: ${this.modelName}`);
        }
    }
    /**
     * Method that retrieves the access token for making requests to the Baidu
     * API.
     * @param options Optional parsed call options.
     * @returns The access token for making requests to the Baidu API.
     */
    async getAccessToken(options) {
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.baiduApiKey}&client_secret=${this.baiduSecretKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            signal: options?.signal,
        });
        if (!response.ok) {
            const text = await response.text();
            const error = new Error(`Baidu get access token failed with status code ${response.status}, response: ${text}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.response = response;
            throw error;
        }
        const json = await response.json();
        return json.access_token;
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            stream: this.streaming,
            user_id: this.userId,
            temperature: this.temperature,
            top_p: this.topP,
            penalty_score: this.penaltyScore,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
        };
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const tokenUsage = {};
        const params = this.invocationParams();
        // Wenxin requires the system message to be put in the params, not messages array
        const systemMessage = messages.find((message) => message._getType() === "system");
        if (systemMessage) {
            // eslint-disable-next-line no-param-reassign
            messages = messages.filter((message) => message !== systemMessage);
            params.system = systemMessage.text;
        }
        const messagesMapped = messages.map((message) => ({
            role: messageToWenxinRole(message),
            content: message.text,
        }));
        const data = params.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                let resolved = false;
                this.completionWithRetry({
                    ...params,
                    messages: messagesMapped,
                }, true, options?.signal, (event) => {
                    const data = JSON.parse(event.data);
                    if (data?.error_code) {
                        if (rejected) {
                            return;
                        }
                        rejected = true;
                        reject(new Error(data?.error_msg));
                        return;
                    }
                    const message = data;
                    // on the first message set the response properties
                    if (!response) {
                        response = {
                            id: message.id,
                            object: message.object,
                            created: message.created,
                            result: message.result,
                            need_clear_history: message.need_clear_history,
                            usage: message.usage,
                        };
                    }
                    else {
                        response.result += message.result;
                        response.created = message.created;
                        response.need_clear_history = message.need_clear_history;
                        response.usage = message.usage;
                    }
                    // TODO this should pass part.index to the callback
                    // when that's supported there
                    // eslint-disable-next-line no-void
                    void runManager?.handleLLMNewToken(message.result ?? "");
                    if (message.is_end) {
                        if (resolved || rejected) {
                            return;
                        }
                        resolved = true;
                        resolve(response);
                    }
                }).catch((error) => {
                    if (!rejected) {
                        rejected = true;
                        reject(error);
                    }
                });
            })
            : await this.completionWithRetry({
                ...params,
                messages: messagesMapped,
            }, false, options?.signal).then((data) => {
                if (data?.error_code) {
                    throw new Error(data?.error_msg);
                }
                return data;
            });
        const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage ?? {};
        if (completionTokens) {
            tokenUsage.completionTokens =
                (tokenUsage.completionTokens ?? 0) + completionTokens;
        }
        if (promptTokens) {
            tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens;
        }
        if (totalTokens) {
            tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
        }
        const generations = [];
        const text = data.result ?? "";
        generations.push({
            text,
            message: new AIMessage(text),
        });
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    /** @ignore */
    async completionWithRetry(request, stream, signal, onmessage) {
        // The first run will get the accessToken
        if (!this.accessToken) {
            this.accessToken = await this.getAccessToken();
        }
        const makeCompletionRequest = async () => {
            const url = `${this.apiUrl}?access_token=${this.accessToken}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal,
            });
            if (!stream) {
                return response.json();
            }
            else {
                if (response.body) {
                    // response will not be a stream if an error occurred
                    if (!response.headers
                        .get("content-type")
                        ?.startsWith("text/event-stream")) {
                        onmessage?.(new MessageEvent("message", {
                            data: await response.text(),
                        }));
                        return;
                    }
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let data = "";
                    let continueReading = true;
                    while (continueReading) {
                        const { done, value } = await reader.read();
                        if (done) {
                            continueReading = false;
                            break;
                        }
                        data += decoder.decode(value);
                        let continueProcessing = true;
                        while (continueProcessing) {
                            const newlineIndex = data.indexOf("\n");
                            if (newlineIndex === -1) {
                                continueProcessing = false;
                                break;
                            }
                            const line = data.slice(0, newlineIndex);
                            data = data.slice(newlineIndex + 1);
                            if (line.startsWith("data:")) {
                                const event = new MessageEvent("message", {
                                    data: line.slice("data:".length).trim(),
                                });
                                onmessage?.(event);
                            }
                        }
                    }
                }
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    _llmType() {
        return "baiduwenxin";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
