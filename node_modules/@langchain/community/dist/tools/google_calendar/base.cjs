"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarBase = void 0;
const googleapis_1 = require("googleapis");
const tools_1 = require("@langchain/core/tools");
const env_1 = require("@langchain/core/utils/env");
class GoogleCalendarBase extends tools_1.Tool {
    constructor(fields = {
        credentials: {
            clientEmail: (0, env_1.getEnvironmentVariable)("GOOGLE_CALENDAR_CLIENT_EMAIL"),
            privateKey: (0, env_1.getEnvironmentVariable)("GOOGLE_CALENDAR_PRIVATE_KEY"),
            calendarId: (0, env_1.getEnvironmentVariable)("GOOGLE_CALENDAR_CALENDAR_ID"),
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
        const auth = new googleapis_1.google.auth.JWT(this.clientEmail, undefined, this.privateKey, this.scopes);
        return auth;
    }
    async _call(input) {
        return input;
    }
}
exports.GoogleCalendarBase = GoogleCalendarBase;
