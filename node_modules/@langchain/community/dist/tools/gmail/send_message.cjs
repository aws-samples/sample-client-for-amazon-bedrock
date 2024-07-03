"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailSendMessage = void 0;
const zod_1 = require("zod");
const base_js_1 = require("./base.cjs");
const descriptions_js_1 = require("./descriptions.cjs");
class GmailSendMessage extends base_js_1.GmailBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gmail_send_message"
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
            value: descriptions_js_1.GET_MESSAGE_DESCRIPTION
        });
    }
    createEmailMessage({ message, to, subject, cc, bcc, }) {
        const emailLines = [];
        // Format the recipient(s)
        const formatEmailList = (emails) => Array.isArray(emails) ? emails.join(",") : emails;
        emailLines.push(`To: ${formatEmailList(to)}`);
        if (cc)
            emailLines.push(`Cc: ${formatEmailList(cc)}`);
        if (bcc)
            emailLines.push(`Bcc: ${formatEmailList(bcc)}`);
        emailLines.push(`Subject: ${subject}`);
        emailLines.push("");
        emailLines.push(message);
        // Convert the email message to base64url string
        const email = emailLines.join("\r\n").trim();
        // this encode may be an issue
        return Buffer.from(email).toString("base64url");
    }
    async _call({ message, to, subject, cc, bcc, }) {
        const rawMessage = this.createEmailMessage({
            message,
            to,
            subject,
            cc,
            bcc,
        });
        try {
            const response = await this.gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: rawMessage,
                },
            });
            return `Message sent. Message Id: ${response.data.id}`;
        }
        catch (error) {
            throw new Error(`An error occurred while sending the message: ${error}`);
        }
    }
}
exports.GmailSendMessage = GmailSendMessage;
