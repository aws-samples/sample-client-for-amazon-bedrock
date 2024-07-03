import { Tool } from "@langchain/core/tools";
/**
 * Interface for parameters required by GoogleCustomSearch class.
 */
export interface GoogleCustomSearchParams {
    apiKey?: string;
    googleCSEId?: string;
}
/**
 * Class that uses the Google Search API to perform custom searches.
 * Requires environment variables `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` to
 * be set.
 */
export declare class GoogleCustomSearch extends Tool {
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    name: string;
    protected apiKey: string;
    protected googleCSEId: string;
    description: string;
    constructor(fields?: GoogleCustomSearchParams);
    _call(input: string): Promise<string>;
}
