import { PromptTemplate } from "@langchain/core/prompts";
export declare const CYPHER_GENERATION_PROMPT: PromptTemplate<{
    question: any;
    schema: any;
}, any>;
export declare const CYPHER_QA_PROMPT: PromptTemplate<{
    context: any;
    question: any;
}, any>;
