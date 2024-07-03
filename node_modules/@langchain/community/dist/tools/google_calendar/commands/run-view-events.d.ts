import type { JWT } from "googleapis-common";
import { BaseLLM } from "@langchain/core/language_models/llms";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
type RunViewEventParams = {
    calendarId: string;
    auth: JWT;
    model: BaseLLM;
};
declare const runViewEvents: (query: string, { model, auth, calendarId }: RunViewEventParams, runManager?: CallbackManagerForToolRun) => Promise<string>;
export { runViewEvents };
