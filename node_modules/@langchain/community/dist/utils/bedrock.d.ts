import type { AwsCredentialIdentity, Provider } from "@aws-sdk/types";
import { BaseMessage } from "@langchain/core/messages";
import { ChatGeneration } from "@langchain/core/outputs";
export type CredentialType = AwsCredentialIdentity | Provider<AwsCredentialIdentity>;
/** Bedrock models.
    To authenticate, the AWS client uses the following methods to automatically load credentials:
    https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html
    If a specific credential profile should be used, you must pass the name of the profile from the ~/.aws/credentials file that is to be used.
    Make sure the credentials / roles used have the required policies to access the Bedrock service.
*/
export interface BaseBedrockInput {
    /** Model to use.
        For example, "amazon.titan-tg1-large", this is equivalent to the modelId property in the list-foundation-models api.
    */
    model: string;
    /** The AWS region e.g. `us-west-2`.
        Fallback to AWS_DEFAULT_REGION env variable or region specified in ~/.aws/config in case it is not provided here.
    */
    region?: string;
    /** AWS Credentials.
        If no credentials are provided, the default credentials from `@aws-sdk/credential-provider-node` will be used.
     */
    credentials?: CredentialType;
    /** Temperature. */
    temperature?: number;
    /** Max tokens. */
    maxTokens?: number;
    /** A custom fetch function for low-level access to AWS API. Defaults to fetch(). */
    fetchFn?: typeof fetch;
    /** @deprecated Use endpointHost instead Override the default endpoint url. */
    endpointUrl?: string;
    /** Override the default endpoint hostname. */
    endpointHost?: string;
    /**
     * Optional additional stop sequences to pass to the model. Currently only supported for Anthropic and AI21.
     * @deprecated Use .bind({ "stop": [...] }) instead
     * */
    stopSequences?: string[];
    /** Additional kwargs to pass to the model. */
    modelKwargs?: Record<string, unknown>;
    /** Whether or not to stream responses */
    streaming: boolean;
}
type Dict = {
    [key: string]: unknown;
};
/**
 * A helper class used within the `Bedrock` class. It is responsible for
 * preparing the input and output for the Bedrock service. It formats the
 * input prompt based on the provider (e.g., "anthropic", "ai21",
 * "amazon") and extracts the generated text from the service response.
 */
export declare class BedrockLLMInputOutputAdapter {
    /** Adapter class to prepare the inputs from Langchain to a format
    that LLM model expects. Also, provides a helper function to extract
    the generated text from the model response. */
    static prepareInput(provider: string, prompt: string, maxTokens?: number, temperature?: number, stopSequences?: string[] | undefined, modelKwargs?: Record<string, unknown>, bedrockMethod?: "invoke" | "invoke-with-response-stream"): Dict;
    static prepareMessagesInput(provider: string, messages: BaseMessage[], maxTokens?: number, temperature?: number, stopSequences?: string[] | undefined, modelKwargs?: Record<string, unknown>): Dict;
    /**
     * Extracts the generated text from the service response.
     * @param provider The provider name.
     * @param responseBody The response body from the service.
     * @returns The generated text.
     */
    static prepareOutput(provider: string, responseBody: any): string;
    static prepareMessagesOutput(provider: string, response: any): ChatGeneration | undefined;
}
export {};
