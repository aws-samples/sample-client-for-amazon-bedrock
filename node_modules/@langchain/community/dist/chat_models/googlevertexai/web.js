import { GoogleVertexAILLMConnection } from "../../utils/googlevertexai-connection.js";
import { WebGoogleAuth, } from "../../utils/googlevertexai-webauth.js";
import { BaseChatGoogleVertexAI } from "./common.js";
/**
 * Enables calls to the Google Cloud's Vertex AI API to access
 * Large Language Models in a chat-like fashion.
 *
 * This entrypoint and class are intended to be used in web environments like Edge
 * functions where you do not have access to the file system. It supports passing
 * service account credentials directly as a "GOOGLE_VERTEX_AI_WEB_CREDENTIALS"
 * environment variable or directly as "authOptions.credentials".
 * @example
 * ```typescript
 * const model = new ChatGoogleVertexAI({
 *   temperature: 0.7,
 * });
 * const result = await model.invoke(
 *   "How do I implement a binary search algorithm in Python?",
 * );
 * ```
 */
export class ChatGoogleVertexAI extends BaseChatGoogleVertexAI {
    static lc_name() {
        return "ChatVertexAI";
    }
    get lc_secrets() {
        return {
            "authOptions.credentials": "GOOGLE_VERTEX_AI_WEB_CREDENTIALS",
        };
    }
    constructor(fields) {
        super(fields);
        const client = new WebGoogleAuth(fields?.authOptions);
        this.connection = new GoogleVertexAILLMConnection({ ...fields, ...this }, this.caller, client, false);
        this.streamedConnection = new GoogleVertexAILLMConnection({ ...fields, ...this }, this.caller, client, true);
    }
}
