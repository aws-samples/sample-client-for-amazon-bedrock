"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleVertexAI = void 0;
const googlevertexai_webauth_js_1 = require("../../utils/googlevertexai-webauth.cjs");
const googlevertexai_connection_js_1 = require("../../utils/googlevertexai-connection.cjs");
const common_js_1 = require("./common.cjs");
/**
 * Enables calls to the Google Cloud's Vertex AI API to access
 * Large Language Models.
 *
 * This entrypoint and class are intended to be used in web environments like Edge
 * functions where you do not have access to the file system. It supports passing
 * service account credentials directly as a "GOOGLE_VERTEX_AI_WEB_CREDENTIALS"
 * environment variable or directly as "authOptions.credentials".
 * @example
 * ```typescript
 * const model = new GoogleVertexAI({
 *   temperature: 0.7,
 * });
 * const stream = await model.stream(
 *   "What would be a good company name for a company that makes colorful socks?",
 * );
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * ```
 */
class GoogleVertexAI extends common_js_1.BaseGoogleVertexAI {
    static lc_name() {
        return "VertexAI";
    }
    get lc_secrets() {
        return {
            "authOptions.credentials": "GOOGLE_VERTEX_AI_WEB_CREDENTIALS",
        };
    }
    constructor(fields) {
        super(fields);
        const client = new googlevertexai_webauth_js_1.WebGoogleAuth(fields?.authOptions);
        this.connection = new googlevertexai_connection_js_1.GoogleVertexAILLMConnection({ ...fields, ...this }, this.caller, client, false);
        this.streamedConnection = new googlevertexai_connection_js_1.GoogleVertexAILLMConnection({ ...fields, ...this }, this.caller, client, true);
    }
}
exports.GoogleVertexAI = GoogleVertexAI;
