"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonKnowledgeBaseRetriever = void 0;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const retrievers_1 = require("@langchain/core/retrievers");
/**
 * Class for interacting with Amazon Bedrock Knowledge Bases, a RAG workflow oriented service
 * provided by AWS. Extends the BaseRetriever class.
 * @example
 * ```typescript
 * const retriever = new AmazonKnowledgeBaseRetriever({
 *   topK: 10,
 *   knowledgeBaseId: "YOUR_KNOWLEDGE_BASE_ID",
 *   region: "us-east-2",
 *   clientOptions: {
 *     credentials: {
 *       accessKeyId: "YOUR_ACCESS_KEY_ID",
 *       secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
 *     },
 *   },
 * });
 *
 * const docs = await retriever.getRelevantDocuments("How are clouds formed?");
 * ```
 */
class AmazonKnowledgeBaseRetriever extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "AmazonKnowledgeBaseRetriever";
    }
    constructor({ knowledgeBaseId, topK = 10, clientOptions, region, }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "amazon_bedrock_knowledge_base"]
        });
        Object.defineProperty(this, "knowledgeBaseId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bedrockAgentRuntimeClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.topK = topK;
        this.bedrockAgentRuntimeClient = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
            region,
            ...clientOptions,
        });
        this.knowledgeBaseId = knowledgeBaseId;
    }
    /**
     * Cleans the result text by replacing sequences of whitespace with a
     * single space and removing ellipses.
     * @param resText The result text to clean.
     * @returns The cleaned result text.
     */
    cleanResult(resText) {
        const res = resText.replace(/\s+/g, " ").replace(/\.\.\./g, "");
        return res;
    }
    async queryKnowledgeBase(query, topK) {
        const retrieveCommand = new client_bedrock_agent_runtime_1.RetrieveCommand({
            knowledgeBaseId: this.knowledgeBaseId,
            retrievalQuery: {
                text: query,
            },
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: topK,
                },
            },
        });
        const retrieveResponse = await this.bedrockAgentRuntimeClient.send(retrieveCommand);
        return (retrieveResponse.retrievalResults?.map((result) => ({
            pageContent: this.cleanResult(result.content?.text || ""),
            metadata: {
                source: result.location?.s3Location?.uri,
                score: result.score,
            },
        })) ?? []);
    }
    async _getRelevantDocuments(query) {
        const docs = await this.queryKnowledgeBase(query, this.topK);
        return docs;
    }
}
exports.AmazonKnowledgeBaseRetriever = AmazonKnowledgeBaseRetriever;
