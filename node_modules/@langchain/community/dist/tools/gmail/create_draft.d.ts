import { z } from "zod";
import { GmailBaseTool, GmailBaseToolParams } from "./base.js";
export declare class GmailCreateDraft extends GmailBaseTool {
    name: string;
    schema: z.ZodObject<{
        message: z.ZodString;
        to: z.ZodArray<z.ZodString, "many">;
        subject: z.ZodString;
        cc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        bcc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        to: string[];
        subject: string;
        cc?: string[] | undefined;
        bcc?: string[] | undefined;
    }, {
        message: string;
        to: string[];
        subject: string;
        cc?: string[] | undefined;
        bcc?: string[] | undefined;
    }>;
    description: string;
    constructor(fields?: GmailBaseToolParams);
    private prepareDraftMessage;
    _call(arg: z.output<typeof this.schema>): Promise<string>;
}
export type CreateDraftSchema = {
    message: string;
    to: string[];
    subject: string;
    cc?: string[];
    bcc?: string[];
};
