"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Docstore = exports.BaseCache = exports.BaseListChatMessageHistory = exports.BaseChatMessageHistory = exports.BasePromptValue = exports.ChatGenerationChunk = exports.GenerationChunk = exports.SystemChatMessage = exports.AIChatMessage = exports.HumanChatMessage = exports.BaseChatMessage = exports.SystemMessage = exports.AIMessage = exports.HumanMessage = exports.BaseMessage = exports.isBaseMessageChunk = exports.isBaseMessage = exports.coerceMessageLikeToMessage = exports.ChatMessageChunk = exports.mapStoredMessageToChatMessage = exports.ChatMessage = exports.ToolMessageChunk = exports.ToolMessage = exports.FunctionMessageChunk = exports.FunctionMessage = exports.SystemMessageChunk = exports.AIMessageChunk = exports.HumanMessageChunk = exports.BaseMessageChunk = exports.RUN_KEY = void 0;
const messages_1 = require("@langchain/core/messages");
Object.defineProperty(exports, "BaseMessage", { enumerable: true, get: function () { return messages_1.BaseMessage; } });
Object.defineProperty(exports, "HumanMessage", { enumerable: true, get: function () { return messages_1.HumanMessage; } });
Object.defineProperty(exports, "AIMessage", { enumerable: true, get: function () { return messages_1.AIMessage; } });
Object.defineProperty(exports, "SystemMessage", { enumerable: true, get: function () { return messages_1.SystemMessage; } });
/* #__PURE__ */ console.warn([
    `[WARNING]: Importing from "langchain/schema" is deprecated.`,
    ``,
    `Instead, please import from the appropriate entrypoint in "@langchain/core" or "langchain".`,
    ``,
    `This will be mandatory after the next "langchain" minor version bump to 0.2.`,
].join("\n"));
var outputs_1 = require("@langchain/core/outputs");
Object.defineProperty(exports, "RUN_KEY", { enumerable: true, get: function () { return outputs_1.RUN_KEY; } });
var messages_2 = require("@langchain/core/messages");
Object.defineProperty(exports, "BaseMessageChunk", { enumerable: true, get: function () { return messages_2.BaseMessageChunk; } });
Object.defineProperty(exports, "HumanMessageChunk", { enumerable: true, get: function () { return messages_2.HumanMessageChunk; } });
Object.defineProperty(exports, "AIMessageChunk", { enumerable: true, get: function () { return messages_2.AIMessageChunk; } });
Object.defineProperty(exports, "SystemMessageChunk", { enumerable: true, get: function () { return messages_2.SystemMessageChunk; } });
Object.defineProperty(exports, "FunctionMessage", { enumerable: true, get: function () { return messages_2.FunctionMessage; } });
Object.defineProperty(exports, "FunctionMessageChunk", { enumerable: true, get: function () { return messages_2.FunctionMessageChunk; } });
Object.defineProperty(exports, "ToolMessage", { enumerable: true, get: function () { return messages_2.ToolMessage; } });
Object.defineProperty(exports, "ToolMessageChunk", { enumerable: true, get: function () { return messages_2.ToolMessageChunk; } });
Object.defineProperty(exports, "ChatMessage", { enumerable: true, get: function () { return messages_2.ChatMessage; } });
Object.defineProperty(exports, "mapStoredMessageToChatMessage", { enumerable: true, get: function () { return messages_2.mapStoredMessageToChatMessage; } });
Object.defineProperty(exports, "ChatMessageChunk", { enumerable: true, get: function () { return messages_2.ChatMessageChunk; } });
Object.defineProperty(exports, "coerceMessageLikeToMessage", { enumerable: true, get: function () { return messages_2.coerceMessageLikeToMessage; } });
Object.defineProperty(exports, "isBaseMessage", { enumerable: true, get: function () { return messages_2.isBaseMessage; } });
Object.defineProperty(exports, "isBaseMessageChunk", { enumerable: true, get: function () { return messages_2.isBaseMessageChunk; } });
/**
 * @deprecated
 * Use {@link BaseMessage} instead.
 */
exports.BaseChatMessage = messages_1.BaseMessage;
/**
 * @deprecated
 * Use {@link HumanMessage} instead.
 */
exports.HumanChatMessage = messages_1.HumanMessage;
/**
 * @deprecated
 * Use {@link AIMessage} instead.
 */
exports.AIChatMessage = messages_1.AIMessage;
/**
 * @deprecated
 * Use {@link SystemMessage} instead.
 */
exports.SystemChatMessage = messages_1.SystemMessage;
var outputs_2 = require("@langchain/core/outputs");
Object.defineProperty(exports, "GenerationChunk", { enumerable: true, get: function () { return outputs_2.GenerationChunk; } });
Object.defineProperty(exports, "ChatGenerationChunk", { enumerable: true, get: function () { return outputs_2.ChatGenerationChunk; } });
var prompt_values_1 = require("@langchain/core/prompt_values");
Object.defineProperty(exports, "BasePromptValue", { enumerable: true, get: function () { return prompt_values_1.BasePromptValue; } });
var chat_history_1 = require("@langchain/core/chat_history");
Object.defineProperty(exports, "BaseChatMessageHistory", { enumerable: true, get: function () { return chat_history_1.BaseChatMessageHistory; } });
Object.defineProperty(exports, "BaseListChatMessageHistory", { enumerable: true, get: function () { return chat_history_1.BaseListChatMessageHistory; } });
var caches_1 = require("@langchain/core/caches");
Object.defineProperty(exports, "BaseCache", { enumerable: true, get: function () { return caches_1.BaseCache; } });
var base_1 = require("@langchain/community/stores/doc/base");
Object.defineProperty(exports, "Docstore", { enumerable: true, get: function () { return base_1.Docstore; } });
