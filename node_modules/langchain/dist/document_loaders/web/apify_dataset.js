/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApifyClient, } from "apify-client";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseDocumentLoader } from "../base.js";
/**
 * A class that extends the BaseDocumentLoader and implements the
 * DocumentLoader interface. It represents a document loader that loads
 * documents from an Apify dataset.
 * @example
 * ```typescript
 * const loader = new ApifyDatasetLoader("your-dataset-id", {
 *   datasetMappingFunction: (item) =>
 *     new Document({
 *       pageContent: item.text || "",
 *       metadata: { source: item.url },
 *     }),
 *   clientOptions: {
 *     token: "your-apify-token",
 *   },
 * });
 *
 * const docs = await loader.load();
 *
 * const chain = new RetrievalQAChain();
 * const res = await chain.invoke({ query: "What is LangChain?" });
 *
 * console.log(res.text);
 * console.log(res.sourceDocuments.map((d) => d.metadata.source));
 * ```
 */
export class ApifyDatasetLoader extends BaseDocumentLoader {
    constructor(datasetId, config) {
        super();
        Object.defineProperty(this, "apifyClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "datasetId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "datasetMappingFunction", {
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
        const { clientOptions, datasetMappingFunction, ...asyncCallerParams } = config;
        const token = ApifyDatasetLoader._getApifyApiToken(clientOptions);
        this.apifyClient = new ApifyClient({ ...clientOptions, token });
        this.datasetId = datasetId;
        this.datasetMappingFunction = datasetMappingFunction;
        this.caller = new AsyncCaller(asyncCallerParams);
    }
    static _getApifyApiToken(config) {
        return config?.token ?? getEnvironmentVariable("APIFY_API_TOKEN");
    }
    /**
     * Retrieves the dataset items from the Apify platform and applies the
     * datasetMappingFunction to each item to create an array of Document
     * instances.
     * @returns An array of Document instances.
     */
    async load() {
        const dataset = await this.apifyClient
            .dataset(this.datasetId)
            .listItems({ clean: true });
        const documentList = await Promise.all(dataset.items.map((item) => this.caller.call(async () => this.datasetMappingFunction(item))));
        return documentList.flat();
    }
    /**
     * Create an ApifyDatasetLoader by calling an Actor on the Apify platform and waiting for its results to be ready.
     * @param actorId The ID or name of the Actor on the Apify platform.
     * @param input The input object of the Actor that you're trying to run.
     * @param options Options specifying settings for the Actor run.
     * @param options.datasetMappingFunction A function that takes a single object (an Apify dataset item) and converts it to an instance of the Document class.
     * @returns An instance of `ApifyDatasetLoader` with the results from the Actor run.
     */
    static async fromActorCall(actorId, input, config) {
        const apifyApiToken = ApifyDatasetLoader._getApifyApiToken(config.clientOptions);
        const apifyClient = new ApifyClient({ token: apifyApiToken });
        const actorCall = await apifyClient
            .actor(actorId)
            .call(input, config.callOptions ?? {});
        return new ApifyDatasetLoader(actorCall.defaultDatasetId, {
            datasetMappingFunction: config.datasetMappingFunction,
            clientOptions: { ...config.clientOptions, token: apifyApiToken },
        });
    }
    /**
     * Create an ApifyDatasetLoader by calling a saved Actor task on the Apify platform and waiting for its results to be ready.
     * @param taskId The ID or name of the task on the Apify platform.
     * @param input The input object of the task that you're trying to run. Overrides the task's saved input.
     * @param options Options specifying settings for the task run.
     * @param options.datasetMappingFunction A function that takes a single object (an Apify dataset item) and converts it to an instance of the Document class.
     * @returns An instance of `ApifyDatasetLoader` with the results from the task's run.
     */
    static async fromActorTaskCall(taskId, input, config) {
        const apifyApiToken = ApifyDatasetLoader._getApifyApiToken(config.clientOptions);
        const apifyClient = new ApifyClient({ token: apifyApiToken });
        const taskCall = await apifyClient
            .task(taskId)
            .call(input, config.callOptions ?? {});
        return new ApifyDatasetLoader(taskCall.defaultDatasetId, {
            datasetMappingFunction: config.datasetMappingFunction,
            clientOptions: { ...config.clientOptions, token: apifyApiToken },
        });
    }
}
