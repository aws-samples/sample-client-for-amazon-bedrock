import { AttributeFilter, DocumentAttribute, DocumentAttributeValue, KendraClient, KendraClientConfig, QueryCommandOutput, QueryResultItem, RetrieveCommandOutput, RetrieveResultItem } from "@aws-sdk/client-kendra";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
/**
 * Interface for the arguments required to initialize an
 * AmazonKendraRetriever instance.
 */
export interface AmazonKendraRetrieverArgs {
    indexId: string;
    topK: number;
    region: string;
    attributeFilter?: AttributeFilter;
    clientOptions?: KendraClientConfig;
}
/**
 * Class for interacting with Amazon Kendra, an intelligent search service
 * provided by AWS. Extends the BaseRetriever class.
 * @example
 * ```typescript
 * const retriever = new AmazonKendraRetriever({
 *   topK: 10,
 *   indexId: "YOUR_INDEX_ID",
 *   region: "us-east-2",
 *   clientOptions: {
 *     credentials: {
 *       accessKeyId: "YOUR_ACCESS_KEY_ID",
 *       secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
 *     },
 *   },
 * });
 *
 * const docs = await retriever.getRelevantDocuments("How are clouds formed?");
 * ```
 */
export declare class AmazonKendraRetriever extends BaseRetriever {
    static lc_name(): string;
    lc_namespace: string[];
    indexId: string;
    topK: number;
    kendraClient: KendraClient;
    attributeFilter?: AttributeFilter;
    constructor({ indexId, topK, clientOptions, attributeFilter, region, }: AmazonKendraRetrieverArgs);
    /**
     * Combines title and excerpt into a single string.
     * @param title The title of the document.
     * @param excerpt An excerpt from the document.
     * @returns A single string combining the title and excerpt.
     */
    combineText(title?: string, excerpt?: string): string;
    /**
     * Cleans the result text by replacing sequences of whitespace with a
     * single space and removing ellipses.
     * @param resText The result text to clean.
     * @returns The cleaned result text.
     */
    cleanResult(resText: string): string;
    /**
     * Extracts the attribute value from a DocumentAttributeValue object.
     * @param value The DocumentAttributeValue object to extract the value from.
     * @returns The extracted attribute value.
     */
    getDocAttributeValue(value: DocumentAttributeValue): string | number | Date | string[];
    /**
     * Extracts the attribute key-value pairs from an array of
     * DocumentAttribute objects.
     * @param documentAttributes The array of DocumentAttribute objects to extract the key-value pairs from.
     * @returns An object containing the extracted attribute key-value pairs.
     */
    getDocAttributes(documentAttributes?: DocumentAttribute[]): {
        [key: string]: unknown;
    };
    /**
     * Converts a RetrieveResultItem object into a Document object.
     * @param item The RetrieveResultItem object to convert.
     * @returns A Document object.
     */
    convertRetrieverItem(item: RetrieveResultItem): Document<{
        source: string | undefined;
        title: string;
        excerpt: string;
        document_attributes: {
            [key: string]: unknown;
        };
    }>;
    /**
     * Extracts the top-k documents from a RetrieveCommandOutput object.
     * @param response The RetrieveCommandOutput object to extract the documents from.
     * @param pageSize The number of documents to extract.
     * @returns An array of Document objects.
     */
    getRetrieverDocs(response: RetrieveCommandOutput, pageSize: number): Document[];
    /**
     * Extracts the excerpt text from a QueryResultItem object.
     * @param item The QueryResultItem object to extract the excerpt text from.
     * @returns The extracted excerpt text.
     */
    getQueryItemExcerpt(item: QueryResultItem): string;
    /**
     * Converts a QueryResultItem object into a Document object.
     * @param item The QueryResultItem object to convert.
     * @returns A Document object.
     */
    convertQueryItem(item: QueryResultItem): Document<{
        source: string | undefined;
        title: string;
        excerpt: string;
        document_attributes: {
            [key: string]: unknown;
        };
    }>;
    /**
     * Extracts the top-k documents from a QueryCommandOutput object.
     * @param response The QueryCommandOutput object to extract the documents from.
     * @param pageSize The number of documents to extract.
     * @returns An array of Document objects.
     */
    getQueryDocs(response: QueryCommandOutput, pageSize: number): Document<{
        source: string | undefined;
        title: string;
        excerpt: string;
        document_attributes: {
            [key: string]: unknown;
        };
    }>[];
    /**
     * Sends a retrieve or query request to Kendra and returns the top-k
     * documents.
     * @param query The query to send to Kendra.
     * @param topK The number of top documents to return.
     * @param attributeFilter Optional filter to apply when retrieving documents.
     * @returns A Promise that resolves to an array of Document objects.
     */
    queryKendra(query: string, topK: number, attributeFilter?: AttributeFilter): Promise<Document<Record<string, any>>[] | Document<{
        source: string | undefined;
        title: string;
        excerpt: string;
        document_attributes: {
            [key: string]: unknown;
        };
    }>[]>;
    _getRelevantDocuments(query: string): Promise<Document[]>;
}
