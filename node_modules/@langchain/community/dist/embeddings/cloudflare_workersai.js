import { Ai } from "@cloudflare/ai";
import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
/** @deprecated Install and import from "@langchain/cloudflare" instead. */
export class CloudflareWorkersAIEmbeddings extends Embeddings {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "@cf/baai/bge-base-en-v1.5"
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "ai", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!fields.binding) {
            throw new Error("Must supply a Workers AI binding, eg { binding: env.AI }");
        }
        this.ai = new Ai(fields.binding);
        this.modelName = fields.modelName ?? this.modelName;
        this.stripNewLines = fields.stripNewLines ?? this.stripNewLines;
    }
    async embedDocuments(texts) {
        const batches = chunkArray(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
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
        return this.caller.call(async () => {
            const response = await this.ai.run(this.modelName, {
                text: texts,
            });
            return response.data;
        });
    }
}
