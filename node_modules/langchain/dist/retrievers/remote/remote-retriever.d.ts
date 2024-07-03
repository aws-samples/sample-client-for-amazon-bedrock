import { RemoteRetriever, RemoteRetrieverParams, RemoteRetrieverValues } from "@langchain/community/retrievers/remote";
import { Document } from "@langchain/core/documents";
/** @deprecated */
export interface RemoteLangChainRetrieverParams extends RemoteRetrieverParams {
    /**
     * The key in the JSON body to put the query in
     */
    inputKey?: string;
    /**
     * The key in the JSON response to get the response from
     */
    responseKey?: string;
    /**
     * The key in the JSON response to get the page content from
     */
    pageContentKey?: string;
    /**
     * The key in the JSON response to get the metadata from
     */
    metadataKey?: string;
}
/**
 * @deprecated Use RemoteRetriever instead.
 * Specific implementation of the `RemoteRetriever` class designed to
 * retrieve documents from a remote source using a JSON-based API. It
 * implements the `RemoteLangChainRetrieverParams` interface which defines
 * the keys used to interact with the JSON API.
 */
export declare class RemoteLangChainRetriever extends RemoteRetriever implements RemoteLangChainRetrieverParams {
    lc_namespace: string[];
    inputKey: string;
    responseKey: string;
    pageContentKey: string;
    metadataKey: string;
    constructor({ inputKey, responseKey, pageContentKey, metadataKey, ...rest }: RemoteLangChainRetrieverParams);
    /**
     * Creates the JSON body of the request sent to the API. The `inputKey` is
     * set to the query.
     * @param query Query string to be sent to the API.
     * @returns An object with the `inputKey` set to the query.
     */
    createJsonBody(query: string): RemoteRetrieverValues;
    /**
     * Processes the JSON response from the API. It returns an array of
     * `Document` objects, each created with the page content and metadata
     * extracted from the response using the `pageContentKey` and
     * `metadataKey`, respectively.
     * @param json JSON response from the API.
     * @returns An array of `Document` objects.
     */
    processJsonResponse(json: RemoteRetrieverValues): Document[];
}
