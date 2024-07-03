import { Ai } from "@cloudflare/ai";
import { Fetcher } from "@cloudflare/workers-types";
import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
/** @deprecated Install and import from "@langchain/cloudflare" instead. */
export interface CloudflareWorkersAIEmbeddingsParams extends EmbeddingsParams {
    /** Binding */
    binding: Fetcher;
    /** Model name to use */
    modelName?: string;
    /**
     * The maximum number of documents to embed in a single request.
     */
    batchSize?: number;
    /**
     * Whether to strip new lines from the input text. This is recommended by
     * OpenAI, but may not be suitable for all use cases.
     */
    stripNewLines?: boolean;
}
/** @deprecated Install and import from "@langchain/cloudflare" instead. */
export declare class CloudflareWorkersAIEmbeddings extends Embeddings {
    modelName: string;
    batchSize: number;
    stripNewLines: boolean;
    ai: Ai;
    constructor(fields: CloudflareWorkersAIEmbeddingsParams);
    embedDocuments(texts: string[]): Promise<number[][]>;
    embedQuery(text: string): Promise<number[]>;
    private runEmbedding;
}
