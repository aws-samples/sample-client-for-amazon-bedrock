import { z } from "zod";
import { GmailBaseTool } from "./base.js";
import { CREATE_DRAFT_DESCRIPTION } from "./descriptions.js";
export class GmailCreateDraft extends GmailBaseTool {
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
            value: z.object({
                message: z.string(),
                to: z.array(z.string()),
                subject: z.string(),
                cc: z.array(z.string()).optional(),
                bcc: z.array(z.string()).optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CREATE_DRAFT_DESCRIPTION
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
