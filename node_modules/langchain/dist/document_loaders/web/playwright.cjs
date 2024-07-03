"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightWebBaseLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const base_js_1 = require("../base.cjs");
/**
 * Class representing a document loader for scraping web pages using
 * Playwright. Extends the BaseDocumentLoader class and implements the
 * DocumentLoader interface.
 */
class PlaywrightWebBaseLoader extends base_js_1.BaseDocumentLoader {
    constructor(webPath, options) {
        super();
        Object.defineProperty(this, "webPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: webPath
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.options = options ?? undefined;
    }
    static async _scrape(url, options) {
        const { chromium } = await PlaywrightWebBaseLoader.imports();
        const browser = await chromium.launch({
            headless: true,
            ...options?.launchOptions,
        });
        const page = await browser.newPage();
        const response = await page.goto(url, {
            timeout: 180000,
            waitUntil: "domcontentloaded",
            ...options?.gotoOptions,
        });
        const bodyHTML = options?.evaluate
            ? await options?.evaluate(page, browser, response)
            : await page.content();
        await browser.close();
        return bodyHTML;
    }
    /**
     * Method that calls the _scrape method to perform the scraping of the web
     * page specified by the webPath property. Returns a Promise that resolves
     * to the scraped HTML content of the web page.
     * @returns Promise that resolves to the scraped HTML content of the web page.
     */
    async scrape() {
        return PlaywrightWebBaseLoader._scrape(this.webPath, this.options);
    }
    /**
     * Method that calls the scrape method and returns the scraped HTML
     * content as a Document object. Returns a Promise that resolves to an
     * array of Document objects.
     * @returns Promise that resolves to an array of Document objects.
     */
    async load() {
        const text = await this.scrape();
        const metadata = { source: this.webPath };
        return [new documents_1.Document({ pageContent: text, metadata })];
    }
    /**
     * Static method that imports the necessary Playwright modules. Returns a
     * Promise that resolves to an object containing the imported modules.
     * @returns Promise that resolves to an object containing the imported modules.
     */
    static async imports() {
        try {
            const { chromium } = await import("playwright");
            return { chromium };
        }
        catch (e) {
            console.error(e);
            throw new Error("Please install playwright as a dependency with, e.g. `yarn add playwright`");
        }
    }
}
exports.PlaywrightWebBaseLoader = PlaywrightWebBaseLoader;
