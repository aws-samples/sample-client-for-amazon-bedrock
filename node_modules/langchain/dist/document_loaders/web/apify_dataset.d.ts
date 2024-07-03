import { ActorCallOptions, ApifyClient, ApifyClientOptions, TaskCallOptions } from "apify-client";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader, DocumentLoader } from "../base.js";
/**
 * A type that represents a function that takes a single object (an Apify
 * dataset item) and converts it to an instance of the Document class.
 *
 * Change function signature to only be asynchronous for simplicity in v0.1.0
 * https://github.com/langchain-ai/langchainjs/pull/3262
 */
export type ApifyDatasetMappingFunction<Metadata extends Record<string, any>> = (item: Record<string | number, unknown>) => Document<Metadata> | Array<Document<Metadata>> | Promise<Document<Metadata> | Array<Document<Metadata>>>;
export interface ApifyDatasetLoaderConfig<Metadata extends Record<string, any>> extends AsyncCallerParams {
    datasetMappingFunction: ApifyDatasetMappingFunction<Metadata>;
    clientOptions?: ApifyClientOptions;
}
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
export declare class ApifyDatasetLoader<Metadata extends Record<string, any>> extends BaseDocumentLoader implements DocumentLoader {
    protected apifyClient: ApifyClient;
    protected datasetId: string;
    protected datasetMappingFunction: ApifyDatasetMappingFunction<Metadata>;
    protected caller: AsyncCaller;
    constructor(datasetId: string, config: ApifyDatasetLoaderConfig<Metadata>);
    private static _getApifyApiToken;
    /**
     * Retrieves the dataset items from the Apify platform and applies the
     * datasetMappingFunction to each item to create an array of Document
     * instances.
     * @returns An array of Document instances.
     */
    load(): Promise<Document<Metadata>[]>;
    /**
     * Create an ApifyDatasetLoader by calling an Actor on the Apify platform and waiting for its results to be ready.
     * @param actorId The ID or name of the Actor on the Apify platform.
     * @param input The input object of the Actor that you're trying to run.
     * @param options Options specifying settings for the Actor run.
     * @param options.datasetMappingFunction A function that takes a single object (an Apify dataset item) and converts it to an instance of the Document class.
     * @returns An instance of `ApifyDatasetLoader` with the results from the Actor run.
     */
    static fromActorCall<Metadata extends Record<string, any>>(actorId: string, input: Record<string | number, unknown>, config: {
        callOptions?: ActorCallOptions;
        clientOptions?: ApifyClientOptions;
        datasetMappingFunction: ApifyDatasetMappingFunction<Metadata>;
    }): Promise<ApifyDatasetLoader<Metadata>>;
    /**
     * Create an ApifyDatasetLoader by calling a saved Actor task on the Apify platform and waiting for its results to be ready.
     * @param taskId The ID or name of the task on the Apify platform.
     * @param input The input object of the task that you're trying to run. Overrides the task's saved input.
     * @param options Options specifying settings for the task run.
     * @param options.datasetMappingFunction A function that takes a single object (an Apify dataset item) and converts it to an instance of the Document class.
     * @returns An instance of `ApifyDatasetLoader` with the results from the task's run.
     */
    static fromActorTaskCall<Metadata extends Record<string, any>>(taskId: string, input: Record<string | number, unknown>, config: {
        callOptions?: TaskCallOptions;
        clientOptions?: ApifyClientOptions;
        datasetMappingFunction: ApifyDatasetMappingFunction<Metadata>;
    }): Promise<ApifyDatasetLoader<Metadata>>;
}
