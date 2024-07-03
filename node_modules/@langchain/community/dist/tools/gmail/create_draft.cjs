"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailCreateDraft = void 0;
const zod_1 = require("zod");
const base_js_1 = require("./base.cjs");
const descriptions_js_1 = require("./descriptions.cjs");
class GmailCreateDraft extends base_js_1.GmailBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "create_gmail_draft"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: zod_1.z.object({
                message: zod_1.z.string(),
                to: zod_1.z.array(zod_1.z.string()),
                subject: zod_1.z.string(),
                cc: zod_1.z.array(zod_1.z.string()).optional(),
                bcc: zod_1.z.array(zod_1.z.string()).optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: descriptions_js_1.CREATE_DRAFT_DESCRIPTION
        });
    }
    prepareDraftMessage(message, to, subject, cc, bcc) {
        const draftMessage = {
            message: {
                raw: "",
            },
        };
        const email = [
            `To: ${to.join(", ")}`,
            `Subject: ${subject}`,
            cc ? `Cc: ${cc.join(", ")}` : "",
            bcc ? `Bcc: ${bcc.join(", ")}` : "",
            "",
            message,
        ].join("\n");
        draftMessage.message.raw = Buffer.from(email).toString("base64url");
        return draftMessage;
    }
    async _call(arg) {
        const { message, to, subject, cc, bcc } = arg;
        const create_message = this.prepareDraftMessage(message, to, subject, cc, bcc);
        const response = await this.gmail.users.drafts.create({
            userId: "me",
            requestBody: create_message,
        });
        return `Draft created. Draft Id: ${response.data.id}`;
    }
}
exports.GmailCreateDraft = GmailCreateDraft;
