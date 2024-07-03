import { GoogleCalendarBase } from "./base.js";
import { runCreateEvent } from "./commands/run-create-events.js";
import { CREATE_TOOL_DESCRIPTION } from "./descriptions.js";
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
export class GoogleCalendarCreateTool extends GoogleCalendarBase {
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
            value: CREATE_TOOL_DESCRIPTION
        });
    }
    async _call(query, runManager) {
        const auth = await this.getAuth();
        const model = this.getModel();
        return runCreateEvent(query, {
            auth,
            model,
            calendarId: this.calendarId,
        }, runManager);
    }
}
