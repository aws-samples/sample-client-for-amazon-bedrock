import { Serializable } from "@langchain/core/load/serializable";
import { Tool } from "@langchain/core/tools";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
export type ZapierValues = Record<string, any>;
export interface ZapierNLAWrapperParams extends AsyncCallerParams {
    /**
     * NLA API Key. Found in the NLA documentation https://nla.zapier.com/docs/authentication/#api-key
     * Can also be set via the environment variable `ZAPIER_NLA_API_KEY`
     */
    apiKey?: string;
    /**
     * NLA OAuth Access Token. Found in the NLA documentation https://nla.zapier.com/docs/authentication/#oauth-credentials
     * Can also be set via the environment variable `ZAPIER_NLA_OAUTH_ACCESS_TOKEN`
     */
    oauthAccessToken?: string;
}
/**
 * @deprecated Zapier has sunsetted the NLA API.
 * A wrapper class for Zapier's Natural Language Actions (NLA). It
 * provides an interface to interact with the 5k+ apps and 20k+ actions on
 * Zapier's platform through a natural language API interface. This
 * includes apps like Gmail, Salesforce, Trello, Slack, Asana, HubSpot,
 * Google Sheets, Microsoft Teams, and many more.
 */
export declare class ZapierNLAWrapper extends Serializable {
    lc_namespace: string[];
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    zapierNlaApiKey?: string;
    zapierNlaOAuthAccessToken?: string;
    zapierNlaApiBase: string;
    caller: AsyncCaller;
    constructor(params?: ZapierNLAWrapperParams);
    protected _getHeaders(): Record<string, string>;
    protected _getActionRequest(actionId: string, instructions: string, params?: ZapierValues): Promise<ZapierValues>;
    /**
     * Executes an action that is identified by action_id, must be exposed
     * (enabled) by the current user (associated with the set api_key or access token).
     * @param actionId
     * @param instructions
     * @param params
     */
    runAction(actionId: string, instructions: string, params?: ZapierValues): Promise<ZapierValues>;
    /**
     * Same as run, but instead of actually executing the action, will
     * instead return a preview of params that have been guessed by the AI in
     * case you need to explicitly review before executing.
     * @param actionId
     * @param instructions
     * @param params
     */
    previewAction(actionId: string, instructions: string, params?: ZapierValues): Promise<ZapierValues>;
    /**
     * Returns a list of all exposed (enabled) actions associated with
     * current user (associated with the set api_key or access token).
     */
    listActions(): Promise<ZapierValues[]>;
    /**
     * Same as run, but returns a stringified version of the result.
     * @param actionId
     * @param instructions
     * @param params
     */
    runAsString(actionId: string, instructions: string, params?: ZapierValues): Promise<string>;
    /**
     * Same as preview, but returns a stringified version of the result.
     * @param actionId
     * @param instructions
     * @param params
     */
    previewAsString(actionId: string, instructions: string, params?: ZapierValues): Promise<string>;
    /**
     * Same as list, but returns a stringified version of the result.
     */
    listActionsAsString(): Promise<string>;
}
/**
 * @deprecated Zapier has sunsetted the NLA API.
 * A tool that uses the `ZapierNLAWrapper` to run a specific action. It
 * takes in the `ZapierNLAWrapper` instance, an action ID, a description,
 * a schema for the parameters, and optionally the parameters themselves.
 */
export declare class ZapierNLARunAction extends Tool {
    static lc_name(): string;
    apiWrapper: ZapierNLAWrapper;
    actionId: string;
    params?: ZapierValues;
    name: string;
    description: string;
    constructor(apiWrapper: ZapierNLAWrapper, actionId: string, zapierDescription: string, paramsSchema: ZapierValues, params?: ZapierValues);
    /** @ignore */
    _call(arg: string): Promise<string>;
}
