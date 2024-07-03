"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Replicate = void 0;
const llms_1 = require("@langchain/core/language_models/llms");
const env_1 = require("@langchain/core/utils/env");
/**
 * Class responsible for managing the interaction with the Replicate API.
 * It handles the API key and model details, makes the actual API calls,
 * and converts the API response into a format usable by the rest of the
 * LangChain framework.
 * @example
 * ```typescript
 * const model = new Replicate({
 *   model: "replicate/flan-t5-xl:3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523",
 * });
 *
 * const res = await model.invoke(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 */
class Replicate extends llms_1.LLM {
    static lc_name() {
        return "Replicate";
    }
    get lc_secrets() {
        return {
            apiKey: "REPLICATE_API_TOKEN",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "input", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "promptKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey ??
            (0, env_1.getEnvironmentVariable)("REPLICATE_API_KEY") ?? // previous environment variable for backwards compatibility
            (0, env_1.getEnvironmentVariable)("REPLICATE_API_TOKEN"); // current environment variable, matching the Python library
        if (!apiKey) {
            throw new Error("Please set the REPLICATE_API_TOKEN environment variable");
        }
        this.apiKey = apiKey;
        this.model = fields.model;
        this.input = fields.input ?? {};
        this.promptKey = fields.promptKey;
    }
    _llmType() {
        return "replicate";
    }
    /** @ignore */
    async _call(prompt, options) {
        const imports = await Replicate.imports();
        const replicate = new imports.Replicate({
            userAgent: "langchain",
            auth: this.apiKey,
        });
        if (this.promptKey === undefined) {
            const [modelString, versionString] = this.model.split(":");
            const version = await replicate.models.versions.get(modelString.split("/")[0], modelString.split("/")[1], versionString);
            const openapiSchema = version.openapi_schema;
            const inputProperties = 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            openapiSchema?.components?.schemas?.Input?.properties;
            if (inputProperties === undefined) {
                this.promptKey = "prompt";
            }
            else {
                const sortedInputProperties = Object.entries(inputProperties).sort(([_keyA, valueA], [_keyB, valueB]) => {
                    const orderA = valueA["x-order"] || 0;
                    const orderB = valueB["x-order"] || 0;
                    return orderA - orderB;
                });
                this.promptKey = sortedInputProperties[0][0] ?? "prompt";
            }
        }
        const output = await this.caller.callWithOptions({ signal: options.signal }, () => replicate.run(this.model, {
            input: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                [this.promptKey]: prompt,
                ...this.input,
            },
        }));
        if (typeof output === "string") {
            return output;
        }
        else if (Array.isArray(output)) {
            return output.join("");
        }
        else {
            // Note this is a little odd, but the output format is not consistent
            // across models, so it makes some amount of sense.
            return String(output);
        }
    }
    /** @ignore */
    static async imports() {
        try {
            const { default: Replicate } = await import("replicate");
            return { Replicate };
        }
        catch (e) {
            throw new Error("Please install replicate as a dependency with, e.g. `yarn add replicate`");
        }
    }
}
exports.Replicate = Replicate;
