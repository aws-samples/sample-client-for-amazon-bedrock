"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectaraTranslator = void 0;
const ir_js_1 = require("../../chains/query_constructor/ir.cjs");
const base_js_1 = require("./base.cjs");
const utils_js_1 = require("./utils.cjs");
function processValue(value) {
    /** Convert a value to a string and add single quotes if it is a string. */
    if (typeof value === "string") {
        return `'${value}'`;
    }
    else {
        return String(value);
    }
}
class VectaraTranslator extends base_js_1.BaseTranslator {
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
        const mapDict = {
            and: " and ",
            or: " or ",
            eq: "=",
            ne: "!=",
            lt: "<",
            lte: "<=",
            gt: ">",
            gte: ">=",
        };
        return mapDict[func];
    }
    /**
     * Visits an operation and returns a VectaraOperationResult. The
     * operation's arguments are visited and the operator is formatted.
     * @param operation The operation to visit.
     * @returns A VectaraOperationResult.
     */
    visitOperation(operation) {
        const args = operation.args?.map((arg) => arg.accept(this));
        const operator = this.formatFunction(operation.operator);
        return `( ${args.join(operator)} )`;
    }
    /**
     * Visits a comparison and returns a VectaraComparisonResult. The
     * comparison's value is checked for type and the comparator is formatted.
     * Throws an error if the value type is not supported.
     * @param comparison The comparison to visit.
     * @returns A VectaraComparisonResult.
     */
    visitComparison(comparison) {
        const comparator = this.formatFunction(comparison.comparator);
        return `( doc.${comparison.attribute} ${comparator} ${processValue(comparison.value)} )`;
    }
    /**
     * Visits a structured query and returns a VectaraStructuredQueryResult.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns A VectaraStructuredQueryResult.
     */
    visitStructuredQuery(query) {
        let nextArg = {};
        if (query.filter) {
            nextArg = {
                filter: { filter: query.filter.accept(this) },
            };
        }
        return nextArg;
    }
    mergeFilters(defaultFilter, generatedFilter, mergeType = "and", forceDefaultFilter = false) {
        if ((0, utils_js_1.isFilterEmpty)(defaultFilter) && (0, utils_js_1.isFilterEmpty)(generatedFilter)) {
            return undefined;
        }
        if ((0, utils_js_1.isFilterEmpty)(defaultFilter) || mergeType === "replace") {
            if ((0, utils_js_1.isFilterEmpty)(generatedFilter)) {
                return undefined;
            }
            return generatedFilter;
        }
        if ((0, utils_js_1.isFilterEmpty)(generatedFilter)) {
            if (forceDefaultFilter) {
                return defaultFilter;
            }
            if (mergeType === "and") {
                return undefined;
            }
            return defaultFilter;
        }
        if (mergeType === "and") {
            return {
                filter: `${defaultFilter} and ${generatedFilter}`,
            };
        }
        else if (mergeType === "or") {
            return {
                filter: `${defaultFilter} or ${generatedFilter}`,
            };
        }
        else {
            throw new Error("Unknown merge type");
        }
    }
}
exports.VectaraTranslator = VectaraTranslator;
