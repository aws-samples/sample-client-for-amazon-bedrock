"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runViewEvents = void 0;
const googleapis_1 = require("googleapis");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const index_js_1 = require("../prompts/index.cjs");
const get_timezone_offset_in_hours_js_1 = require("../utils/get-timezone-offset-in-hours.cjs");
const runViewEvents = async (query, { model, auth, calendarId }, runManager) => {
    const calendar = new googleapis_1.calendar_v3.Calendar({});
    const prompt = new prompts_1.PromptTemplate({
        template: index_js_1.VIEW_EVENTS_PROMPT,
        inputVariables: ["date", "query", "u_timezone", "dayName"],
    });
    const viewEventsChain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
    const date = new Date().toISOString();
    const u_timezone = (0, get_timezone_offset_in_hours_js_1.getTimezoneOffsetInHours)();
    const dayName = new Date().toLocaleString("en-us", { weekday: "long" });
    const output = await viewEventsChain.invoke({
        query,
        date,
        u_timezone,
        dayName,
    }, runManager?.getChild());
    const loaded = JSON.parse(output);
    try {
        const response = await calendar.events.list({
            auth,
            calendarId,
            ...loaded,
        });
        const curatedItems = response.data && response.data.items
            ? response.data.items.map(({ status, summary, description, start, end, }) => ({
                status,
                summary,
                description,
                start,
                end,
            }))
            : [];
        return `Result for the prompt "${query}": \n${JSON.stringify(curatedItems, null, 2)}`;
    }
    catch (error) {
        return `An error occurred: ${error}`;
    }
};
exports.runViewEvents = runViewEvents;
