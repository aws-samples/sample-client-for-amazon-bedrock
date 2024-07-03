import type { CheerioAPI, CheerioOptions, load as LoadT, SelectorType } from "cheerio";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader } from "../base.js";
import type { DocumentLoader } from "../base.js";
/**
 * Represents the parameters for configuring the CheerioWebBaseLoader. It
 * extends the AsyncCallerParams interface and adds additional parameters
 * specific to web-based loaders.
 */
export interface WebBaseLoaderParams extends AsyncCallerParams {
    /**
     * The timeout in milliseconds for the fetch request. Defaults to 10s.
     */
    timeout?: number;
    /**
     * The selector to use to extract the text from the document. Defaults to
     * "body".
     */
    selector?: SelectorType;
    /**
     * The text decoder to use to decode the response. Defaults to UTF-8.
     */
    textDecoder?: TextDecoder;
}
/**
 * A class that extends the BaseDocumentLoader and implements the
 * DocumentLoader interface. It represents a document loader for loading
 * web-based documents using Cheerio.
 * @example
 * ```typescript
 * const loader = new CheerioWebBaseLoader("https:exampleurl.com");
 * const docs = await loader.load();
 * console.log({ docs });
 * ```
 */
export declare class CheerioWebBaseLoader extends BaseDocumentLoader implements DocumentLoader {
    webPath: string;
    timeout: number;
    caller: AsyncCaller;
    selector?: SelectorType;
    textDecoder?: TextDecoder;
    constructor(webPath: string, fields?: WebBaseLoaderParams);
    /**
     * Fetches web documents from the given array of URLs and loads them using Cheerio.
     * It returns an array of CheerioAPI instances.
     * @param urls An array of URLs to fetch and load.
     * @returns A Promise that resolves to an array of CheerioAPI instances.
     */
    static scrapeAll(urls: string[], caller: AsyncCaller, timeout: number | undefined, textDecoder?: TextDecoder, options?: CheerioOptions): Promise<CheerioAPI[]>;
    static _scrape(url: string, caller: AsyncCaller, timeout: number | undefined, textDecoder?: TextDecoder, options?: CheerioOptions): Promise<CheerioAPI>;
    /**
     * Fetches the web document from the webPath and loads it using Cheerio.
     * It returns a CheerioAPI instance.
     * @returns A Promise that resolves to a CheerioAPI instance.
     */
    scrape(): Promise<CheerioAPI>;
    /**
     * Extracts the text content from the loaded document using the selector
     * and creates a Document instance with the extracted text and metadata.
     * It returns an array of Document instances.
     * @returns A Promise that resolves to an array of Document instances.
     */
    load(): Promise<Document[]>;
    /**
     * A static method that dynamically imports the Cheerio library and
     * returns the load function. If the import fails, it throws an error.
     * @returns A Promise that resolves to an object containing the load function from the Cheerio library.
     */
    static imports(): Promise<{
        load: typeof LoadT;
    }>;
}
