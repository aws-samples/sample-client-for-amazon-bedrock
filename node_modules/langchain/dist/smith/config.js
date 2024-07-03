export function isOffTheShelfEvaluator(evaluator) {
    return typeof evaluator === "string" || "evaluatorType" in evaluator;
}
export function isCustomEvaluator(evaluator) {
    return !isOffTheShelfEvaluator(evaluator);
}
const isStringifiableValue = (value) => typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint";
const getSingleStringifiedValue = (value) => {
    if (isStringifiableValue(value)) {
        return `${value}`;
    }
    if (typeof value === "object" && value != null && !Array.isArray(value)) {
        const entries = Object.entries(value);
        if (entries.length === 1 && isStringifiableValue(entries[0][1])) {
            return `${entries[0][1]}`;
        }
    }
    console.warn("Non-stringifiable value found when coercing", value);
    return `${value}`;
};
export function Criteria(criteria, config) {
    const formatEvaluatorInputs = config?.formatEvaluatorInputs ??
        ((payload) => ({
            prediction: getSingleStringifiedValue(payload.rawPrediction),
            input: getSingleStringifiedValue(payload.rawInput),
        }));
    return {
        evaluatorType: "criteria",
        criteria,
        feedbackKey: config?.feedbackKey ?? criteria,
        llm: config?.llm,
        formatEvaluatorInputs,
    };
}
export function LabeledCriteria(criteria, config) {
    const formatEvaluatorInputs = config?.formatEvaluatorInputs ??
        ((payload) => ({
            prediction: getSingleStringifiedValue(payload.rawPrediction),
            input: getSingleStringifiedValue(payload.rawInput),
            reference: getSingleStringifiedValue(payload.rawReferenceOutput),
        }));
    return {
        evaluatorType: "labeled_criteria",
        criteria,
        feedbackKey: config?.feedbackKey ?? criteria,
        llm: config?.llm,
        formatEvaluatorInputs,
    };
}
export function EmbeddingDistance(distanceMetric, config) {
    const formatEvaluatorInputs = config?.formatEvaluatorInputs ??
        ((payload) => ({
            prediction: getSingleStringifiedValue(payload.rawPrediction),
            reference: getSingleStringifiedValue(payload.rawReferenceOutput),
        }));
    return {
        evaluatorType: "embedding_distance",
        embedding: config?.embedding,
        distanceMetric,
        feedbackKey: config?.feedbackKey ?? "embedding_distance",
        formatEvaluatorInputs,
    };
}
