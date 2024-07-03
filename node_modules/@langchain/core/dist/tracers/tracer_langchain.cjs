"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainTracer = void 0;
const langsmith_1 = require("langsmith");
const env_js_1 = require("../utils/env.cjs");
const base_js_1 = require("./base.cjs");
class LangChainTracer extends base_js_1.BaseTracer {
    constructor(fields = {}) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "langchain_tracer"
        });
        Object.defineProperty(this, "projectName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "exampleId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { exampleId, projectName, client } = fields;
        this.projectName =
            projectName ??
                (0, env_js_1.getEnvironmentVariable)("LANGCHAIN_PROJECT") ??
                (0, env_js_1.getEnvironmentVariable)("LANGCHAIN_SESSION");
        this.exampleId = exampleId;
        this.client = client ?? new langsmith_1.Client({});
    }
    async _convertToCreate(run, example_id = undefined) {
        return {
            ...run,
            extra: {
                ...run.extra,
                runtime: await (0, env_js_1.getRuntimeEnvironment)(),
            },
            child_runs: undefined,
            session_name: this.projectName,
            reference_example_id: run.parent_run_id ? undefined : example_id,
        };
    }
    async persistRun(_run) { }
    async onRunCreate(run) {
        const persistedRun = await this._convertToCreate(run, this.exampleId);
        await this.client.createRun(persistedRun);
    }
    async onRunUpdate(run) {
        const runUpdate = {
            end_time: run.end_time,
            error: run.error,
            outputs: run.outputs,
            events: run.events,
            inputs: run.inputs,
            trace_id: run.trace_id,
            dotted_order: run.dotted_order,
            parent_run_id: run.parent_run_id,
        };
        await this.client.updateRun(run.id, runUpdate);
    }
    getRun(id) {
        return this.runMap.get(id);
    }
}
exports.LangChainTracer = LangChainTracer;
