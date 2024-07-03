import { Tool } from "@langchain/core/tools";
/**
 * Defines the parameters that can be passed to the Serper class during
 * instantiation. It includes `gl` and `hl` which are optional.
 */
export type SerperParameters = {
    gl?: string;
    hl?: string;
};
/**
 * Wrapper around serper.
 *
 * You can create a free API key at https://serper.dev.
 *
 * To use, you should have the SERPER_API_KEY environment variable set.
 */
export declare class Serper extends Tool {
    static lc_name(): string;
    /**
     * Converts the Serper instance to JSON. This method is not implemented
     * and will throw an error if called.
     * @returns Throws an error.
     */
    toJSON(): import("@langchain/core/load/serializable").SerializedNotImplemented;
    protected key: string;
    protected params: Partial<SerperParameters>;
    constructor(apiKey?: string | undefined, params?: Partial<SerperParameters>);
    name: string;
    /** @ignore */
    _call(input: string): Promise<any>;
    description: string;
}
