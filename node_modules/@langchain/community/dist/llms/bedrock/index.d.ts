import type { BaseLLMParams } from "@langchain/core/language_models/llms";
import { BaseBedrockInput } from "../../utils/bedrock.js";
import { Bedrock as BaseBedrock } from "./web.js";
export declare class Bedrock extends BaseBedrock {
    static lc_name(): string;
    constructor(fields?: Partial<BaseBedrockInput> & BaseLLMParams);
}
