"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NIBittensorChatModel = void 0;
const messages_1 = require("@langchain/core/messages");
const chat_models_1 = require("@langchain/core/language_models/chat_models");
/**
 * Class representing the Neural Internet chat model powerd by Bittensor, a decentralized network
 * full of different AI models.s
 * To analyze API_KEYS and logs of you usage visit
 *      https://api.neuralinternet.ai/api-keys
 *      https://api.neuralinternet.ai/logs
 */
class NIBittensorChatModel extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "NIBittensorLLM";
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "systemPrompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.systemPrompt =
            fields?.systemPrompt ??
                "You are an assistant which is created by Neural Internet(NI) in decentralized network named as a Bittensor. Your task is to provide accurate response based on user prompt";
    }
    _combineLLMOutput() {
        return [];
    }
    _llmType() {
        return "NIBittensorLLM";
    }
    messageToOpenAIRole(message) {
        const type = message._getType();
        switch (type) {
            case "system":
                return "system";
            case "ai":
                return "assistant";
            case "human":
                return "user";
            default:
                return "user";
        }
    }
    stringToChatMessage(message) {
        return new messages_1.ChatMessage(message, "assistant");
    }
    /** Call out to NIBittensorChatModel's complete endpoint.
     Args:
         messages: The messages to pass into the model.
  
         Returns: The chat response by the model.
  
     Example:
      const chat = new NIBittensorChatModel();
      const message = new HumanMessage('What is bittensor?');
      const res = await chat.call([message]);
     */
    async _generate(messages) {
        const processed_messages = messages.map((message) => {
            if (typeof message.content !== "string") {
                throw new Error("NIBittensorChat does not support non-string output.");
            }
            return {
                role: this.messageToOpenAIRole(message),
                content: message.content,
            };
        });
        const generations = [];
        try {
            // Retrieve API KEY
            const apiKeyResponse = await fetch("https://test.neuralinternet.ai/admin/api-keys/");
            if (!apiKeyResponse.ok) {
                throw new Error("Network response was not ok");
            }
            const apiKeysData = await apiKeyResponse.json();
            const apiKey = apiKeysData[0].api_key;
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "Endpoint-Version": "2023-05-19",
            };
            const minerResponse = await fetch("https://test.neuralinternet.ai/top_miner_uids", { headers });
            if (!minerResponse.ok) {
                throw new Error("Network response was not ok");
            }
            const uids = await minerResponse.json();
            if (Array.isArray(uids) && uids.length) {
                for (const uid of uids) {
                    try {
                        const payload = {
                            uids: [uid],
                            messages: [
                                { role: "system", content: this.systemPrompt },
                                ...processed_messages,
                            ],
                        };
                        const response = await fetch("https://test.neuralinternet.ai/chat", {
                            method: "POST",
                            headers,
                            body: JSON.stringify(payload),
                        });
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        const chatData = await response.json();
                        if (chatData.choices) {
                            const generation = {
                                text: chatData.choices[0].message.content,
                                message: this.stringToChatMessage(chatData.choices[0].message.content),
                            };
                            generations.push(generation);
                            return { generations, llmOutput: {} };
                        }
                    }
                    catch (error) {
                        continue;
                    }
                }
            }
        }
        catch (error) {
            const generation = {
                text: "Sorry I am unable to provide response now, Please try again later.",
                message: this.stringToChatMessage("Sorry I am unable to provide response now, Please try again later."),
            };
            generations.push(generation);
            return { generations, llmOutput: {} };
        }
        const generation = {
            text: "Sorry I am unable to provide response now, Please try again later.",
            message: this.stringToChatMessage("Sorry I am unable to provide response now, Please try again later."),
        };
        generations.push(generation);
        return { generations, llmOutput: {} };
    }
    identifyingParams() {
        return {
            systemPrompt: this.systemPrompt,
        };
    }
}
exports.NIBittensorChatModel = NIBittensorChatModel;
