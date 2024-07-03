import { google } from "googleapis";
import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
export class GmailBaseTool extends StructuredTool {
    constructor(fields) {
        super(...arguments);
        Object.defineProperty(this, "CredentialsSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z
                .object({
                clientEmail: z
                    .string()
                    .min(1)
                    .default(getEnvironmentVariable("GMAIL_CLIENT_EMAIL") ?? ""),
                privateKey: z
                    .string()
                    .default(getEnvironmentVariable("GMAIL_PRIVATE_KEY") ?? ""),
                keyfile: z
                    .string()
                    .default(getEnvironmentVariable("GMAIL_KEYFILE") ?? ""),
            })
                .refine((credentials) => credentials.privateKey !== "" || credentials.keyfile !== "", {
                message: "Missing GMAIL_PRIVATE_KEY or GMAIL_KEYFILE to interact with Gmail",
            })
        });
        Object.defineProperty(this, "GmailBaseToolParamsSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z
                .object({
                credentials: this.CredentialsSchema.default({}),
                scopes: z.array(z.string()).default(["https://mail.google.com/"]),
            })
                .default({})
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Gmail"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A tool to send and view emails through Gmail"
        });
        Object.defineProperty(this, "gmail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { credentials, scopes } = this.GmailBaseToolParamsSchema.parse(fields);
        this.gmail = this.getGmail(scopes, credentials.clientEmail, credentials.privateKey, credentials.keyfile);
    }
    getGmail(scopes, email, key, keyfile) {
        const auth = new google.auth.JWT(email, keyfile, key, scopes);
        return google.gmail({ version: "v1", auth });
    }
}
