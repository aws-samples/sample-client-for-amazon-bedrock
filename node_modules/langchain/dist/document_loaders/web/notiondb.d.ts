import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * Interface representing the parameters for the NotionDBLoader class. It
 * includes the database ID, Notion integration token, Notion API version,
 * and page size limit.
 */
export interface NotionDBLoaderParams {
    databaseId: string;
    notionIntegrationToken?: string;
    notionApiVersion?: string;
    pageSizeLimit?: number;
}
/** @deprecated use the `NotionAPILoader` class instead.
 * @example
 * ```typescript
 * const loader = new NotionDBLoader({
 *   pageSizeLimit: 10,
 *   databaseId: "{databaseId}",
 *   notionIntegrationToken: "{notionIntegrationToken}",
 * });
 * const docs = await loader.load();
 * ```
 */
export declare class NotionDBLoader extends BaseDocumentLoader implements NotionDBLoaderParams {
    integrationToken: string;
    databaseId: string;
    notionApiVersion: string;
    pageSizeLimit: number;
    private headers;
    constructor({ databaseId, notionApiVersion, notionIntegrationToken, pageSizeLimit, }: NotionDBLoaderParams);
    /**
     * Loads the documents from Notion based on the specified options.
     * @returns An array of Document objects.
     */
    load(): Promise<Document[]>;
    /**
     * Retrieves the IDs of the pages in the Notion database.
     * @returns An array of page IDs.
     */
    private retrievePageIds;
    /**
     * Loads a Notion page and returns it as a Document object.
     * @param pageId The ID of the Notion page to load.
     * @returns A Document object representing the loaded Notion page.
     */
    private loadPage;
    /**
     * Loads the blocks of a Notion page and returns them as a string.
     * @param blockId The ID of the block to load.
     * @param numberOfTabs The number of tabs to use for indentation.
     * @returns A string representing the loaded blocks.
     */
    private loadBlocks;
}
