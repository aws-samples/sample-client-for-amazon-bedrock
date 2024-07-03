"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGooglePaLM = void 0;
const generativelanguage_1 = require("@google-ai/generativelanguage");
const google_auth_library_1 = require("google-auth-library");
const messages_1 = require("@langchain/core/messages");
const env_1 = require("@langchain/core/utils/env");
const chat_models_1 = require("@langchain/core/language_models/chat_models");
function getMessageAuthor(message) {
    const type = message._getType();
    if (messages_1.ChatMessage.isInstance(message)) {
        return message.role;
    }
    return message.name ?? type;
}
/**
 * A class that wraps the Google Palm chat model.
 *
 * @example
 * ```typescript
 * const model = new ChatGooglePaLM({
 *   apiKey: "<YOUR API KEY>",
 *   temperature: 0.7,
 *   modelName: "models/chat-bison-001",
 *   topK: 40,
 *   topP: 1,
 *   examples: [
 *     {
 *       input: new HumanMessage("What is your favorite sock color?"),
 *       output: new AIMessage("My favorite sock color be arrrr-ange!"),
 *     },
 *   ],
 * });
 * const questions = [
 *   new SystemMessage(
 *     "You are a funny assistant that answers in pirate language."
 *   ),
 *   new HumanMessage("What is your favorite food?"),
 * ];
 * const res = await model.invoke(questions);
 * console.log({ res });
 * ```
 */
class ChatGooglePaLM extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatGooglePaLM";
    }
    get lc_secrets() {
        return {
            apiKey: "GOOGLE_PALM_API_KEY",
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
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "models/chat-bison-001"
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // default value chosen based on model
        Object.defineProperty(this, "examples", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "apiKey", {
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
        this.modelName = fields?.modelName ?? this.modelName;
        this.temperature = fields?.temperature ?? this.temperature;
        if (this.temperature && (this.temperature < 0 || this.temperature > 1)) {
            throw new Error("`temperature` must be in the range of [0.0,1.0]");
        }
        this.topP = fields?.topP ?? this.topP;
        if (this.topP && this.topP < 0) {
            throw new Error("`topP` must be a positive integer");
        }
        this.topK = fields?.topK ?? this.topK;
        if (this.topK && this.topK < 0) {
            throw new Error("`topK` must be a positive integer");
        }
        this.examples =
            fields?.examples?.map((example) => {
                if (((0, messages_1.isBaseMessage)(example.input) &&
                    typeof example.input.content !== "string") ||
                    ((0, messages_1.isBaseMessage)(example.output) &&
                        typeof example.output.content !== "string")) {
                    throw new Error("GooglePaLM example messages may only have string content.");
                }
                return {
                    input: {
                        ...example.input,
                        content: example.input?.content,
                    },
                    output: {
                        ...example.output,
                        content: example.output?.content,
                    },
                };
            }) ?? this.examples;
        this.apiKey =
            fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("GOOGLE_PALM_API_KEY");
        if (!this.apiKey) {
            throw new Error("Please set an API key for Google Palm 2 in the environment variable GOOGLE_PALM_API_KEY or in the `apiKey` field of the GooglePalm constructor");
        }
        this.client = new generativelanguage_1.DiscussServiceClient({
            authClient: new google_auth_library_1.GoogleAuth().fromAPIKey(this.apiKey),
        });
    }
    _combineLLMOutput() {
        return [];
    }
    _llmType() {
        return "googlepalm";
    }
    async _generate(messages, options, runManager) {
        const palmMessages = await this.caller.callWithOptions({ signal: options.signal }, this._generateMessage.bind(this), this._mapBaseMessagesToPalmMessages(messages), this._getPalmContextInstruction(messages), this.examples);
        const chatResult = this._mapPalmMessagesToChatResult(palmMessages);
        // Google Palm doesn't provide streaming as of now. But to support streaming handlers
        // we call the handler with entire response text
        void runManager?.handleLLMNewToken(chatResult.generations.length > 0 ? chatResult.generations[0].text : "");
        return chatResult;
    }
    async _generateMessage(messages, context, examples) {
        const [palmMessages] = await this.client.generateMessage({
            candidateCount: 1,
            model: this.modelName,
            temperature: this.temperature,
            topK: this.topK,
            topP: this.topP,
            prompt: {
                context,
                examples,
                messages,
            },
        });
        return palmMessages;
    }
    _getPalmContextInstruction(messages) {
        // get the first message and checks if it's a system 'system' messages
        const systemMessage = messages.length > 0 && getMessageAuthor(messages[0]) === "system"
            ? messages[0]
            : undefined;
        if (systemMessage?.content !== undefined &&
            typeof systemMessage.content !== "string") {
            throw new Error("Non-string system message content is not supported.");
        }
        return systemMessage?.content;
    }
    _mapBaseMessagesToPalmMessages(messages) {
        // remove all 'system' messages
        const nonSystemMessages = messages.filter((m) => getMessageAuthor(m) !== "system");
        // requires alternate human & ai messages. Throw error if two messages are consecutive
        nonSystemMessages.forEach((msg, index) => {
            if (index < 1)
                return;
            if (getMessageAuthor(msg) === getMessageAuthor(nonSystemMessages[index - 1])) {
                throw new Error(`Google PaLM requires alternate messages between authors`);
            }
        });
        return nonSystemMessages.map((m) => {
            if (typeof m.content !== "string") {
                throw new Error("ChatGooglePaLM does not support non-string message content.");
            }
            return {
                author: getMessageAuthor(m),
                content: m.content,
                citationMetadata: {
                    citationSources: m.additional_kwargs.citationSources,
                },
            };
        });
    }
    _mapPalmMessagesToChatResult(msgRes) {
        if (msgRes.candidates &&
            msgRes.candidates.length > 0 &&
            msgRes.candidates[0]) {
            const message = msgRes.candidates[0];
            return {
                generations: [
                    {
                        text: message.content ?? "",
                        message: new messages_1.AIMessage({
                            content: message.content ?? "",
                            name: message.author === null ? undefined : message.author,
                            additional_kwargs: {
                                citationSources: message.citationMetadata?.citationSources,
                                filters: msgRes.filters, // content filters applied
                            },
                        }),
                    },
                ],
            };
        }
        // if rejected or error, return empty generations with reason in filters
        return {
            generations: [],
            llmOutput: {
                filters: msgRes.filters,
            },
        };
    }
}
exports.ChatGooglePaLM = ChatGooglePaLM;
