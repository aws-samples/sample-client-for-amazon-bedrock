import { LlamaModel, LlamaContext } from "node-llama-cpp";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { LlamaBaseCppInputs } from "../utils/llama_cpp.js";
/**
 * Note that the modelPath is the only required parameter. For testing you
 * can set this in the environment variable `LLAMA_PATH`.
 */
export interface LlamaCppEmbeddingsParams extends LlamaBaseCppInputs, EmbeddingsParams {
}
/**
 * @example
 * ```typescript
 * // Initialize LlamaCppEmbeddings with the path to the model file
 * const embeddings = new LlamaCppEmbeddings({
 *   modelPath: "/Replace/with/path/to/your/model/gguf-llama2-q4_0.bin",
 * });
 *
 * // Embed a query string using the Llama embeddings
 * const res = embeddings.embedQuery("Hello Llama!");
 *
 * // Output the resulting embeddings
 * console.log(res);
 *
 * ```
 */
export declare class LlamaCppEmbeddings extends Embeddings {
    _model: LlamaModel;
    _context: LlamaContext;
    constructor(inputs: LlamaCppEmbeddingsParams);
    /**
     * Generates embeddings for an array of texts.
     * @param texts - An array of strings to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    embedDocuments(texts: string[]): Promise<number[][]>;
    /**
     * Generates an embedding for a single text.
     * @param text - A string to generate an embedding for.
     * @returns A Promise that resolves to an array of numbers representing the embedding.
     */
    embedQuery(text: string): Promise<number[]>;
}
