"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailBaseTool = void 0;
const googleapis_1 = require("googleapis");
const zod_1 = require("zod");
const tools_1 = require("@langchain/core/tools");
const env_1 = require("@langchain/core/utils/env");
class GmailBaseTool extends tools_1.StructuredTool {
    constructor(fields) {
        super(...arguments);
        Object.defineProperty(this, "CredentialsSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: zod_1.z
                .object({
                clientEmail: zod_1.z
                    .string()
                    .min(1)
                    .default((0, env_1.getEnvironmentVariable)("GMAIL_CLIENT_EMAIL") ?? ""),
                privateKey: zod_1.z
                    .string()
                    .default((0, env_1.getEnvironmentVariable)("GMAIL_PRIVATE_KEY") ?? ""),
                keyfile: zod_1.z
                    .string()
                    .default((0, env_1.getEnvironmentVariable)("GMAIL_KEYFILE") ?? ""),
            })
                .refine((credentials) => credentials.privateKey !== "" || credentials.keyfile !== "", {
                message: "Missing GMAIL_PRIVATE_KEY or GMAIL_KEYFILE to interact with Gmail",
            })
        });
        Object.defineProperty(this, "GmailBaseToolParamsSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: zod_1.z
                .object({
                credentials: this.CredentialsSchema.default({}),
                scopes: zod_1.z.array(zod_1.z.string()).default(["https://mail.google.com/"]),
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
        const auth = new googleapis_1.google.auth.JWT(email, keyfile, key, scopes);
        return googleapis_1.google.gmail({ version: "v1", auth });
    }
}
exports.GmailBaseTool = GmailBaseTool;
