import { google } from "googleapis";
import { Tool } from "@langchain/core/tools";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
export class GoogleCalendarBase extends Tool {
    constructor(fields = {
        credentials: {
            clientEmail: getEnvironmentVariable("GOOGLE_CALENDAR_CLIENT_EMAIL"),
            privateKey: getEnvironmentVariable("GOOGLE_CALENDAR_PRIVATE_KEY"),
            calendarId: getEnvironmentVariable("GOOGLE_CALENDAR_CALENDAR_ID"),
        },
        scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
        ],
    }) {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Google Calendar"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A tool to lookup Google Calendar events and create events in Google Calendar"
        });
        Object.defineProperty(this, "clientEmail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "privateKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "calendarId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scopes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "llm", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!fields.model) {
            throw new Error("Missing llm instance to interact with Google Calendar");
        }
        if (!fields.credentials) {
            throw new Error("Missing credentials to authenticate to Google Calendar");
        }
        if (!fields.credentials.clientEmail) {
            throw new Error("Missing GOOGLE_CALENDAR_CLIENT_EMAIL to interact with Google Calendar");
        }
        if (!fields.credentials.privateKey) {
            throw new Error("Missing GOOGLE_CALENDAR_PRIVATE_KEY to interact with Google Calendar");
        }
        if (!fields.credentials.calendarId) {
            throw new Error("Missing GOOGLE_CALENDAR_CALENDAR_ID to interact with Google Calendar");
        }
        this.clientEmail = fields.credentials.clientEmail;
        this.privateKey = fields.credentials.privateKey;
        this.calendarId = fields.credentials.calendarId;
        this.scopes = fields.scopes || [];
        this.llm = fields.model;
    }
    getModel() {
        return this.llm;
    }
    async getAuth() {
        const auth = new google.auth.JWT(this.clientEmail, undefined, this.privateKey, this.scopes);
        return auth;
    }
    async _call(input) {
        return input;
    }
}
