"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMSDBLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const cheerio_js_1 = require("./cheerio.cjs");
/**
 * A class that extends the CheerioWebBaseLoader class. It represents a
 * loader for loading web pages from the IMSDB (Internet Movie Script
 * Database) website.
 */
class IMSDBLoader extends cheerio_js_1.CheerioWebBaseLoader {
    constructor(webPath) {
        super(webPath);
        Object.defineProperty(this, "webPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: webPath
        });
    }
    /**
     * An asynchronous method that loads the web page using the scrape()
     * method inherited from the base class. It selects the element with the
     * class 'scrtext' using the $ function provided by Cheerio and extracts
     * the text content. It creates a Document instance with the text content
     * as the page content and the source as metadata. It returns an array
     * containing the Document instance.
     * @returns An array containing a Document instance.
     */
    async load() {
        const $ = await this.scrape();
        const text = $("td[class='scrtext']").text().trim();
        const metadata = { source: this.webPath };
        return [new documents_1.Document({ pageContent: text, metadata })];
    }
}
exports.IMSDBLoader = IMSDBLoader;
