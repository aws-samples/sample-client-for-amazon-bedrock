import { GoogleAuthOptions } from "google-auth-library";
import { GoogleVertexAIBaseLLMInput } from "../../types/googlevertexai-types.js";
import { BaseGoogleVertexAI } from "./common.js";
/**
 * Interface representing the input to the Google Vertex AI model.
 */
export interface GoogleVertexAITextInput extends GoogleVertexAIBaseLLMInput<GoogleAuthOptions> {
}
/**
 * Enables calls to the Google Cloud's Vertex AI API to access
 * Large Language Models.
 *
 * To use, you will need to have one of the following authentication
 * methods in place:
 * - You are logged into an account permitted to the Google Cloud project
 *   using Vertex AI.
 * - You are running this on a machine using a service account permitted to
 *   the Google Cloud project using Vertex AI.
 * - The `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set to the
 *   path of a credentials file for a service account permitted to the
 *   Google Cloud project using Vertex AI.
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
export declare class GoogleVertexAI extends BaseGoogleVertexAI<GoogleAuthOptions> {
    static lc_name(): string;
    constructor(fields?: GoogleVertexAITextInput);
}
