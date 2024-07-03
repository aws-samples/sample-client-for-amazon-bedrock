import { RecursiveCharacterTextSplitter, } from "../text_splitter.js";
/**
 * Abstract class that provides a default implementation for the
 * loadAndSplit() method from the DocumentLoader interface. The load()
 * method is left abstract and needs to be implemented by subclasses.
 */
export class BaseDocumentLoader {
    /**
     * Loads the documents and splits them using a specified text splitter.
     * @param textSplitter The TextSplitter instance to use for splitting the loaded documents. Defaults to a RecursiveCharacterTextSplitter instance.
     * @returns A Promise that resolves with an array of Document instances, each split according to the provided TextSplitter.
     */
    async loadAndSplit(splitter = new RecursiveCharacterTextSplitter()) {
        const docs = await this.load();
        return splitter.splitDocuments(docs);
    }
}
