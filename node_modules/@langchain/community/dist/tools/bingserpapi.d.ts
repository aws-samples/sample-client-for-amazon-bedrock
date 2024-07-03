import { Tool } from "@langchain/core/tools";
/**
 * A tool for web search functionality using Bing's search engine. It
 * extends the base `Tool` class and implements the `_call` method to
 * perform the search operation. Requires an API key for Bing's search
 * engine, which can be set in the environment variables. Also accepts
 * additional parameters for the search query.
 */
declare class BingSerpAPI extends Tool {
    static lc_name(): string;
    /**
     * Not implemented. Will throw an error if called.
     */
    toJSON(): import("@langchain/core/load/serializable").SerializedNotImplemented;
    name: string;
    description: string;
    key: string;
    params: Record<string, string>;
    constructor(apiKey?: string | undefined, params?: Record<string, string>);
    /** @ignore */
    _call(input: string): Promise<string>;
}
export { BingSerpAPI };
