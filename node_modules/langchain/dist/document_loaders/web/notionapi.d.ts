import { APIResponseError, Client, isFullBlock, isFullPage, isFullDatabase } from "@notionhq/client";
import { Document } from "@langchain/core/documents";
import { AsyncCaller } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader } from "../base.js";
type GuardType<T> = T extends (x: any, ...rest: any) => x is infer U ? U : never;
export type GetBlockResponse = Parameters<typeof isFullBlock>[0];
export type GetPageResponse = Parameters<typeof isFullPage>[0];
export type GetDatabaseResponse = Parameters<typeof isFullDatabase>[0];
export type BlockObjectResponse = GuardType<typeof isFullBlock>;
export type PageObjectResponse = GuardType<typeof isFullPage>;
export type DatabaseObjectResponse = GuardType<typeof isFullDatabase>;
export type GetResponse = GetBlockResponse | GetPageResponse | GetDatabaseResponse | APIResponseError;
export type PagePropertiesType = PageObjectResponse["properties"];
export type PagePropertiesValue = PagePropertiesType[keyof PagePropertiesType];
export declare const isPageResponse: (res: GetResponse) => res is import("@notionhq/client/build/src/api-endpoints.js").PageObjectResponse | import("@notionhq/client/build/src/api-endpoints.js").PartialPageObjectResponse;
export declare const isDatabaseResponse: (res: GetResponse) => res is import("@notionhq/client/build/src/api-endpoints.js").DatabaseObjectResponse | import("@notionhq/client/build/src/api-endpoints.js").PartialDatabaseObjectResponse;
export declare const isErrorResponse: (res: GetResponse) => res is APIResponseError;
export declare const isPage: (res: GetResponse) => res is import("@notionhq/client/build/src/api-endpoints.js").PageObjectResponse;
export declare const isDatabase: (res: GetResponse) => res is import("@notionhq/client/build/src/api-endpoints.js").DatabaseObjectResponse;
/**
 * Represents the type of Notion API to load documents from. The options
 * are "database" or "page".
 */
export type NotionAPIType = "database" | "page";
export type OnDocumentLoadedCallback = (current: number, total: number, currentTitle?: string, rootTitle?: string) => void;
export type NotionAPILoaderOptions = {
    clientOptions: ConstructorParameters<typeof Client>[0];
    id: string;
    type?: NotionAPIType;
    callerOptions?: ConstructorParameters<typeof AsyncCaller>[0];
    onDocumentLoaded?: OnDocumentLoadedCallback;
    propertiesAsHeader?: boolean;
};
/**
 * A class that extends the BaseDocumentLoader class. It represents a
 * document loader for loading documents from Notion using the Notion API.
 * @example
 * ```typescript
 * const pageLoader = new NotionAPILoader({
 *   clientOptions: { auth: "<NOTION_INTEGRATION_TOKEN>" },
 *   id: "<PAGE_ID>",
 *   type: "page",
 * });
 * const pageDocs = await pageLoader.loadAndSplit();
 * const dbLoader = new NotionAPILoader({
 *   clientOptions: { auth: "<NOTION_INTEGRATION_TOKEN>" },
 *   id: "<DATABASE_ID>",
 *   type: "database",
 *   propertiesAsHeader: true,
 * });
 * const dbDocs = await dbLoader.load();
 * ```
 */
export declare class NotionAPILoader extends BaseDocumentLoader {
    private caller;
    private notionClient;
    private n2mClient;
    private id;
    private pageQueue;
    private pageCompleted;
    pageQueueTotal: number;
    private documents;
    private rootTitle;
    private onDocumentLoaded;
    private propertiesAsHeader;
    constructor(options: NotionAPILoaderOptions);
    /**
     * Adds a selection of page ids to the pageQueue and removes duplicates.
     * @param items An array of string ids
     */
    private addToQueue;
    /**
     * Parses a Notion GetResponse object (page or database) and returns a string of the title.
     * @param obj The Notion GetResponse object to parse.
     * @returns The string of the title.
     */
    private getTitle;
    /**
     * Parses the property type and returns a string
     * @param page The Notion page property to parse.
     * @returns A string of parsed property.
     */
    private getPropValue;
    /**
     * Parses the properties of a Notion page and returns them as key-value
     * pairs.
     * @param page The Notion page to parse.
     * @returns An object containing the parsed properties as key-value pairs.
     */
    private parsePageProperties;
    /**
     * Parses the details of a Notion page and returns them as an object.
     * @param page The Notion page to parse.
     * @returns An object containing the parsed details of the page.
     */
    private parsePageDetails;
    /**
     * Loads a Notion block and returns it as an MdBlock object.
     * @param block The Notion block to load.
     * @returns A Promise that resolves to an MdBlock object.
     */
    private loadBlock;
    /**
     * Loads Notion blocks and their children recursively.
     * @param blocksResponse The response from the Notion API containing the blocks to load.
     * @returns A Promise that resolves to an array containing the loaded MdBlocks.
     */
    private loadBlocks;
    /**
     * Loads a Notion page and its child documents, then adds it to the completed documents array.
     * @param page The Notion page or page ID to load.
     */
    private loadPage;
    /**
     * Loads a Notion database and adds it's pages to the queue.
     * @param id The ID of the Notion database to load.
     */
    private loadDatabase;
    /**
     * Loads the documents from Notion based on the specified options.
     * @returns A Promise that resolves to an array of Documents.
     */
    load(): Promise<Document[]>;
}
export {};
