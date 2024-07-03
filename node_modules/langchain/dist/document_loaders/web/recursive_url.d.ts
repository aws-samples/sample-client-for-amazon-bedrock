import { Document } from "@langchain/core/documents";
import { AsyncCaller } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader, DocumentLoader } from "../base.js";
export interface RecursiveUrlLoaderOptions {
    excludeDirs?: string[];
    extractor?: (text: string) => string;
    maxDepth?: number;
    timeout?: number;
    preventOutside?: boolean;
    callerOptions?: ConstructorParameters<typeof AsyncCaller>[0];
}
export declare class RecursiveUrlLoader extends BaseDocumentLoader implements DocumentLoader {
    private caller;
    private url;
    private excludeDirs;
    private extractor;
    private maxDepth;
    private timeout;
    private preventOutside;
    constructor(url: string, options: RecursiveUrlLoaderOptions);
    private fetchWithTimeout;
    private getChildLinks;
    private extractMetadata;
    private getUrlAsDoc;
    private getChildUrlsRecursive;
    load(): Promise<Document[]>;
}
