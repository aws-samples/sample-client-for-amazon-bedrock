import type { OpenAIClient } from "@langchain/openai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
export { type AgentAction, type AgentFinish, type AgentStep, } from "@langchain/core/agents";
export { RUN_KEY } from "@langchain/core/outputs";
export { type Example } from "@langchain/core/prompts";
export type OpenAIToolCall = OpenAIClient.ChatCompletionMessageToolCall & {
    index: number;
};
export { type StoredMessageData, type StoredMessage, type StoredGeneration, type MessageType, type MessageContent, type BaseMessageFields, type ChatMessageFieldsWithRole, type FunctionMessageFieldsWithName, type ToolMessageFieldsWithToolCallId, BaseMessageChunk, HumanMessageChunk, AIMessageChunk, SystemMessageChunk, FunctionMessage, FunctionMessageChunk, ToolMessage, ToolMessageChunk, ChatMessage, type BaseMessageLike, mapStoredMessageToChatMessage, ChatMessageChunk, coerceMessageLikeToMessage, isBaseMessage, isBaseMessageChunk, } from "@langchain/core/messages";
export { BaseMessage, HumanMessage, AIMessage, SystemMessage };
/**
 * @deprecated
 * Use {@link BaseMessage} instead.
 */
export declare const BaseChatMessage: typeof BaseMessage;
/**
 * @deprecated
 * Use {@link HumanMessage} instead.
 */
export declare const HumanChatMessage: typeof HumanMessage;
/**
 * @deprecated
 * Use {@link AIMessage} instead.
 */
export declare const AIChatMessage: typeof AIMessage;
/**
 * @deprecated
 * Use {@link SystemMessage} instead.
 */
export declare const SystemChatMessage: typeof SystemMessage;
export { type Generation, type GenerationChunkFields, GenerationChunk, type ChatResult, type ChatGeneration, ChatGenerationChunk, type LLMResult, } from "@langchain/core/outputs";
export { BasePromptValue } from "@langchain/core/prompt_values";
export { type InputValues, type PartialValues, type ChainValues, } from "@langchain/core/utils/types";
export { BaseChatMessageHistory, BaseListChatMessageHistory, } from "@langchain/core/chat_history";
export { BaseCache } from "@langchain/core/caches";
export { Docstore } from "@langchain/community/stores/doc/base";
