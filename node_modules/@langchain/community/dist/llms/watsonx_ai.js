import { LLM, } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
const endpointConstructor = (region, version) => `https://${region}.ml.cloud.ibm.com/ml/v1-beta/generation/text?version=${version}`;
/**
 * The WatsonxAI class is used to interact with Watsonx AI
 * Inference Endpoint models. It uses IBM Cloud for authentication.
 * This requires your IBM Cloud API Key which is autoloaded if not specified.
 */
export class WatsonxAI extends LLM {
    static lc_name() {
        return "WatsonxAI";
    }
    get lc_secrets() {
        return {
            ibmCloudApiKey: "IBM_CLOUD_API_KEY",
            projectId: "WATSONX_PROJECT_ID",
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
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "region", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "us-south"
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "2023-05-29"
        });
        Object.defineProperty(this, "modelId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "meta-llama/llama-2-70b-chat"
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ibmCloudApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ibmCloudToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ibmCloudTokenExpiresAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "projectId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelParameters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.region = fields?.region ?? this.region;
        this.version = fields?.version ?? this.version;
        this.modelId = fields?.modelId ?? this.modelId;
        this.ibmCloudApiKey =
            fields?.ibmCloudApiKey ?? getEnvironmentVariable("IBM_CLOUD_API_KEY");
        this.projectId =
            fields?.projectId ?? getEnvironmentVariable("WATSONX_PROJECT_ID");
        this.endpoint =
            fields?.endpoint ?? endpointConstructor(this.region, this.version);
        this.modelParameters = fields.modelParameters;
        if (!this.ibmCloudApiKey) {
            throw new Error("Missing IBM Cloud API Key");
        }
        if (!this.projectId) {
            throw new Error("Missing WatsonX AI Project ID");
        }
    }
    _llmType() {
        return "watsonx_ai";
    }
    /**
     * Calls the WatsonX AI endpoint and retrieves the result.
     * @param {string} prompt The input prompt.
     * @returns {Promise<string>} A promise that resolves to the generated string.
     */
    /** @ignore */
    async _call(prompt, _options) {
        const response = (await this.caller.call(async () => fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${await this.generateToken()}`,
            },
            body: JSON.stringify({
                project_id: this.projectId,
                model_id: this.modelId,
                input: prompt,
                parameters: this.modelParameters,
            }),
        }).then((res) => res.json())));
        /**
         * Handle Errors for invalid requests.
         */
        if (response.errors) {
            throw new Error(response.errors[0].message);
        }
        return response.results[0].generated_text;
    }
    async generateToken() {
        if (this.ibmCloudToken && this.ibmCloudTokenExpiresAt) {
            if (this.ibmCloudTokenExpiresAt > Date.now()) {
                return this.ibmCloudToken;
            }
        }
        const urlTokenParams = new URLSearchParams();
        urlTokenParams.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
        urlTokenParams.append("apikey", this.ibmCloudApiKey);
        const data = (await fetch("https://iam.cloud.ibm.com/identity/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: urlTokenParams,
        }).then((res) => res.json()));
        this.ibmCloudTokenExpiresAt = data.expiration * 1000;
        this.ibmCloudToken = data.access_token;
        return this.ibmCloudToken;
    }
}
