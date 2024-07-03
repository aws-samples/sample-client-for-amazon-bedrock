import { Document } from "@langchain/core/documents";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader } from "../base.js";
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
export class CheerioWebBaseLoader extends BaseDocumentLoader {
    constructor(webPath, fields) {
        super();
        Object.defineProperty(this, "webPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: webPath
        });
        Object.defineProperty(this, "timeout", {
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
        Object.defineProperty(this, "selector", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "textDecoder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { timeout, selector, textDecoder, ...rest } = fields ?? {};
        this.timeout = timeout ?? 10000;
        this.caller = new AsyncCaller(rest);
        this.selector = selector ?? "body";
        this.textDecoder = textDecoder;
    }
    /**
     * Fetches web documents from the given array of URLs and loads them using Cheerio.
     * It returns an array of CheerioAPI instances.
     * @param urls An array of URLs to fetch and load.
     * @returns A Promise that resolves to an array of CheerioAPI instances.
     */
    static async scrapeAll(urls, caller, timeout, textDecoder, options) {
        return Promise.all(urls.map((url) => CheerioWebBaseLoader._scrape(url, caller, timeout, textDecoder, options)));
    }
    static async _scrape(url, caller, timeout, textDecoder, options) {
        const { load } = await CheerioWebBaseLoader.imports();
        const response = await caller.call(fetch, url, {
            signal: timeout ? AbortSignal.timeout(timeout) : undefined,
        });
        const html = textDecoder?.decode(await response.arrayBuffer()) ??
            (await response.text());
        return load(html, options);
    }
    /**
     * Fetches the web document from the webPath and loads it using Cheerio.
     * It returns a CheerioAPI instance.
     * @returns A Promise that resolves to a CheerioAPI instance.
     */
    async scrape() {
        return CheerioWebBaseLoader._scrape(this.webPath, this.caller, this.timeout, this.textDecoder);
    }
    /**
     * Extracts the text content from the loaded document using the selector
     * and creates a Document instance with the extracted text and metadata.
     * It returns an array of Document instances.
     * @returns A Promise that resolves to an array of Document instances.
     */
    async load() {
        const $ = await this.scrape();
        const text = $(this.selector).text();
        const metadata = { source: this.webPath };
        return [new Document({ pageContent: text, metadata })];
    }
    /**
     * A static method that dynamically imports the Cheerio library and
     * returns the load function. If the import fails, it throws an error.
     * @returns A Promise that resolves to an object containing the load function from the Cheerio library.
     */
    static async imports() {
        try {
            const { load } = await import("cheerio");
            return { load };
        }
        catch (e) {
            console.error(e);
            throw new Error("Please install cheerio as a dependency with, e.g. `yarn add cheerio`");
        }
    }
}
