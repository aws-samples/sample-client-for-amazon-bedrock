import { type Operation as JSONPatchOperation } from "../utils/fast-json-patch/index.js";
import { BaseTracer, type Run } from "./base.js";
import { BaseCallbackHandlerInput, HandleLLMNewTokenCallbackFields } from "../callbacks/base.js";
import { IterableReadableStream } from "../utils/stream.js";
/**
 * Interface that represents the structure of a log entry in the
 * `LogStreamCallbackHandler`.
 */
export type LogEntry = {
    /** ID of the sub-run. */
    id: string;
    /** Name of the object being run. */
    name: string;
    /** Type of the object being run, eg. prompt, chain, llm, etc. */
    type: string;
    /** List of tags for the run. */
    tags: string[];
    /** Key-value pairs of metadata for the run. */
    metadata: Record<string, any>;
    /** ISO-8601 timestamp of when the run started. */
    start_time: string;
    /** List of general output chunks streamed by this run. */
    streamed_output: any[];
    /** List of LLM tokens streamed by this run, if applicable. */
    streamed_output_str: string[];
    /** Inputs to this run. Not available currently via streamLog. */
    inputs?: any;
    /** Final output of this run. Only available after the run has finished successfully. */
    final_output?: any;
    /** ISO-8601 timestamp of when the run ended. Only available after the run has finished. */
    end_time?: string;
};
export type RunState = {
    /** ID of the sub-run. */
    id: string;
    /** List of output chunks streamed by Runnable.stream() */
    streamed_output: any[];
    /** Final output of the run, usually the result of aggregating streamed_output. Only available after the run has finished successfully. */
    final_output?: any;
    /**
     * List of sub-runs contained in this run, if any, in the order they were started.
     * If filters were supplied, this list will contain only the runs that matched the filters.
     */
    logs: Record<string, LogEntry>;
    /** Name of the object being run. */
    name: string;
    /** Type of the object being run, eg. prompt, chain, llm, etc. */
    type: string;
};
/**
 * List of jsonpatch JSONPatchOperations, which describe how to create the run state
 * from an empty dict. This is the minimal representation of the log, designed to
 * be serialized as JSON and sent over the wire to reconstruct the log on the other
 * side. Reconstruction of the state can be done with any jsonpatch-compliant library,
 * see https://jsonpatch.com for more information.
 */
export declare class RunLogPatch {
    ops: JSONPatchOperation[];
    constructor(fields: {
        ops?: JSONPatchOperation[];
    });
    concat(other: RunLogPatch): RunLog;
}
export declare class RunLog extends RunLogPatch {
    state: RunState;
    constructor(fields: {
        ops?: JSONPatchOperation[];
        state: RunState;
    });
    concat(other: RunLogPatch): RunLog;
    static fromRunLogPatch(patch: RunLogPatch): RunLog;
}
/**
 * Data associated with a StreamEvent.
 */
export type StreamEventData = {
    /**
     * The input passed to the runnable that generated the event.
     * Inputs will sometimes be available at the *START* of the runnable, and
     * sometimes at the *END* of the runnable.
     * If a runnable is able to stream its inputs, then its input by definition
     * won't be known until the *END* of the runnable when it has finished streaming
     * its inputs.
     */
    input?: any;
    /**
     * The output of the runnable that generated the event.
     * Outputs will only be available at the *END* of the runnable.
     * For most runnables, this field can be inferred from the `chunk` field,
     * though there might be some exceptions for special cased runnables (e.g., like
     * chat models), which may return more information.
     */
    output?: any;
    /**
     * A streaming chunk from the output that generated the event.
     * chunks support addition in general, and adding them up should result
     * in the output of the runnable that generated the event.
     */
    chunk?: any;
};
/**
 * A streaming event.
 *
 * Schema of a streaming event which is produced from the streamEvents method.
 */
export type StreamEvent = {
    /**
     * Event names are of the format: on_[runnable_type]_(start|stream|end).
     *
     * Runnable types are one of:
     * - llm - used by non chat models
     * - chat_model - used by chat models
     * - prompt --  e.g., ChatPromptTemplate
     * - tool -- from tools defined via @tool decorator or inheriting from Tool/BaseTool
     * - chain - most Runnables are of this type
     *
     * Further, the events are categorized as one of:
     * - start - when the runnable starts
     * - stream - when the runnable is streaming
     * - end - when the runnable ends
     *
     * start, stream and end are associated with slightly different `data` payload.
     *
     * Please see the documentation for `EventData` for more details.
     */
    event: string;
    /** The name of the runnable that generated the event. */
    name: string;
    /**
     * An randomly generated ID to keep track of the execution of the given runnable.
     *
     * Each child runnable that gets invoked as part of the execution of a parent runnable
     * is assigned its own unique ID.
     */
    run_id: string;
    /**
     * Tags associated with the runnable that generated this event.
     * Tags are always inherited from parent runnables.
     */
    tags?: string[];
    /** Metadata associated with the runnable that generated this event. */
    metadata: Record<string, any>;
    /**
     * Event data.
     *
     * The contents of the event data depend on the event type.
     */
    data: StreamEventData;
};
export type SchemaFormat = "original" | "streaming_events";
export interface LogStreamCallbackHandlerInput extends BaseCallbackHandlerInput {
    autoClose?: boolean;
    includeNames?: string[];
    includeTypes?: string[];
    includeTags?: string[];
    excludeNames?: string[];
    excludeTypes?: string[];
    excludeTags?: string[];
    _schemaFormat?: SchemaFormat;
}
/**
 * Class that extends the `BaseTracer` class from the
 * `langchain.callbacks.tracers.base` module. It represents a callback
 * handler that logs the execution of runs and emits `RunLog` instances to a
 * `RunLogStream`.
 */
export declare class LogStreamCallbackHandler extends BaseTracer {
    protected autoClose: boolean;
    protected includeNames?: string[];
    protected includeTypes?: string[];
    protected includeTags?: string[];
    protected excludeNames?: string[];
    protected excludeTypes?: string[];
    protected excludeTags?: string[];
    protected _schemaFormat: SchemaFormat;
    protected rootId?: string;
    private keyMapByRunId;
    private counterMapByRunName;
    protected transformStream: TransformStream;
    writer: WritableStreamDefaultWriter;
    receiveStream: IterableReadableStream<RunLogPatch>;
    name: string;
    constructor(fields?: LogStreamCallbackHandlerInput);
    [Symbol.asyncIterator](): IterableReadableStream<RunLogPatch>;
    protected persistRun(_run: Run): Promise<void>;
    _includeRun(run: Run): boolean;
    tapOutputIterable<T>(runId: string, output: AsyncGenerator<T>): AsyncGenerator<T>;
    onRunCreate(run: Run): Promise<void>;
    onRunUpdate(run: Run): Promise<void>;
    onLLMNewToken(run: Run, token: string, kwargs?: HandleLLMNewTokenCallbackFields): Promise<void>;
}
