import { Tool } from "@langchain/core/tools";
/**
 * Interface for parameters required by GooglePlacesAPI class.
 */
export interface GooglePlacesAPIParams {
    apiKey?: string;
}
/**
 * Tool that queries the Google Places API
 */
export declare class GooglePlacesAPI extends Tool {
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    name: string;
    protected apiKey: string;
    description: string;
    constructor(fields?: GooglePlacesAPIParams);
    _call(input: string): Promise<string>;
}
