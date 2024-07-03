import { z } from "zod";
import { GmailBaseTool, GmailBaseToolParams } from "./base.js";
export declare class GmailSendMessage extends GmailBaseTool {
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
    private createEmailMessage;
    _call({ message, to, subject, cc, bcc, }: z.output<typeof this.schema>): Promise<string>;
}
export type SendMessageSchema = {
    message: string;
    to: string[];
    subject: string;
    cc?: string[];
    bcc?: string[];
};
