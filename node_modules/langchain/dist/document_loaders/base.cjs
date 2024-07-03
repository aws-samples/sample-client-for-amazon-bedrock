"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDocumentLoader = void 0;
const text_splitter_js_1 = require("../text_splitter.cjs");
/**
 * Abstract class that provides a default implementation for the
 * loadAndSplit() method from the DocumentLoader interface. The load()
 * method is left abstract and needs to be implemented by subclasses.
 */
class BaseDocumentLoader {
    /**
     * Loads the documents and splits them using a specified text splitter.
     * @param textSplitter The TextSplitter instance to use for splitting the loaded documents. Defaults to a RecursiveCharacterTextSplitter instance.
     * @returns A Promise that resolves with an array of Document instances, each split according to the provided TextSplitter.
     */
    async loadAndSplit(splitter = new text_splitter_js_1.RecursiveCharacterTextSplitter()) {
        const docs = await this.load();
        return splitter.splitDocuments(docs);
    }
}
exports.BaseDocumentLoader = BaseDocumentLoader;
