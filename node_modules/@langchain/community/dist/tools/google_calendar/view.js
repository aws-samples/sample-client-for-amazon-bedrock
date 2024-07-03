import { GoogleCalendarBase } from "./base.js";
import { VIEW_TOOL_DESCRIPTION } from "./descriptions.js";
import { runViewEvents } from "./commands/run-view-events.js";
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
export class GoogleCalendarViewTool extends GoogleCalendarBase {
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
            value: VIEW_TOOL_DESCRIPTION
        });
    }
    async _call(query, runManager) {
        const auth = await this.getAuth();
        const model = this.getModel();
        return runViewEvents(query, {
            auth,
            model,
            calendarId: this.calendarId,
        }, runManager);
    }
}
