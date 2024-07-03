"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarCreateTool = void 0;
const base_js_1 = require("./base.cjs");
const run_create_events_js_1 = require("./commands/run-create-events.cjs");
const descriptions_js_1 = require("./descriptions.cjs");
/**
 * @example
 * ```typescript
 * const googleCalendarCreateTool = new GoogleCalendarCreateTool({
 *   credentials: {
 *     clientEmail: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
 *     privateKey: process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
 *     calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID,
 *   },
 *   scopes: [
 *     "https:
 *     "https:
 *   ],
 *   model: new ChatOpenAI({}),
 * });
 * const createInput = `Create a meeting with John Doe next Friday at 4pm - adding to the agenda of it the result of 99 + 99`;
 * const createResult = await googleCalendarCreateTool.invoke({
 *   input: createInput,
 * });
 * console.log("Create Result", createResult);
 * ```
 */
class GoogleCalendarCreateTool extends base_js_1.GoogleCalendarBase {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "google_calendar_create"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: descriptions_js_1.CREATE_TOOL_DESCRIPTION
        });
    }
    async _call(query, runManager) {
        const auth = await this.getAuth();
        const model = this.getModel();
        return (0, run_create_events_js_1.runCreateEvent)(query, {
            auth,
            model,
            calendarId: this.calendarId,
        }, runManager);
    }
}
exports.GoogleCalendarCreateTool = GoogleCalendarCreateTool;
