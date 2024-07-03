import { BaseMessage, HumanMessage, AIMessage, SystemMessage, } from "@langchain/core/messages";
/* #__PURE__ */ console.warn([
    `[WARNING]: Importing from "langchain/schema" is deprecated.`,
    ``,
    `Instead, please import from the appropriate entrypoint in "@langchain/core" or "langchain".`,
    ``,
    `This will be mandatory after the next "langchain" minor version bump to 0.2.`,
].join("\n"));
export { RUN_KEY } from "@langchain/core/outputs";
export { BaseMessageChunk, HumanMessageChunk, AIMessageChunk, SystemMessageChunk, FunctionMessage, FunctionMessageChunk, ToolMessage, ToolMessageChunk, ChatMessage, mapStoredMessageToChatMessage, ChatMessageChunk, coerceMessageLikeToMessage, isBaseMessage, isBaseMessageChunk, } from "@langchain/core/messages";
export { BaseMessage, HumanMessage, AIMessage, SystemMessage };
/**
 * @deprecated
 * Use {@link BaseMessage} instead.
 */
export const BaseChatMessage = BaseMessage;
/**
 * @deprecated
 * Use {@link HumanMessage} instead.
 */
export const HumanChatMessage = HumanMessage;
/**
 * @deprecated
 * Use {@link AIMessage} instead.
 */
export const AIChatMessage = AIMessage;
/**
 * @deprecated
 * Use {@link SystemMessage} instead.
 */
export const SystemChatMessage = SystemMessage;
export { GenerationChunk, ChatGenerationChunk, } from "@langchain/core/outputs";
export { BasePromptValue } from "@langchain/core/prompt_values";
export { BaseChatMessageHistory, BaseListChatMessageHistory, } from "@langchain/core/chat_history";
export { BaseCache } from "@langchain/core/caches";
export { Docstore } from "@langchain/community/stores/doc/base";
