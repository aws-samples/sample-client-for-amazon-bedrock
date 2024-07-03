import { z } from "zod";
import { GmailBaseToolParams, GmailBaseTool } from "./base.js";
export declare class GmailGetMessage extends GmailBaseTool {
    name: string;
    schema: z.ZodObject<{
        messageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        messageId: string;
    }, {
        messageId: string;
    }>;
    description: string;
    constructor(fields?: GmailBaseToolParams);
    _call(arg: z.output<typeof this.schema>): Promise<string>;
}
export type GetMessageSchema = {
    messageId: string;
};
