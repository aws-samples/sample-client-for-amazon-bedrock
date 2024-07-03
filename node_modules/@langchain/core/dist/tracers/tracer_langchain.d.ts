import { Client } from "langsmith";
import { BaseRun, RunCreate, RunUpdate as BaseRunUpdate, KVMap } from "langsmith/schemas";
import { BaseTracer } from "./base.js";
import { BaseCallbackHandlerInput } from "../callbacks/base.js";
export interface Run extends BaseRun {
    id: string;
    child_runs: this[];
    child_execution_order: number;
    dotted_order?: string;
    trace_id?: string;
}
export interface RunCreate2 extends RunCreate {
    trace_id?: string;
    dotted_order?: string;
}
export interface RunUpdate extends BaseRunUpdate {
    events: BaseRun["events"];
    inputs: KVMap;
    trace_id?: string;
    dotted_order?: string;
}
export interface LangChainTracerFields extends BaseCallbackHandlerInput {
    exampleId?: string;
    projectName?: string;
    client?: Client;
}
export declare class LangChainTracer extends BaseTracer implements LangChainTracerFields {
    name: string;
    projectName?: string;
    exampleId?: string;
    client: Client;
    constructor(fields?: LangChainTracerFields);
    private _convertToCreate;
    protected persistRun(_run: Run): Promise<void>;
    onRunCreate(run: Run): Promise<void>;
    onRunUpdate(run: Run): Promise<void>;
    getRun(id: string): Run | undefined;
}
