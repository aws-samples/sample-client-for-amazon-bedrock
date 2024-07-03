"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerSuiteHub = exports.DriveFileReadConnection = exports.MakerSuitePrompt = void 0;
const google_auth_library_1 = require("google-auth-library");
const googlepalm_1 = require("@langchain/community/chat_models/googlepalm");
const googlepalm_2 = require("@langchain/community/llms/googlepalm");
const prompts_1 = require("@langchain/core/prompts");
const async_caller_1 = require("@langchain/core/utils/async_caller");
const googlevertexai_connection_js_1 = require("../../../util/googlevertexai-connection.cjs");
/**
 * A class that represents the Prompt that has been created by MakerSuite
 * and loaded from Google Drive. It exposes methods to turn this prompt
 * into a Template, a Model, and into a chain consisting of these two elements.
 * In general, this class should be created by the MakerSuiteHub class and
 * not instantiated manually.
 */
class MakerSuitePrompt {
    constructor(promptData) {
        Object.defineProperty(this, "promptType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "promptData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.promptData = promptData;
        this._determinePromptType();
    }
    _determinePromptType() {
        if (Object.hasOwn(this.promptData, "textPrompt")) {
            this.promptType = "text";
        }
        else if (Object.hasOwn(this.promptData, "dataPrompt")) {
            this.promptType = "data";
        }
        else if (Object.hasOwn(this.promptData, "multiturnPrompt")) {
            this.promptType = "chat";
        }
        else {
            const error = new Error("Unable to identify prompt type.");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.promptData = this.promptData;
            throw error;
        }
    }
    _promptValueText() {
        return (this.promptData?.textPrompt?.value ?? "");
    }
    _promptValueData() {
        const promptData = this
            .promptData;
        const dataPrompt = promptData?.dataPrompt;
        let prompt = `${dataPrompt?.preamble}\n` || "";
        dataPrompt?.rows.forEach((row) => {
            // Add the data for each row, as long as it is listed as used
            if (dataPrompt?.rowsUsed.includes(row.rowId)) {
                // Add each input column
                dataPrompt?.columns.forEach((column) => {
                    if (column.isInput) {
                        prompt += `${column.displayName} ${row.columnBindings[column.columnId]}\n`;
                    }
                });
                // Add each output column
                dataPrompt?.columns.forEach((column) => {
                    if (!column.isInput) {
                        prompt += `${column.displayName} ${row.columnBindings[column.columnId]}\n`;
                    }
                });
            }
        });
        // Add the input column prompts
        dataPrompt?.columns.forEach((column) => {
            if (column.isInput) {
                prompt += `${column.displayName} {${column.displayName.replace(":", "")}}\n`;
            }
        });
        // Add just the first output column
        const firstOutput = dataPrompt?.columns.find((column) => !column.isInput);
        prompt += `${firstOutput?.displayName} `;
        return prompt;
    }
    _promptValueChat() {
        return (this.promptData?.multiturnPrompt
            ?.preamble ?? "");
    }
    _promptValue() {
        switch (this.promptType) {
            case "text":
                return this._promptValueText();
            case "data":
                return this._promptValueData();
            case "chat":
                return this._promptValueChat();
            default:
                throw new Error(`Invalid promptType: ${this.promptType}`);
        }
    }
    /**
     * Create a template from the prompt, including any "test input" specified
     * in MakerSuite as a template parameter.
     */
    toTemplate() {
        const value = this._promptValue();
        const promptString = value.replaceAll(/{{.*:(.+):.*}}/g, "{$1}");
        return prompts_1.PromptTemplate.fromTemplate(promptString);
    }
    _modelName() {
        let ret = this.promptData?.runSettings?.model;
        if (!ret) {
            ret =
                this.promptType === "chat"
                    ? "models/chat-bison-001"
                    : "models/text-bison-001";
        }
        return ret;
    }
    _examples() {
        const promptData = this
            .promptData;
        const ret = promptData?.multiturnPrompt?.primingExchanges
            .map((exchange) => {
            const example = {};
            if (exchange?.request) {
                example.input = {
                    content: exchange.request,
                };
            }
            if (exchange?.response) {
                example.output = {
                    content: exchange.response,
                };
            }
            return example;
        })
            .filter((value) => Object.keys(value).length);
        return ret;
    }
    /**
     * Create a model from the prompt with all the parameters (model name,
     * temperature, etc) set as they were in MakerSuite.
     */
    toModel() {
        const modelName = this._modelName();
        const modelSettings = {
            modelName,
            ...this.promptData?.runSettings,
        };
        if (this.promptType === "chat") {
            const examples = this._examples();
            return new googlepalm_1.ChatGooglePaLM({
                examples,
                ...modelSettings,
            });
        }
        else {
            return new googlepalm_2.GooglePaLM(modelSettings);
        }
    }
    /**
     * Create a RunnableSequence based on the template and model that can
     * be created from this prompt. The template will have parameters available
     * based on the "test input" that was set in MakerSuite, and the model
     * will have the parameters (model name, temperature, etc) from those in
     * MakerSuite.
     */
    toChain() {
        return this.toTemplate().pipe(this.toModel());
    }
}
exports.MakerSuitePrompt = MakerSuitePrompt;
class DriveFileReadConnection extends googlevertexai_connection_js_1.GoogleConnection {
    constructor(fields, caller) {
        super(caller, new google_auth_library_1.GoogleAuth({
            scopes: "https://www.googleapis.com/auth/drive.readonly",
            ...fields.authOptions,
        }));
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fileId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.endpoint = fields.endpoint ?? "www.googleapis.com";
        this.apiVersion = fields.apiVersion ?? "v3";
        this.fileId = fields.fileId;
    }
    async buildUrl() {
        return `https://${this.endpoint}/drive/${this.apiVersion}/files/${this.fileId}?alt=media`;
    }
    buildMethod() {
        return "GET";
    }
    async request(options) {
        return this._request(undefined, options ?? {});
    }
}
exports.DriveFileReadConnection = DriveFileReadConnection;
/**
 * A class allowing access to MakerSuite prompts that have been saved in
 * Google Drive.
 * MakerSuite prompts are pulled based on their Google Drive ID (which is available
 * from Google Drive or as part of the URL when the prompt is open in MakerSuite).
 * There is a basic cache that will store the prompt in memory for a time specified
 * in milliseconds. This defaults to 0, indicating the prompt should always be
 * pulled from Google Drive.
 */
class MakerSuiteHub {
    constructor(config) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "cacheTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.cacheTimeout = config?.cacheTimeout ?? 0;
        this.caller = config?.caller ?? new async_caller_1.AsyncCaller({});
    }
    /**
     * Is the current cache entry valid, or does it need to be refreshed.
     * It will need to be refreshed under any of the following conditions:
     * - It does not currently exist in the cache
     * - The cacheTimeout is 0
     * - The cache was last updated longer ago than the cacheTimeout allows
     * @param entry - The cache entry, including when this prompt was last refreshed
     */
    isValid(entry) {
        // If we don't have a record, it can't be valid
        // And if the cache timeout is 0, we will always refresh, so the cache is invalid
        if (!entry || this.cacheTimeout === 0) {
            return false;
        }
        const now = Date.now();
        const expiration = entry.updated + this.cacheTimeout;
        return expiration > now;
    }
    /**
     * Get a MakerSuitePrompt that is specified by the Google Drive ID.
     * This will always be loaded from Google Drive.
     * @param id
     * @return A MakerSuitePrompt which can be used to create a template, model, or chain.
     */
    async forcePull(id) {
        const fields = {
            fileId: id,
        };
        const connection = new DriveFileReadConnection(fields, this.caller);
        const result = await connection.request();
        const ret = new MakerSuitePrompt(result.data);
        this.cache[id] = {
            prompt: ret,
            updated: Date.now(),
        };
        return ret;
    }
    /**
     * Get a MakerSuitePrompt that is specified by the Google Drive ID. This may be
     * loaded from Google Drive or, if there is a valid copy in the cache, the cached
     * copy will be returned.
     * @param id
     * @return A MakerSuitePrompt which can be used to create a template, model, or chain.
     */
    async pull(id) {
        const entry = this.cache[id];
        const ret = this.isValid(entry) ? entry.prompt : await this.forcePull(id);
        return ret;
    }
}
exports.MakerSuiteHub = MakerSuiteHub;
