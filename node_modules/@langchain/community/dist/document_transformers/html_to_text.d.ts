import { type HtmlToTextOptions } from "html-to-text";
import { MappingDocumentTransformer, Document } from "@langchain/core/documents";
/**
 * A transformer that converts HTML content to plain text.
 * @example
 * ```typescript
 * const loader = new CheerioWebBaseLoader("https://example.com/some-page");
 * const docs = await loader.load();
 *
 * const splitter = new RecursiveCharacterTextSplitter({
 *  maxCharacterCount: 1000,
 * });
 * const transformer = new HtmlToTextTransformer();
 *
 * // The sequence of text splitting followed by HTML to text transformation
 * const sequence = splitter.pipe(transformer);
 *
 * // Processing the loaded documents through the sequence
 * const newDocuments = await sequence.invoke(docs);
 *
 * console.log(newDocuments);
 * ```
 */
export declare class HtmlToTextTransformer extends MappingDocumentTransformer {
    protected options: HtmlToTextOptions;
    static lc_name(): string;
    constructor(options?: HtmlToTextOptions);
    _transformDocument(document: Document): Promise<Document>;
}
