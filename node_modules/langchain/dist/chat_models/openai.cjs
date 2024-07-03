"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptLayerChatOpenAI = exports.ChatOpenAI = void 0;
const openai_1 = require("@langchain/openai");
Object.defineProperty(exports, "ChatOpenAI", { enumerable: true, get: function () { return openai_1.ChatOpenAI; } });
const prompt_layer_js_1 = require("../util/prompt-layer.cjs");
const entrypoint_deprecation_js_1 = require("../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion010MigrationWarning)({
    oldEntrypointName: "chat_models/openai",
    newEntrypointName: "",
    newPackageName: "@langchain/openai",
});
class PromptLayerChatOpenAI extends openai_1.ChatOpenAI {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "promptLayerApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "plTags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "returnPromptLayerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.promptLayerApiKey =
            fields?.promptLayerApiKey ??
                (typeof process !== "undefined"
                    ? // eslint-disable-next-line no-process-env
                        process.env?.PROMPTLAYER_API_KEY
                    : undefined);
        this.plTags = fields?.plTags ?? [];
        this.returnPromptLayerId = fields?.returnPromptLayerId ?? false;
    }
    async _generate(messages, options, runManager) {
        const requestStartTime = Date.now();
        let parsedOptions;
        if (Array.isArray(options)) {
            parsedOptions = { stop: options };
        }
        else if (options?.timeout && !options.signal) {
            parsedOptions = {
                ...options,
                signal: AbortSignal.timeout(options.timeout),
            };
        }
        else {
            parsedOptions = options ?? {};
        }
        const generatedResponses = await super._generate(messages, parsedOptions, runManager);
        const requestEndTime = Date.now();
        const _convertMessageToDict = (message) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let messageDict;
            if (message._getType() === "human") {
                messageDict = { role: "user", content: message.content };
            }
            else if (message._getType() === "ai") {
                messageDict = { role: "assistant", content: message.content };
            }
            else if (message._getType() === "function") {
                messageDict = { role: "assistant", content: message.content };
            }
            else if (message._getType() === "system") {
                messageDict = { role: "system", content: message.content };
            }
            else if (message._getType() === "generic") {
                messageDict = {
                    role: message.role,
                    content: message.content,
                };
            }
            else {
                throw new Error(`Got unknown type ${message}`);
            }
            return messageDict;
        };
        const _createMessageDicts = (messages, callOptions) => {
            const params = {
                ...this.invocationParams(),
                model: this.modelName,
            };
            if (callOptions?.stop) {
                if (Object.keys(params).includes("stop")) {
                    throw new Error("`stop` found in both the input and default params.");
                }
            }
            const messageDicts = messages.map((message) => _convertMessageToDict(message));
            return messageDicts;
        };
        for (let i = 0; i < generatedResponses.generations.length; i += 1) {
            const generation = generatedResponses.generations[i];
            const messageDicts = _createMessageDicts(messages, parsedOptions);
            let promptLayerRequestId;
            const parsedResp = [
                {
                    content: generation.text,
                    role: (0, openai_1.messageToOpenAIRole)(generation.message),
                },
            ];
            const promptLayerRespBody = await (0, prompt_layer_js_1.promptLayerTrackRequest)(this.caller, "langchain.PromptLayerChatOpenAI", { ...this._identifyingParams(), messages: messageDicts, stream: false }, this.plTags, parsedResp, requestStartTime, requestEndTime, this.promptLayerApiKey);
            if (this.returnPromptLayerId === true) {
                if (promptLayerRespBody.success === true) {
                    promptLayerRequestId = promptLayerRespBody.request_id;
                }
                if (!generation.generationInfo ||
                    typeof generation.generationInfo !== "object") {
                    generation.generationInfo = {};
                }
                generation.generationInfo.promptLayerRequestId = promptLayerRequestId;
            }
        }
        return generatedResponses;
    }
}
exports.PromptLayerChatOpenAI = PromptLayerChatOpenAI;
