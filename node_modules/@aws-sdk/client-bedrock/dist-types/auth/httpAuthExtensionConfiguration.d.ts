import { AwsCredentialIdentity, AwsCredentialIdentityProvider, HttpAuthScheme } from "@smithy/types";
import { BedrockHttpAuthSchemeProvider } from "./httpAuthSchemeProvider";
/**
 * @internal
 */
export interface HttpAuthExtensionConfiguration {
    setHttpAuthScheme(httpAuthScheme: HttpAuthScheme): void;
    httpAuthSchemes(): HttpAuthScheme[];
    setHttpAuthSchemeProvider(httpAuthSchemeProvider: BedrockHttpAuthSchemeProvider): void;
    httpAuthSchemeProvider(): BedrockHttpAuthSchemeProvider;
    setCredentials(credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider): void;
    credentials(): AwsCredentialIdentity | AwsCredentialIdentityProvider | undefined;
}
/**
 * @internal
 */
export type HttpAuthRuntimeConfig = Partial<{
    httpAuthSchemes: HttpAuthScheme[];
    httpAuthSchemeProvider: BedrockHttpAuthSchemeProvider;
    credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
}>;
/**
 * @internal
 */
export declare const getHttpAuthExtensionConfiguration: (runtimeConfig: HttpAuthRuntimeConfig) => HttpAuthExtensionConfiguration;
/**
 * @internal
 */
export declare const resolveHttpAuthRuntimeConfig: (config: HttpAuthExtensionConfiguration) => HttpAuthRuntimeConfig;
