import type { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import type { BaseRetrieverInterface } from "@langchain/core/retrievers";
import { ChainValues } from "@langchain/core/utils/types";
import { CallbackManagerForChainRun } from "@langchain/core/callbacks/manager";
import { BaseChain, ChainInputs } from "./base.js";
import { SerializedVectorDBQAChain } from "./serde.js";
import { StuffQAChainParams } from "./question_answering/load.js";
export type LoadValues = Record<string, any>;
/**
 * Interface for the input parameters of the RetrievalQAChain class.
 */
export interface RetrievalQAChainInput extends Omit<ChainInputs, "memory"> {
    retriever: BaseRetrieverInterface;
    combineDocumentsChain: BaseChain;
    inputKey?: string;
    returnSourceDocuments?: boolean;
}
/**
 * Class representing a chain for performing question-answering tasks with
 * a retrieval component.
 * @example
 * ```typescript
 * // Initialize the OpenAI model and the remote retriever with the specified configuration
 * const model = new ChatOpenAI({});
 * const retriever = new RemoteLangChainRetriever({
 *   url: "http://example.com/api",
 *   auth: { bearer: "foo" },
 *   inputKey: "message",
 *   responseKey: "response",
 * });
 *
 * // Create a RetrievalQAChain using the model and retriever
 * const chain = RetrievalQAChain.fromLLM(model, retriever);
 *
 * // Execute the chain with a query and log the result
 * const res = await chain.call({
 *   query: "What did the president say about Justice Breyer?",
 * });
 * console.log({ res });
 *
 * ```
 */
export declare class RetrievalQAChain extends BaseChain implements RetrievalQAChainInput {
    static lc_name(): string;
    inputKey: string;
    get inputKeys(): string[];
    get outputKeys(): string[];
    retriever: BaseRetrieverInterface;
    combineDocumentsChain: BaseChain;
    returnSourceDocuments: boolean;
    constructor(fields: RetrievalQAChainInput);
    /** @ignore */
    _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues>;
    _chainType(): "retrieval_qa";
    static deserialize(_data: SerializedVectorDBQAChain, _values: LoadValues): Promise<RetrievalQAChain>;
    serialize(): SerializedVectorDBQAChain;
    /**
     * Creates a new instance of RetrievalQAChain using a BaseLanguageModel
     * and a BaseRetriever.
     * @param llm The BaseLanguageModel used to generate a new question.
     * @param retriever The BaseRetriever used to retrieve relevant documents.
     * @param options Optional parameters for the RetrievalQAChain.
     * @returns A new instance of RetrievalQAChain.
     */
    static fromLLM(llm: BaseLanguageModelInterface, retriever: BaseRetrieverInterface, options?: Partial<Omit<RetrievalQAChainInput, "retriever" | "combineDocumentsChain" | "index">> & StuffQAChainParams): RetrievalQAChain;
}
