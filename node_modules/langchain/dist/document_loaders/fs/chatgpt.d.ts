import { Document } from "@langchain/core/documents";
import { TextLoader } from "./text.js";
export declare class ChatGPTLoader extends TextLoader {
    numLogs: number;
    constructor(filePathOrBlob: string | Blob, numLogs?: number);
    protected parse(raw: string): Promise<string[]>;
    load(): Promise<Document[]>;
}
