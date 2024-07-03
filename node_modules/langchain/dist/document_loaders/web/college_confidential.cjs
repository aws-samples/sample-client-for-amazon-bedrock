"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegeConfidentialLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const cheerio_js_1 = require("./cheerio.cjs");
/**
 * A document loader specifically designed for loading documents from the
 * College Confidential website. It extends the CheerioWebBaseLoader.
 * @example
 * ```typescript
 * const loader = new CollegeConfidentialLoader("https:exampleurl.com");
 * const docs = await loader.load();
 * console.log({ docs });
 * ```
 */
class CollegeConfidentialLoader extends cheerio_js_1.CheerioWebBaseLoader {
    constructor(webPath) {
        super(webPath);
    }
    /**
     * Overrides the base load() method to extract the text content from the
     * loaded document using a specific selector for the College Confidential
     * website. It creates a Document instance with the extracted text and
     * metadata, and returns an array containing the Document instance.
     * @returns An array containing a Document instance with the extracted text and metadata from the loaded College Confidential web document.
     */
    async load() {
        const $ = await this.scrape();
        const text = $("main[class='skin-handler']").text();
        const metadata = { source: this.webPath };
        return [new documents_1.Document({ pageContent: text, metadata })];
    }
}
exports.CollegeConfidentialLoader = CollegeConfidentialLoader;
