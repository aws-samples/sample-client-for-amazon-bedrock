import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
export interface AlibabaTongyiEmbeddingsParams extends EmbeddingsParams {
    /** Model name to use */
    modelName: "text-embedding-v2";
    /**
     * Timeout to use when making requests to AlibabaTongyi.
     */
    timeout?: number;
    /**
     * The maximum number of documents to embed in a single request. This is
     * limited by the AlibabaTongyi API to a maximum of 2048.
     */
    batchSize?: number;
    /**
     * Whether to strip new lines from the input text.
     */
    stripNewLines?: boolean;
    parameters?: {
        /**
         * 取值：query 或者 document，默认值为 document
         * 说明：文本转换为向量后可以应用于检索、聚类、分类等下游任务，
         * 	对检索这类非对称任务为了达到更好的检索效果建议区分查询文本（query）和
         * 	底库文本（document）类型, 聚类、分类等对称任务可以不用特殊指定，
         * 	采用系统默认值"document"即可
         */
        text_type?: "text" | "document";
    };
}
interface EmbeddingCreateParams {
    model: AlibabaTongyiEmbeddingsParams["modelName"];
    input: {
        texts: string[];
    };
    parameters?: AlibabaTongyiEmbeddingsParams["parameters"];
}
export declare class AlibabaTongyiEmbeddings extends Embeddings implements AlibabaTongyiEmbeddingsParams {
    modelName: AlibabaTongyiEmbeddingsParams["modelName"];
    batchSize: number;
    stripNewLines: boolean;
    apiKey: string;
    parameters: EmbeddingCreateParams["parameters"];
    constructor(fields?: Partial<AlibabaTongyiEmbeddingsParams> & {
        verbose?: boolean;
        apiKey?: string;
    });
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the AlibabaTongyi API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(texts: string[]): Promise<number[][]>;
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param text Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    embedQuery(text: string): Promise<number[]>;
    /**
     * Method to generate an embedding params.
     * @param texts Array of documents to generate embeddings for.
     * @returns an embedding params.
     */
    private getParams;
    /**
     * Private method to make a request to the OpenAI API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param request Request to send to the OpenAI API.
     * @returns Promise that resolves to the response from the API.
     */
    private embeddingWithRetry;
}
export {};
