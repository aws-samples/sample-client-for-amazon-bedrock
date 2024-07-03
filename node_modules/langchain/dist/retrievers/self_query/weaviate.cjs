"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeaviateTranslator = void 0;
const ir_js_1 = require("../../chains/query_constructor/ir.cjs");
const base_js_1 = require("./base.cjs");
const utils_js_1 = require("./utils.cjs");
/**
 * A class that translates or converts data into a format that can be used
 * with Weaviate, a vector search engine. It extends the `BaseTranslator`
 * class and provides specific implementation for Weaviate.
 * @example
 * ```typescript
 * const selfQueryRetriever = new SelfQueryRetriever({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new WeaviateStore(),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: new WeaviateTranslator(),
 * });
 *
 * const relevantDocuments = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are rated higher than 8.5?",
 * );
 * ```
 */
class WeaviateTranslator extends base_js_1.BaseTranslator {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "allowedOperators", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [ir_js_1.Operators.and, ir_js_1.Operators.or]
        });
        Object.defineProperty(this, "allowedComparators", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                ir_js_1.Comparators.eq,
                ir_js_1.Comparators.ne,
                ir_js_1.Comparators.lt,
                ir_js_1.Comparators.lte,
                ir_js_1.Comparators.gt,
                ir_js_1.Comparators.gte,
            ]
        });
    }
    /**
     * Formats the given function into a string representation. Throws an
     * error if the function is not a known comparator or operator, or if it
     * is not allowed.
     * @param func The function to format, which can be an Operator or Comparator.
     * @returns A string representation of the function.
     */
    formatFunction(func) {
        if (func in ir_js_1.Comparators) {
            if (this.allowedComparators.length > 0 &&
                this.allowedComparators.indexOf(func) === -1) {
                throw new Error(`Comparator ${func} not allowed. Allowed operators: ${this.allowedComparators.join(", ")}`);
            }
        }
        else if (func in ir_js_1.Operators) {
            if (this.allowedOperators.length > 0 &&
                this.allowedOperators.indexOf(func) === -1) {
                throw new Error(`Operator ${func} not allowed. Allowed operators: ${this.allowedOperators.join(", ")}`);
            }
        }
        else {
            throw new Error("Unknown comparator or operator");
        }
        const dict = {
            and: "And",
            or: "Or",
            eq: "Equal",
            ne: "NotEqual",
            lt: "LessThan",
            lte: "LessThanEqual",
            gt: "GreaterThan",
            gte: "GreaterThanEqual",
        };
        return dict[func];
    }
    /**
     * Visits an operation and returns a WeaviateOperationResult. The
     * operation's arguments are visited and the operator is formatted.
     * @param operation The operation to visit.
     * @returns A WeaviateOperationResult.
     */
    visitOperation(operation) {
        const args = operation.args?.map((arg) => arg.accept(this));
        return {
            operator: this.formatFunction(operation.operator),
            operands: args,
        };
    }
    /**
     * Visits a comparison and returns a WeaviateComparisonResult. The
     * comparison's value is checked for type and the comparator is formatted.
     * Throws an error if the value type is not supported.
     * @param comparison The comparison to visit.
     * @returns A WeaviateComparisonResult.
     */
    visitComparison(comparison) {
        if ((0, utils_js_1.isString)(comparison.value)) {
            return {
                path: [comparison.attribute],
                operator: this.formatFunction(comparison.comparator),
                valueText: comparison.value,
            };
        }
        if ((0, utils_js_1.isInt)(comparison.value)) {
            return {
                path: [comparison.attribute],
                operator: this.formatFunction(comparison.comparator),
                valueInt: parseInt(comparison.value, 10),
            };
        }
        if ((0, utils_js_1.isFloat)(comparison.value)) {
            return {
                path: [comparison.attribute],
                operator: this.formatFunction(comparison.comparator),
                valueNumber: parseFloat(comparison.value),
            };
        }
        throw new Error("Value type is not supported");
    }
    /**
     * Visits a structured query and returns a WeaviateStructuredQueryResult.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns A WeaviateStructuredQueryResult.
     */
    visitStructuredQuery(query) {
        let nextArg = {};
        if (query.filter) {
            nextArg = {
                filter: { where: query.filter.accept(this) },
            };
        }
        return nextArg;
    }
    /**
     * Merges two filters into one. If both filters are empty, returns
     * undefined. If one filter is empty or the merge type is 'replace',
     * returns the other filter. If the merge type is 'and' or 'or', returns a
     * new filter with the merged results. Throws an error for unknown merge
     * types.
     * @param defaultFilter The default filter to merge.
     * @param generatedFilter The generated filter to merge.
     * @param mergeType The type of merge to perform. Can be 'and', 'or', or 'replace'. Defaults to 'and'.
     * @returns A merged WeaviateFilter, or undefined if both filters are empty.
     */
    mergeFilters(defaultFilter, generatedFilter, mergeType = "and") {
        if ((0, utils_js_1.isFilterEmpty)(defaultFilter?.where) &&
            (0, utils_js_1.isFilterEmpty)(generatedFilter?.where)) {
            return undefined;
        }
        if ((0, utils_js_1.isFilterEmpty)(defaultFilter?.where) || mergeType === "replace") {
            if ((0, utils_js_1.isFilterEmpty)(generatedFilter?.where)) {
                return undefined;
            }
            return generatedFilter;
        }
        if ((0, utils_js_1.isFilterEmpty)(generatedFilter?.where)) {
            if (mergeType === "and") {
                return undefined;
            }
            return defaultFilter;
        }
        const merged = {
            operator: "And",
            operands: [
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                defaultFilter.where,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                generatedFilter.where,
            ],
        };
        if (mergeType === "and") {
            return {
                where: merged,
            };
        }
        else if (mergeType === "or") {
            merged.operator = "Or";
            return {
                where: merged,
            };
        }
        else {
            throw new Error("Unknown merge type");
        }
    }
}
exports.WeaviateTranslator = WeaviateTranslator;
