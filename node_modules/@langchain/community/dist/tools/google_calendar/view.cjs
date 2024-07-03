"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarViewTool = void 0;
const base_js_1 = require("./base.cjs");
const descriptions_js_1 = require("./descriptions.cjs");
const run_view_events_js_1 = require("./commands/run-view-events.cjs");
/**
 * @example
 * ```typescript
 * const googleCalendarViewTool = new GoogleCalendarViewTool({
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
 * const viewInput = `What meetings do I have this week?`;
 * const viewResult = await googleCalendarViewTool.invoke({ input: viewInput });
 * console.log("View Result", viewResult);
 * ```
 */
class GoogleCalendarViewTool extends base_js_1.GoogleCalendarBase {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "google_calendar_view"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: descriptions_js_1.VIEW_TOOL_DESCRIPTION
        });
    }
    async _call(query, runManager) {
        const auth = await this.getAuth();
        const model = this.getModel();
        return (0, run_view_events_js_1.runViewEvents)(query, {
            auth,
            model,
            calendarId: this.calendarId,
        }, runManager);
    }
}
exports.GoogleCalendarViewTool = GoogleCalendarViewTool;
