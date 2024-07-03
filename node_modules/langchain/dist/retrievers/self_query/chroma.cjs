"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaTranslator = void 0;
const ir_js_1 = require("../../chains/query_constructor/ir.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Specialized translator for the Chroma vector database. It extends the
 * BasicTranslator class and translates internal query language elements
 * to valid filters. The class defines a subset of allowed logical
 * operators and comparators that can be used in the translation process.
 * @example
 * ```typescript
 * const chromaTranslator = new ChromaTranslator();
 * const selfQueryRetriever = new SelfQueryRetriever({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new Chroma(),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: chromaTranslator,
 * });
 *
 * const relevantDocuments = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are directed by Greta Gerwig?",
 * );
 * ```
 */
class ChromaTranslator extends base_js_1.BasicTranslator {
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
exports.ChromaTranslator = ChromaTranslator;
