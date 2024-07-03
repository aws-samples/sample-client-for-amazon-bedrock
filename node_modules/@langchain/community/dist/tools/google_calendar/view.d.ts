import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { GoogleCalendarBase, GoogleCalendarAgentParams } from "./base.js";
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
export declare class GoogleCalendarViewTool extends GoogleCalendarBase {
    name: string;
    description: string;
    constructor(fields: GoogleCalendarAgentParams);
    _call(query: string, runManager?: CallbackManagerForToolRun): Promise<string>;
}
