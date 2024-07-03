"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceTransformersEmbeddings = void 0;
const transformers_1 = require("@xenova/transformers");
const embeddings_1 = require("@langchain/core/embeddings");
const chunk_array_1 = require("@langchain/core/utils/chunk_array");
/**
 * @example
 * ```typescript
 * const model = new HuggingFaceTransformersEmbeddings({
 *   modelName: "Xenova/all-MiniLM-L6-v2",
 * });
 *
 * // Embed a single query
 * const res = await model.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 *
 * // Embed multiple documents
 * const documentRes = await model.embedDocuments(["Hello world", "Bye bye"]);
 * console.log({ documentRes });
 * ```
 */
class HuggingFaceTransformersEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Xenova/all-MiniLM-L6-v2"
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 512
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pipelinePromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.modelName = fields?.modelName ?? this.modelName;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
        this.timeout = fields?.timeout;
    }
    async embedDocuments(texts) {
        const batches = (0, chunk_array_1.chunkArray)(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
        const batchRequests = batches.map((batch) => this.runEmbedding(batch));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batchResponse = batchResponses[i];
            for (let j = 0; j < batchResponse.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }
        return embeddings;
    }
    async embedQuery(text) {
        const data = await this.runEmbedding([
            this.stripNewLines ? text.replace(/\n/g, " ") : text,
        ]);
        return data[0];
    }
    async runEmbedding(texts) {
        const pipe = await (this.pipelinePromise ??= (0, transformers_1.pipeline)("feature-extraction", this.modelName));
        return this.caller.call(async () => {
            const output = await pipe(texts, { pooling: "mean", normalize: true });
            return output.tolist();
        });
    }
}
exports.HuggingFaceTransformersEmbeddings = HuggingFaceTransformersEmbeddings;
