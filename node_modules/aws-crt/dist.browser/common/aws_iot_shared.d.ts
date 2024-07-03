import * as mqtt5_packet from "./mqtt5_packet";
/**
 * A helper function to add parameters to the username in with_custom_authorizer function
 *
 * @internal
 */
export declare function add_to_username_parameter(current_username: string, parameter_value: string, parameter_pre_text: string): string;
/**
 * A helper function to see if a string is not null, is defined, and is not an empty string
 *
 * @internal
 */
export declare function is_string_and_not_empty(item: any): boolean;
/**
 * A helper function to populate the username with the Custom Authorizer fields
 * @param current_username the current username
 * @param input_username the username to add - can be an empty string to skip
 * @param input_authorizer the name of the authorizer to add - can be an empty string to skip
 * @param input_signature the name of the signature to add - can be an empty string to skip
 * @param input_builder_username the username from the MQTT builder
 * @param input_token_key_name the token key name
 * @param input_token_value the token key value
 * @returns The finished username with the additions added to it
 *
 * @internal
 */
export declare function populate_username_string_with_custom_authorizer(current_username?: string, input_username?: string, input_authorizer?: string, input_signature?: string, input_builder_username?: string, input_token_key_name?: string, input_token_value?: string): string;
/**
 * Configuration options specific to
 * [AWS IoT Core custom authentication](https://docs.aws.amazon.com/iot/latest/developerguide/custom-authentication.html)
 * features.  For clients constructed by an {@link AwsIotMqtt5ClientConfigBuilder}, all parameters associated
 * with AWS IoT custom authentication are passed via the username and password properties in the CONNECT packet.
 */
export interface MqttConnectCustomAuthConfig {
    /**
     * Name of the custom authorizer to use.
     *
     * Required if the endpoint does not have a default custom authorizer associated with it.  It is strongly suggested
     * to URL-encode this value; the SDK will not do so for you.
     */
    authorizerName?: string;
    /**
     * The username to use with the custom authorizer.  Query-string elements of this property value will be unioned
     * with the query-string elements implied by other properties in this object.
     *
     * For example, if you set this to:
     *
     * 'MyUsername?someKey=someValue'
     *
     * and use {@link authorizerName} to specify the authorizer, the final username would look like:
     *
     * `MyUsername?someKey=someValue&x-amz-customauthorizer-name=<your authorizer's name>&...`
     */
    username?: string;
    /**
     * The password to use with the custom authorizer.  Becomes the MQTT5 CONNECT packet's password property.
     * AWS IoT Core will base64 encode this binary data before passing it to the authorizer's lambda function.
     */
    password?: mqtt5_packet.BinaryData;
    /**
     * Key used to extract the custom authorizer token from MQTT username query-string properties.
     *
     * Required if the custom authorizer has signing enabled.  It is strongly suggested to URL-encode this value; the
     * SDK will not do so for you.
     */
    tokenKeyName?: string;
    /**
     * An opaque token value. This value must be signed by the private key associated with the custom authorizer and
     * the result placed in the {@link tokenSignature} property.
     *
     * Required if the custom authorizer has signing enabled.
     */
    tokenValue?: string;
    /**
     * The digital signature of the token value in the {@link tokenValue} property.  The signature must be based on
     * the private key associated with the custom authorizer.  The signature must be base64 encoded.
     *
     * Required if the custom authorizer has signing enabled.
     */
    tokenSignature?: string;
}
/** @internal */
export declare function canonicalizeCustomAuthTokenSignature(signature?: string): string | undefined;
/** @internal */
export declare function canonicalizeCustomAuthConfig(config: MqttConnectCustomAuthConfig): MqttConnectCustomAuthConfig;
/**
 * Builds the final value for the CONNECT packet's username property based on AWS IoT custom auth configuration
 * and SDK metrics properties.
 *
 * @param customAuthConfig intended AWS IoT custom auth client configuration
 *
 * @internal
 */
export declare function buildMqtt5FinalUsername(customAuthConfig?: MqttConnectCustomAuthConfig): string;
/**
 * Attempts to determine the AWS region associated with an endpoint.
 *
 * @param endpoint endpoint to compute the region for
 *
 * @internal
 */
export declare function extractRegionFromEndpoint(endpoint: string): string;
