"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunnableWithMessageHistory = void 0;
const index_js_1 = require("../messages/index.cjs");
const base_js_1 = require("./base.cjs");
const passthrough_js_1 = require("./passthrough.cjs");
/**
 * Wraps a LCEL chain and manages history. It appends input messages
 * and chain outputs as history, and adds the current history messages to
 * the chain input.
 * @example
 * ```typescript
 * // yarn add @langchain/anthropic @langchain/community @upstash/redis
 *
 * import {
 *   ChatPromptTemplate,
 *   MessagesPlaceholder,
 * } from "@langchain/core/prompts";
 * import { ChatAnthropic } from "@langchain/anthropic";
 * import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
 * // For demos, you can also use an in-memory store:
 * // import { ChatMessageHistory } from "langchain/stores/message/in_memory";
 *
 * const prompt = ChatPromptTemplate.fromMessages([
 *   ["system", "You're an assistant who's good at {ability}"],
 *   new MessagesPlaceholder("history"),
 *   ["human", "{question}"],
 * ]);
 *
 * const chain = prompt.pipe(new ChatAnthropic({}));
 *
 * const chainWithHistory = new RunnableWithMessageHistory({
 *   runnable: chain,
 *   getMessageHistory: (sessionId) =>
 *     new UpstashRedisChatMessageHistory({
 *       sessionId,
 *       config: {
 *         url: process.env.UPSTASH_REDIS_REST_URL!,
 *         token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 *       },
 *     }),
 *   inputMessagesKey: "question",
 *   historyMessagesKey: "history",
 * });
 *
 * const result = await chainWithHistory.invoke(
 *   {
 *     ability: "math",
 *     question: "What does cosine mean?",
 *   },
 *   {
 *     configurable: {
 *       sessionId: "some_string_identifying_a_user",
 *     },
 *   }
 * );
 *
 * const result2 = await chainWithHistory.invoke(
 *   {
 *     ability: "math",
 *     question: "What's its inverse?",
 *   },
 *   {
 *     configurable: {
 *       sessionId: "some_string_identifying_a_user",
 *     },
 *   }
 * );
 * ```
 */
class RunnableWithMessageHistory extends base_js_1.RunnableBinding {
    constructor(fields) {
        let historyChain = new base_js_1.RunnableLambda({
            func: (input, options) => this._enterHistory(input, options ?? {}),
        }).withConfig({ runName: "loadHistory" });
        const messagesKey = fields.historyMessagesKey ?? fields.inputMessagesKey;
        if (messagesKey) {
            historyChain = passthrough_js_1.RunnablePassthrough.assign({
                [messagesKey]: historyChain,
            }).withConfig({ runName: "insertHistory" });
        }
        const bound = historyChain
            .pipe(fields.runnable.withListeners({
            onEnd: (run, config) => this._exitHistory(run, config ?? {}),
        }))
            .withConfig({ runName: "RunnableWithMessageHistory" });
        const config = fields.config ?? {};
        super({
            ...fields,
            config,
            bound,
        });
        Object.defineProperty(this, "runnable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputMessagesKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outputMessagesKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "historyMessagesKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "getMessageHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.runnable = fields.runnable;
        this.getMessageHistory = fields.getMessageHistory;
        this.inputMessagesKey = fields.inputMessagesKey;
        this.outputMessagesKey = fields.outputMessagesKey;
        this.historyMessagesKey = fields.historyMessagesKey;
    }
    _getInputMessages(inputValue) {
        if (typeof inputValue === "string") {
            return [new index_js_1.HumanMessage(inputValue)];
        }
        else if (Array.isArray(inputValue)) {
            return inputValue;
        }
        else {
            return [inputValue];
        }
    }
    _getOutputMessages(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputValue) {
        let newOutputValue = outputValue;
        if (!Array.isArray(outputValue) &&
            !(0, index_js_1.isBaseMessage)(outputValue) &&
            typeof outputValue !== "string") {
            newOutputValue = outputValue[this.outputMessagesKey ?? "output"];
        }
        if (typeof newOutputValue === "string") {
            return [new index_js_1.AIMessage(newOutputValue)];
        }
        else if (Array.isArray(newOutputValue)) {
            return newOutputValue;
        }
        else if ((0, index_js_1.isBaseMessage)(newOutputValue)) {
            return [newOutputValue];
        }
        throw new Error(`Expected a string, BaseMessage, or array of BaseMessages. Received: ${JSON.stringify(newOutputValue, null, 2)}`);
    }
    async _enterHistory(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input, kwargs) {
        const history = kwargs?.config?.configurable?.messageHistory;
        if (this.historyMessagesKey) {
            return history.getMessages();
        }
        const inputVal = input ||
            (this.inputMessagesKey ? input[this.inputMessagesKey] : undefined);
        const historyMessages = history ? await history.getMessages() : [];
        const returnType = [
            ...historyMessages,
            ...this._getInputMessages(inputVal),
        ];
        return returnType;
    }
    async _exitHistory(run, config) {
        const history = config.configurable?.messageHistory;
        // Get input messages
        const { inputs } = run;
        const inputValue = inputs[this.inputMessagesKey ?? "input"];
        const inputMessages = this._getInputMessages(inputValue);
        // Get output messages
        const outputValue = run.outputs;
        if (!outputValue) {
            throw new Error(`Output values from 'Run' undefined. Run: ${JSON.stringify(run, null, 2)}`);
        }
        const outputMessages = this._getOutputMessages(outputValue);
        for await (const message of [...inputMessages, ...outputMessages]) {
            await history.addMessage(message);
        }
    }
    async _mergeConfig(...configs) {
        const config = await super._mergeConfig(...configs);
        // Extract sessionId
        if (!config.configurable || !config.configurable.sessionId) {
            const exampleInput = {
                [this.inputMessagesKey ?? "input"]: "foo",
            };
            const exampleConfig = { configurable: { sessionId: "123" } };
            throw new Error(`sessionId is required. Pass it in as part of the config argument to .invoke() or .stream()\n` +
                `eg. chain.invoke(${JSON.stringify(exampleInput)}, ${JSON.stringify(exampleConfig)})`);
        }
        // attach messageHistory
        const { sessionId } = config.configurable;
        config.configurable.messageHistory = await this.getMessageHistory(sessionId);
        return config;
    }
}
exports.RunnableWithMessageHistory = RunnableWithMessageHistory;
