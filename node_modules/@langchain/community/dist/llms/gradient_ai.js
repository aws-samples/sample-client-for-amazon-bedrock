import { Gradient } from "@gradientai/nodejs-sdk";
import { LLM, } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * The GradientLLM class is used to interact with Gradient AI inference Endpoint models.
 * This requires your Gradient AI Access Token which is autoloaded if not specified.
 */
export class GradientLLM extends LLM {
    static lc_name() {
        return "GradientLLM";
    }
    get lc_secrets() {
        return {
            gradientAccessKey: "GRADIENT_ACCESS_TOKEN",
            workspaceId: "GRADIENT_WORKSPACE_ID",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "modelSlug", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "llama2-7b-chat"
        });
        Object.defineProperty(this, "adapterId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gradientAccessKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "workspaceId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inferenceParameters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        // Gradient AI does not export the BaseModel type. Once it does, we can use it here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.modelSlug = fields?.modelSlug ?? this.modelSlug;
        this.adapterId = fields?.adapterId;
        this.gradientAccessKey =
            fields?.gradientAccessKey ??
                getEnvironmentVariable("GRADIENT_ACCESS_TOKEN");
        this.workspaceId =
            fields?.workspaceId ?? getEnvironmentVariable("GRADIENT_WORKSPACE_ID");
        this.inferenceParameters = fields.inferenceParameters;
        if (!this.gradientAccessKey) {
            throw new Error("Missing Gradient AI Access Token");
        }
        if (!this.workspaceId) {
            throw new Error("Missing Gradient AI Workspace ID");
        }
    }
    _llmType() {
        return "gradient_ai";
    }
    /**
     * Calls the Gradient AI endpoint and retrieves the result.
     * @param {string} prompt The input prompt.
     * @returns {Promise<string>} A promise that resolves to the generated string.
     */
    /** @ignore */
    async _call(prompt, _options) {
        await this.setModel();
        const response = (await this.caller.call(async () => this.model.complete({
            query: prompt,
            ...this.inferenceParameters,
        })));
        return response.generatedOutput;
    }
    async setModel() {
        if (this.model)
            return;
        const gradient = new Gradient({
            accessToken: this.gradientAccessKey,
            workspaceId: this.workspaceId,
        });
        if (this.adapterId) {
            this.model = await gradient.getModelAdapter({
                modelAdapterId: this.adapterId,
            });
        }
        else {
            this.model = await gradient.getBaseModel({
                baseModelSlug: this.modelSlug,
            });
        }
    }
}
