import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import { AIMessage, ChatMessage, HumanMessage, } from "@langchain/core/messages";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
/**
 * Function that extracts the custom sender_type of a generic chat message.
 * @param message Chat message from which to extract the custom sender_type.
 * @returns The custom sender_type of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (message.role !== "ai" && message.role !== "user") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    if (message.role === "ai") {
        return "BOT";
    }
    if (message.role === "user") {
        return "USER";
    }
    return message.role;
}
/**
 * Function that converts a base message to a Minimax message sender_type.
 * @param message Base message to convert.
 * @returns The Minimax message sender_type.
 */
function messageToMinimaxRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "BOT";
        case "human":
            return "USER";
        case "system":
            throw new Error("System messages not supported");
        case "function":
            return "FUNCTION";
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
 * Wrapper around Minimax large language models that use the Chat endpoint.
 *
 * To use you should have the `MINIMAX_GROUP_ID` and `MINIMAX_API_KEY`
 * environment variable set.
 * @example
 * ```typescript
 * // Define a chat prompt with a system message setting the context for translation
 * const chatPrompt = ChatPromptTemplate.fromMessages([
 *   SystemMessagePromptTemplate.fromTemplate(
 *     "You are a helpful assistant that translates {input_language} to {output_language}.",
 *   ),
 *   HumanMessagePromptTemplate.fromTemplate("{text}"),
 * ]);
 *
 * // Create a new LLMChain with the chat model and the defined prompt
 * const chainB = new LLMChain({
 *   prompt: chatPrompt,
 *   llm: new ChatMinimax({ temperature: 0.01 }),
 * });
 *
 * // Call the chain with the input language, output language, and the text to translate
 * const resB = await chainB.call({
 *   input_language: "English",
 *   output_language: "Chinese",
 *   text: "I love programming.",
 * });
 *
 * // Log the result
 * console.log({ resB });
 *
 * ```
 */
export class ChatMinimax extends BaseChatModel {
    static lc_name() {
        return "ChatMinimax";
    }
    get callKeys() {
        return [
            ...super.callKeys,
            "functions",
            "tools",
            "defaultBotName",
            "defaultUserName",
            "plugins",
            "replyConstraints",
            "botSetting",
            "sampleMessages",
        ];
    }
    get lc_secrets() {
        return {
            minimaxApiKey: "MINIMAX_API_KEY",
            minimaxGroupId: "MINIMAX_GROUP_ID",
        };
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "minimaxGroupId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "minimaxApiKey", {
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
        Object.defineProperty(this, "prompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "abab5.5-chat"
        });
        Object.defineProperty(this, "defaultBotName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Assistant"
        });
        Object.defineProperty(this, "defaultUserName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "I"
        });
        Object.defineProperty(this, "prefixMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "basePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.minimax.chat/v1"
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.9
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.8
        });
        Object.defineProperty(this, "tokensToGenerate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "skipInfoMask", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "beamWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "botSetting", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "continueLastMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maskSensitiveInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "roleMeta", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "useStandardSse", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "replyConstraints", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.minimaxGroupId =
            fields?.minimaxGroupId ?? getEnvironmentVariable("MINIMAX_GROUP_ID");
        if (!this.minimaxGroupId) {
            throw new Error("Minimax GroupID not found");
        }
        this.minimaxApiKey =
            fields?.minimaxApiKey ?? getEnvironmentVariable("MINIMAX_API_KEY");
        if (!this.minimaxApiKey) {
            throw new Error("Minimax ApiKey not found");
        }
        this.streaming = fields?.streaming ?? this.streaming;
        this.prompt = fields?.prompt ?? this.prompt;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.skipInfoMask = fields?.skipInfoMask ?? this.skipInfoMask;
        this.prefixMessages = fields?.prefixMessages ?? this.prefixMessages;
        this.maskSensitiveInfo =
            fields?.maskSensitiveInfo ?? this.maskSensitiveInfo;
        this.beamWidth = fields?.beamWidth ?? this.beamWidth;
        this.continueLastMessage =
            fields?.continueLastMessage ?? this.continueLastMessage;
        this.tokensToGenerate = fields?.tokensToGenerate ?? this.tokensToGenerate;
        this.roleMeta = fields?.roleMeta ?? this.roleMeta;
        this.botSetting = fields?.botSetting ?? this.botSetting;
        this.useStandardSse = fields?.useStandardSse ?? this.useStandardSse;
        this.replyConstraints = fields?.replyConstraints ?? this.replyConstraints;
        this.defaultBotName = fields?.defaultBotName ?? this.defaultBotName;
        this.modelName = fields?.modelName ?? this.modelName;
        this.basePath = fields?.configuration?.basePath ?? this.basePath;
        this.headers = fields?.configuration?.headers ?? this.headers;
        this.proVersion = fields?.proVersion ?? this.proVersion;
        const modelCompletion = this.proVersion
            ? "chatcompletion_pro"
            : "chatcompletion";
        this.apiUrl = `${this.basePath}/text/${modelCompletion}`;
    }
    fallbackBotName(options) {
        let botName = options?.defaultBotName ?? this.defaultBotName ?? "Assistant";
        if (this.botSetting) {
            botName = this.botSetting[0].bot_name;
        }
        return botName;
    }
    defaultReplyConstraints(options) {
        const constraints = options?.replyConstraints ?? this.replyConstraints;
        if (!constraints) {
            let botName = options?.defaultBotName ?? this.defaultBotName ?? "Assistant";
            if (this.botSetting) {
                botName = this.botSetting[0].bot_name;
            }
            return {
                sender_type: "BOT",
                sender_name: botName,
            };
        }
        return constraints;
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options) {
        return {
            model: this.modelName,
            stream: this.streaming,
            prompt: this.prompt,
            temperature: this.temperature,
            top_p: this.topP,
            tokens_to_generate: this.tokensToGenerate,
            skip_info_mask: this.skipInfoMask,
            mask_sensitive_info: this.maskSensitiveInfo,
            beam_width: this.beamWidth,
            use_standard_sse: this.useStandardSse,
            role_meta: this.roleMeta,
            bot_setting: options?.botSetting ?? this.botSetting,
            reply_constraints: this.defaultReplyConstraints(options),
            sample_messages: this.messageToMinimaxMessage(options?.sampleMessages, options),
            functions: options?.functions ??
                (options?.tools
                    ? options?.tools.map(convertToOpenAIFunction)
                    : undefined),
            plugins: options?.plugins,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            ...this.invocationParams(),
        };
    }
    /**
     * Convert a list of messages to the format expected by the model.
     * @param messages
     * @param options
     */
    messageToMinimaxMessage(messages, options) {
        return messages
            ?.filter((message) => {
            if (ChatMessage.isInstance(message)) {
                return message.role !== "system";
            }
            return message._getType() !== "system";
        })
            ?.map((message) => {
            const sender_type = messageToMinimaxRole(message);
            if (typeof message.content !== "string") {
                throw new Error("ChatMinimax does not support non-string message content.");
            }
            return {
                sender_type,
                text: message.content,
                sender_name: message.name ??
                    (sender_type === "BOT"
                        ? this.fallbackBotName()
                        : options?.defaultUserName ?? this.defaultUserName),
            };
        });
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const tokenUsage = { totalTokens: 0 };
        this.botSettingFallback(options, messages);
        const params = this.invocationParams(options);
        const messagesMapped = [
            ...(this.messageToMinimaxMessage(messages, options) ?? []),
            ...(this.prefixMessages ?? []),
        ];
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
                        reject(data);
                        return;
                    }
                    const message = data;
                    // on the first message set the response properties
                    if (!message.choices[0].finish_reason) {
                        // the last stream message
                        let streamText;
                        if (this.proVersion) {
                            const messages = message.choices[0].messages ?? [];
                            streamText = messages[0].text;
                        }
                        else {
                            streamText = message.choices[0].delta;
                        }
                        // TODO this should pass part.index to the callback
                        // when that's supported there
                        // eslint-disable-next-line no-void
                        void runManager?.handleLLMNewToken(streamText ?? "");
                        return;
                    }
                    response = message;
                    if (!this.proVersion) {
                        response.choices[0].text = message.reply;
                    }
                    if (resolved || rejected) {
                        return;
                    }
                    resolved = true;
                    resolve(response);
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
            }, false, options?.signal);
        const { total_tokens: totalTokens } = data.usage ?? {};
        if (totalTokens) {
            tokenUsage.totalTokens = totalTokens;
        }
        if (data.base_resp?.status_code !== 0) {
            throw new Error(`Minimax API error: ${data.base_resp?.status_msg}`);
        }
        const generations = [];
        if (this.proVersion) {
            for (const choice of data.choices) {
                const messages = choice.messages ?? [];
                // 取最后一条消息
                if (messages) {
                    const message = messages[messages.length - 1];
                    const text = message?.text ?? "";
                    generations.push({
                        text,
                        message: minimaxResponseToChatMessage(message),
                    });
                }
            }
        }
        else {
            for (const choice of data.choices) {
                const text = choice?.text ?? "";
                generations.push({
                    text,
                    message: minimaxResponseToChatMessage({
                        sender_type: "BOT",
                        sender_name: options?.defaultBotName ?? this.defaultBotName ?? "Assistant",
                        text,
                    }),
                });
            }
        }
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    /** @ignore */
    async completionWithRetry(request, stream, signal, onmessage) {
        // The first run will get the accessToken
        const makeCompletionRequest = async () => {
            const url = `${this.apiUrl}?GroupId=${this.minimaxGroupId}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.minimaxApiKey}`,
                    ...this.headers,
                },
                body: JSON.stringify(request),
                signal,
            });
            if (!stream) {
                const json = await response.json();
                return json;
            }
            else {
                if (response.body) {
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
                    return {};
                }
                return {};
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    _llmType() {
        return "minimax";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
    botSettingFallback(options, messages) {
        const botSettings = options?.botSetting ?? this.botSetting;
        if (!botSettings) {
            const systemMessages = messages?.filter((message) => {
                if (ChatMessage.isInstance(message)) {
                    return message.role === "system";
                }
                return message._getType() === "system";
            });
            // get the last system message
            if (!systemMessages?.length) {
                return;
            }
            const lastSystemMessage = systemMessages[systemMessages.length - 1];
            if (typeof lastSystemMessage.content !== "string") {
                throw new Error("ChatMinimax does not support non-string message content.");
            }
            //  setting the default botSetting.
            this.botSetting = [
                {
                    content: lastSystemMessage.content,
                    bot_name: options?.defaultBotName ?? this.defaultBotName ?? "Assistant",
                },
            ];
        }
    }
}
function minimaxResponseToChatMessage(message) {
    switch (message.sender_type) {
        case "USER":
            return new HumanMessage(message.text || "");
        case "BOT":
            return new AIMessage(message.text || "", {
                function_call: message.function_call,
            });
        case "FUNCTION":
            return new AIMessage(message.text || "");
        default:
            return new ChatMessage(message.text || "", message.sender_type ?? "unknown");
    }
}
