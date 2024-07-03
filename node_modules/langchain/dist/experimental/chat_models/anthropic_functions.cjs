"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicFunctions = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const messages_1 = require("@langchain/core/messages");
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const prompts_1 = require("@langchain/core/prompts");
const function_calling_1 = require("@langchain/core/utils/function_calling");
const anthropic_js_1 = require("../../chat_models/anthropic.cjs");
const TOOL_SYSTEM_PROMPT = 
/* #__PURE__ */
prompts_1.PromptTemplate.fromTemplate(`In addition to responding, you can use tools.
You should use tools as often as you can, as they return the most accurate information possible.
You have access to the following tools:

{tools}

In order to use a tool, you can use <tool></tool> to specify the name,
and the <tool_input></tool_input> tags to specify the parameters.
Each parameter should be passed in as <$param_name>$value</$param_name>,
Where $param_name is the name of the specific parameter, and $value
is the value for that parameter.

You will then get back a response in the form <observation></observation>
For example, if you have a tool called 'search' that accepts a single
parameter 'query' that could run a google search, in order to search
for the weather in SF you would respond:

<tool>search</tool><tool_input><query>weather in SF</query></tool_input>
<observation>64 degrees</observation>`);
/** @deprecated Install and use in "@langchain/anthropic/experimental" instead */
class AnthropicFunctions extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "AnthropicFunctions";
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "llm", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stopSequences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "systemPromptTemplate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "experimental", "chat_models"]
        });
        this.llm = fields?.llm ?? new anthropic_js_1.ChatAnthropic(fields);
        this.systemPromptTemplate =
            fields?.systemPromptTemplate ?? TOOL_SYSTEM_PROMPT;
        this.stopSequences =
            fields?.stopSequences ?? this.llm.stopSequences;
    }
    invocationParams() {
        return this.llm.invocationParams();
    }
    /** @ignore */
    _identifyingParams() {
        return this.llm._identifyingParams();
    }
    async *_streamResponseChunks(messages, options, runManager) {
        yield* this.llm._streamResponseChunks(messages, options, runManager);
    }
    async _generate(messages, options, runManager) {
        let promptMessages = messages;
        let forced = false;
        let functionCall;
        if (options.tools) {
            // eslint-disable-next-line no-param-reassign
            options.functions = (options.functions ?? []).concat(options.tools.map(function_calling_1.convertToOpenAIFunction));
        }
        if (options.functions !== undefined && options.functions.length > 0) {
            const content = await this.systemPromptTemplate.format({
                tools: JSON.stringify(options.functions, null, 2),
            });
            const systemMessage = new messages_1.SystemMessage({ content });
            promptMessages = [systemMessage].concat(promptMessages);
            const stopSequences = options?.stop?.concat(anthropic_js_1.DEFAULT_STOP_SEQUENCES) ??
                this.stopSequences ??
                anthropic_js_1.DEFAULT_STOP_SEQUENCES;
            // eslint-disable-next-line no-param-reassign
            options.stop = stopSequences.concat(["</tool_input>"]);
            if (options.function_call) {
                if (typeof options.function_call === "string") {
                    functionCall = JSON.parse(options.function_call).name;
                }
                else {
                    functionCall = options.function_call.name;
                }
                forced = true;
                const matchingFunction = options.functions.find((tool) => tool.name === functionCall);
                if (!matchingFunction) {
                    throw new Error(`No matching function found for passed "function_call"`);
                }
                promptMessages = promptMessages.concat([
                    new messages_1.AIMessage({
                        content: `<tool>${functionCall}</tool>`,
                    }),
                ]);
                // eslint-disable-next-line no-param-reassign
                delete options.function_call;
            }
            // eslint-disable-next-line no-param-reassign
            delete options.functions;
        }
        else if (options.function_call !== undefined) {
            throw new Error(`If "function_call" is provided, "functions" must also be.`);
        }
        const chatResult = await this.llm._generate(promptMessages, options, runManager);
        const chatGenerationContent = chatResult.generations[0].message.content;
        if (typeof chatGenerationContent !== "string") {
            throw new Error("AnthropicFunctions does not support non-string output.");
        }
        if (forced) {
            const parser = new fast_xml_parser_1.XMLParser();
            const result = parser.parse(`${chatGenerationContent}</tool_input>`);
            if (functionCall === undefined) {
                throw new Error(`Could not parse called function from model output.`);
            }
            const responseMessageWithFunctions = new messages_1.AIMessage({
                content: "",
                additional_kwargs: {
                    function_call: {
                        name: functionCall,
                        arguments: result.tool_input
                            ? JSON.stringify(result.tool_input)
                            : "",
                    },
                },
            });
            return {
                generations: [{ message: responseMessageWithFunctions, text: "" }],
            };
        }
        else if (chatGenerationContent.includes("<tool>")) {
            const parser = new fast_xml_parser_1.XMLParser();
            const result = parser.parse(`${chatGenerationContent}</tool_input>`);
            const responseMessageWithFunctions = new messages_1.AIMessage({
                content: chatGenerationContent.split("<tool>")[0],
                additional_kwargs: {
                    function_call: {
                        name: result.tool,
                        arguments: result.tool_input
                            ? JSON.stringify(result.tool_input)
                            : "",
                    },
                },
            });
            return {
                generations: [{ message: responseMessageWithFunctions, text: "" }],
            };
        }
        return chatResult;
    }
    _llmType() {
        return "anthropic_functions";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
exports.AnthropicFunctions = AnthropicFunctions;
