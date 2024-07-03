import { VectaraFilter, VectaraStore } from "@langchain/community/vectorstores/vectara";
import { Comparator, Comparison, Operation, Operator, StructuredQuery } from "../../chains/query_constructor/ir.js";
import { BaseTranslator } from "./base.js";
export type VectaraVisitorResult = VectaraOperationResult | VectaraComparisonResult | VectaraVisitorStructuredQueryResult;
export type VectaraOperationResult = String;
export type VectaraComparisonResult = String;
export type VectaraVisitorStructuredQueryResult = {
    filter?: {
        filter?: VectaraOperationResult | VectaraComparisonResult;
    };
};
export declare class VectaraTranslator<T extends VectaraStore> extends BaseTranslator<T> {
    VisitOperationOutput: VectaraOperationResult;
    VisitComparisonOutput: VectaraComparisonResult;
    allowedOperators: Operator[];
    allowedComparators: Comparator[];
    formatFunction(func: Operator | Comparator): string;
    /**
     * Visits an operation and returns a VectaraOperationResult. The
     * operation's arguments are visited and the operator is formatted.
     * @param operation The operation to visit.
     * @returns A VectaraOperationResult.
     */
    visitOperation(operation: Operation): this["VisitOperationOutput"];
    /**
     * Visits a comparison and returns a VectaraComparisonResult. The
     * comparison's value is checked for type and the comparator is formatted.
     * Throws an error if the value type is not supported.
     * @param comparison The comparison to visit.
     * @returns A VectaraComparisonResult.
     */
    visitComparison(comparison: Comparison): this["VisitComparisonOutput"];
    /**
     * Visits a structured query and returns a VectaraStructuredQueryResult.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns A VectaraStructuredQueryResult.
     */
    visitStructuredQuery(query: StructuredQuery): this["VisitStructuredQueryOutput"];
    mergeFilters(defaultFilter: VectaraFilter | undefined, generatedFilter: VectaraFilter | undefined, mergeType?: string, forceDefaultFilter?: boolean): VectaraFilter | undefined;
}
