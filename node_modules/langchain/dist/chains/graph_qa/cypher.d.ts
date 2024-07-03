import type { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { ChainValues } from "@langchain/core/utils/types";
import { BasePromptTemplate } from "@langchain/core/prompts";
import { CallbackManagerForChainRun } from "@langchain/core/callbacks/manager";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { LLMChain } from "../../chains/llm_chain.js";
import { BaseChain, ChainInputs } from "../base.js";
export declare const INTERMEDIATE_STEPS_KEY = "intermediateSteps";
export interface GraphCypherQAChainInput extends ChainInputs {
    graph: Neo4jGraph;
    cypherGenerationChain: LLMChain;
    qaChain: LLMChain;
    inputKey?: string;
    outputKey?: string;
    topK?: number;
    returnIntermediateSteps?: boolean;
    returnDirect?: boolean;
}
export interface FromLLMInput {
    graph: Neo4jGraph;
    llm?: BaseLanguageModelInterface;
    cypherLLM?: BaseLanguageModelInterface;
    qaLLM?: BaseLanguageModelInterface;
    qaPrompt?: BasePromptTemplate;
    cypherPrompt?: BasePromptTemplate;
    returnIntermediateSteps?: boolean;
    returnDirect?: boolean;
}
/**
 * @example
 * ```typescript
 * const chain = new GraphCypherQAChain({
 *   llm: new ChatOpenAI({ temperature: 0 }),
 *   graph: new Neo4jGraph(),
 * });
 * const res = await chain.run("Who played in Pulp Fiction?");
 * ```
 */
export declare class GraphCypherQAChain extends BaseChain {
    private graph;
    private cypherGenerationChain;
    private qaChain;
    private inputKey;
    private outputKey;
    private topK;
    private returnDirect;
    private returnIntermediateSteps;
    constructor(props: GraphCypherQAChainInput);
    _chainType(): "graph_cypher_chain";
    get inputKeys(): string[];
    get outputKeys(): string[];
    static fromLLM(props: FromLLMInput): GraphCypherQAChain;
    private extractCypher;
    _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues>;
}
