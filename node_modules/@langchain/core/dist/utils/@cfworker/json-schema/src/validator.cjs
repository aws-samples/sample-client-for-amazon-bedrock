"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const dereference_js_1 = require("./dereference.cjs");
const validate_js_1 = require("./validate.cjs");
class Validator {
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
        this.lookup = (0, dereference_js_1.dereference)(schema);
    }
    validate(instance) {
        return (0, validate_js_1.validate)(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
    }
    addSchema(schema, id) {
        if (id) {
            schema = { ...schema, $id: id };
        }
        (0, dereference_js_1.dereference)(schema, this.lookup);
    }
}
exports.Validator = Validator;
