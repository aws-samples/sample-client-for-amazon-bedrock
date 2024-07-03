import { Schema, SchemaDraft } from "./types.js";
export declare class Validator {
    private readonly schema;
    private readonly draft;
    private readonly shortCircuit;
    private readonly lookup;
    constructor(schema: Schema | boolean, draft?: SchemaDraft, shortCircuit?: boolean);
    validate(instance: any): import("./types.js").ValidationResult;
    addSchema(schema: Schema, id?: string): void;
}
