import { dereference } from "./dereference.js";
import { validate } from "./validate.js";
export class Validator {
    constructor(schema, draft = "2019-09", shortCircuit = true) {
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: schema
        });
        Object.defineProperty(this, "draft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: draft
        });
        Object.defineProperty(this, "shortCircuit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: shortCircuit
        });
        Object.defineProperty(this, "lookup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.lookup = dereference(schema);
    }
    validate(instance) {
        return validate(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
    }
    addSchema(schema, id) {
        if (id) {
            schema = { ...schema, $id: id };
        }
        dereference(schema, this.lookup);
    }
}
