/// <reference path="../../../src/types/pdf-parse.d.ts" />
/// <reference types="node" resolution-mode="require"/>
import { Document } from "@langchain/core/documents";
import { BufferLoader } from "./buffer.js";
/**
 * A class that extends the `BufferLoader` class. It represents a document
 * loader that loads documents from PDF files.
 * @example
 * ```typescript
 * const loader = new PDFLoader("path/to/bitcoin.pdf");
 * const docs = await loader.load();
 * console.log({ docs });
 * ```
 */
export declare class PDFLoader extends BufferLoader {
    private splitPages;
    private pdfjs;
    protected parsedItemSeparator: string;
    constructor(filePathOrBlob: string | Blob, { splitPages, pdfjs, parsedItemSeparator, }?: {
        splitPages?: boolean | undefined;
        pdfjs?: typeof PDFLoaderImports | undefined;
        parsedItemSeparator?: string | undefined;
    });
    /**
     * A method that takes a `raw` buffer and `metadata` as parameters and
     * returns a promise that resolves to an array of `Document` instances. It
     * uses the `getDocument` function from the PDF.js library to load the PDF
     * from the buffer. It then iterates over each page of the PDF, retrieves
     * the text content using the `getTextContent` method, and joins the text
     * items to form the page content. It creates a new `Document` instance
     * for each page with the extracted text content and metadata, and adds it
     * to the `documents` array. If `splitPages` is `true`, it returns the
     * array of `Document` instances. Otherwise, if there are no documents, it
     * returns an empty array. Otherwise, it concatenates the page content of
     * all documents and creates a single `Document` instance with the
     * concatenated content.
     * @param raw The buffer to be parsed.
     * @param metadata The metadata of the document.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    parse(raw: Buffer, metadata: Document["metadata"]): Promise<Document[]>;
}
declare function PDFLoaderImports(): Promise<{
    getDocument: typeof import("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js").getDocument;
    version: string;
}>;
export {};
