import { RemoteRetriever, } from "@langchain/community/retrievers/remote";
import { Document } from "@langchain/core/documents";
/**
 * @deprecated Use RemoteRetriever instead.
 * Specific implementation of the `RemoteRetriever` class designed to
 * retrieve documents from a remote source using a JSON-based API. It
 * implements the `RemoteLangChainRetrieverParams` interface which defines
 * the keys used to interact with the JSON API.
 */
export class RemoteLangChainRetriever extends RemoteRetriever {
    constructor({ inputKey = "message", responseKey = "response", pageContentKey = "page_content", metadataKey = "metadata", ...rest }) {
        super(rest);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "remote", "remote-retriever"]
        });
        Object.defineProperty(this, "inputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "responseKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pageContentKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metadataKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.inputKey = inputKey;
        this.responseKey = responseKey;
        this.pageContentKey = pageContentKey;
        this.metadataKey = metadataKey;
    }
    /**
     * Creates the JSON body of the request sent to the API. The `inputKey` is
     * set to the query.
     * @param query Query string to be sent to the API.
     * @returns An object with the `inputKey` set to the query.
     */
    createJsonBody(query) {
        return {
            [this.inputKey]: query,
        };
    }
    /**
     * Processes the JSON response from the API. It returns an array of
     * `Document` objects, each created with the page content and metadata
     * extracted from the response using the `pageContentKey` and
     * `metadataKey`, respectively.
     * @param json JSON response from the API.
     * @returns An array of `Document` objects.
     */
    processJsonResponse(json) {
        return json[this.responseKey].map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r) => new Document({
            pageContent: r[this.pageContentKey],
            metadata: r[this.metadataKey],
        }));
    }
}
