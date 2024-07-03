"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeTranslator = void 0;
const ir_js_1 = require("../../chains/query_constructor/ir.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Specialized translator class that extends the BasicTranslator. It is
 * designed to work with PineconeStore, a type of vector store in
 * LangChain. The class is initialized with a set of allowed operators and
 * comparators, which are used in the translation process to construct
 * queries and compare results.
 * @example
 * ```typescript
 * const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new PineconeStore(),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: new PineconeTranslator(),
 * });
 *
 * const queryResult = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are directed by Greta Gerwig?",
 * );
 * ```
 */
class PineconeTranslator extends base_js_1.BasicTranslator {
    constructor() {
        super({
            allowedOperators: [ir_js_1.Operators.and, ir_js_1.Operators.or],
            allowedComparators: [
                ir_js_1.Comparators.eq,
                ir_js_1.Comparators.ne,
                ir_js_1.Comparators.gt,
                ir_js_1.Comparators.gte,
                ir_js_1.Comparators.lt,
                ir_js_1.Comparators.lte,
            ],
        });
    }
}
exports.PineconeTranslator = PineconeTranslator;
