import { gmail_v1 } from "googleapis";
import { StructuredTool } from "@langchain/core/tools";
export interface GmailBaseToolParams {
    credentials?: {
        clientEmail?: string;
        privateKey?: string;
        keyfile?: string;
    };
    scopes?: string[];
}
export declare abstract class GmailBaseTool extends StructuredTool {
    private CredentialsSchema;
    private GmailBaseToolParamsSchema;
    name: string;
    description: string;
    protected gmail: gmail_v1.Gmail;
    constructor(fields?: Partial<GmailBaseToolParams>);
    private getGmail;
}
