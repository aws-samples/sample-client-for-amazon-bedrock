import type { JWT } from "googleapis-common";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { BaseLLM } from "@langchain/core/language_models/llms";
type RunCreateEventParams = {
    calendarId: string;
    auth: JWT;
    model: BaseLLM;
};
declare const runCreateEvent: (query: string, { calendarId, auth, model }: RunCreateEventParams, runManager?: CallbackManagerForToolRun) => Promise<string>;
export { runCreateEvent };
