import { WeaviateFilter, WeaviateStore } from "@langchain/community/vectorstores/weaviate";
import { Comparator, Comparison, Operation, Operator, StructuredQuery } from "../../chains/query_constructor/ir.js";
import { BaseTranslator } from "./base.js";
type WeaviateOperatorValues = {
    valueText: string;
    valueInt: number;
    valueNumber: number;
    valueBoolean: boolean;
};
type WeaviateOperatorKeys = keyof WeaviateOperatorValues;
type ExclusiveOperatorValue = {
    [L in WeaviateOperatorKeys]: {
        [key in L]: WeaviateOperatorValues[key];
    } & Omit<{
        [key in WeaviateOperatorKeys]?: never;
    }, L>;
}[WeaviateOperatorKeys];
export type WeaviateVisitorResult = WeaviateOperationResult | WeaviateComparisonResult | WeaviateStructuredQueryResult;
export type WeaviateOperationResult = {
    operator: string;
    operands: WeaviateVisitorResult[];
};
export type WeaviateComparisonResult = {
    path: [string];
    operator: string;
} & ExclusiveOperatorValue;
export type WeaviateStructuredQueryResult = {
    filter?: {
        where?: WeaviateComparisonResult | WeaviateOperationResult;
    };
};
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
export declare class WeaviateTranslator<T extends WeaviateStore> extends BaseTranslator<T> {
    VisitOperationOutput: WeaviateOperationResult;
    VisitComparisonOutput: WeaviateComparisonResult;
    allowedOperators: Operator[];
    allowedComparators: Comparator[];
    /**
     * Formats the given function into a string representation. Throws an
     * error if the function is not a known comparator or operator, or if it
     * is not allowed.
     * @param func The function to format, which can be an Operator or Comparator.
     * @returns A string representation of the function.
     */
    formatFunction(func: Operator | Comparator): string;
    /**
     * Visits an operation and returns a WeaviateOperationResult. The
     * operation's arguments are visited and the operator is formatted.
     * @param operation The operation to visit.
     * @returns A WeaviateOperationResult.
     */
    visitOperation(operation: Operation): this["VisitOperationOutput"];
    /**
     * Visits a comparison and returns a WeaviateComparisonResult. The
     * comparison's value is checked for type and the comparator is formatted.
     * Throws an error if the value type is not supported.
     * @param comparison The comparison to visit.
     * @returns A WeaviateComparisonResult.
     */
    visitComparison(comparison: Comparison): this["VisitComparisonOutput"];
    /**
     * Visits a structured query and returns a WeaviateStructuredQueryResult.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns A WeaviateStructuredQueryResult.
     */
    visitStructuredQuery(query: StructuredQuery): this["VisitStructuredQueryOutput"];
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
    mergeFilters(defaultFilter: WeaviateFilter | undefined, generatedFilter: WeaviateFilter | undefined, mergeType?: string): WeaviateFilter | undefined;
}
export {};
