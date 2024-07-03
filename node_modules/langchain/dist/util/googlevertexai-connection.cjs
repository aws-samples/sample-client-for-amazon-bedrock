"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleVertexAIStream = exports.GoogleVertexAILLMConnection = exports.simpleValue = exports.complexValue = exports.GoogleVertexAIConnection = exports.GoogleConnection = void 0;
class GoogleConnection {
    constructor(caller, client, streaming) {
        Object.defineProperty(this, "caller", {
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
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.caller = caller;
        this.client = client;
        this.streaming = streaming ?? false;
    }
    async _request(data, options) {
        const url = await this.buildUrl();
        const method = this.buildMethod();
        const opts = {
            url,
            method,
        };
        if (data && method === "POST") {
            opts.data = data;
        }
        if (this.streaming) {
            opts.responseType = "stream";
        }
        else {
            opts.responseType = "json";
        }
        const callResponse = await this.caller.callWithOptions({ signal: options?.signal }, async () => this.client.request(opts));
        const response = callResponse; // Done for typecast safety, I guess
        return response;
    }
}
exports.GoogleConnection = GoogleConnection;
class GoogleVertexAIConnection extends GoogleConnection {
    constructor(fields, caller, client, streaming) {
        super(caller, client, streaming);
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "us-central1-aiplatform.googleapis.com"
        });
        Object.defineProperty(this, "location", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "us-central1"
        });
        Object.defineProperty(this, "apiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "v1"
        });
        this.caller = caller;
        this.endpoint = fields?.endpoint ?? this.endpoint;
        this.location = fields?.location ?? this.location;
        this.apiVersion = fields?.apiVersion ?? this.apiVersion;
        this.client = client;
    }
    buildMethod() {
        return "POST";
    }
}
exports.GoogleVertexAIConnection = GoogleVertexAIConnection;
function complexValue(value) {
    if (value === null || typeof value === "undefined") {
        // I dunno what to put here. An error, probably
        return undefined;
    }
    else if (typeof value === "object") {
        if (Array.isArray(value)) {
            return {
                list_val: value.map((avalue) => complexValue(avalue)),
            };
        }
        else {
            const ret = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const v = value;
            Object.keys(v).forEach((key) => {
                ret[key] = complexValue(v[key]);
            });
            return { struct_val: ret };
        }
    }
    else if (typeof value === "number") {
        if (Number.isInteger(value)) {
            return { int_val: value };
        }
        else {
            return { float_val: value };
        }
    }
    else {
        return {
            string_val: [value],
        };
    }
}
exports.complexValue = complexValue;
function simpleValue(val) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
        // eslint-disable-next-line no-prototype-builtins
        if (val.hasOwnProperty("stringVal")) {
            return val.stringVal[0];
            // eslint-disable-next-line no-prototype-builtins
        }
        else if (val.hasOwnProperty("boolVal")) {
            return val.boolVal[0];
            // eslint-disable-next-line no-prototype-builtins
        }
        else if (val.hasOwnProperty("listVal")) {
            const { listVal } = val;
            return listVal.map((aval) => simpleValue(aval));
            // eslint-disable-next-line no-prototype-builtins
        }
        else if (val.hasOwnProperty("structVal")) {
            const ret = {};
            const struct = val.structVal;
            Object.keys(struct).forEach((key) => {
                ret[key] = simpleValue(struct[key]);
            });
            return ret;
        }
        else {
            const ret = {};
            const struct = val;
            Object.keys(struct).forEach((key) => {
                ret[key] = simpleValue(struct[key]);
            });
            return ret;
        }
    }
    else if (Array.isArray(val)) {
        return val.map((aval) => simpleValue(aval));
    }
    else {
        return val;
    }
}
exports.simpleValue = simpleValue;
class GoogleVertexAILLMConnection extends GoogleVertexAIConnection {
    constructor(fields, caller, client, streaming) {
        super(fields, caller, client, streaming);
        Object.defineProperty(this, "model", {
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
        this.client = client;
        this.model = fields?.model ?? this.model;
    }
    async buildUrl() {
        const projectId = await this.client.getProjectId();
        const method = this.streaming ? "serverStreamingPredict" : "predict";
        const url = `https://${this.endpoint}/v1/projects/${projectId}/locations/${this.location}/publishers/google/models/${this.model}:${method}`;
        return url;
    }
    formatStreamingData(inputs, parameters) {
        return {
            inputs: [inputs.map((i) => complexValue(i))],
            parameters: complexValue(parameters),
        };
    }
    formatStandardData(instances, parameters) {
        return {
            instances,
            parameters,
        };
    }
    formatData(instances, parameters) {
        return this.streaming
            ? this.formatStreamingData(instances, parameters)
            : this.formatStandardData(instances, parameters);
    }
    async request(instances, parameters, options) {
        const data = this.formatData(instances, parameters);
        const response = await this._request(data, options);
        return response;
    }
}
exports.GoogleVertexAILLMConnection = GoogleVertexAILLMConnection;
class GoogleVertexAIStream {
    constructor() {
        Object.defineProperty(this, "_buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "_bufferOpen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "_firstRun", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        // Set up a potential Promise that the handler can resolve.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "_chunkResolution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // If there is no Promise (it is null), the handler must add it to the queue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "_chunkPending", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // A queue that will collect chunks while there is no Promise
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "_chunkQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    /**
     * Add data to the buffer. This may cause chunks to be generated, if available.
     * @param data
     */
    appendBuffer(data) {
        this._buffer += data;
        // Our first time, skip to the opening of the array
        if (this._firstRun) {
            this._skipTo("[");
            this._firstRun = false;
        }
        this._parseBuffer();
    }
    /**
     * Indicate there is no more data that will be added to the text buffer.
     * This should be called when all the data has been read and added to indicate
     * that we should process everything remaining in the buffer.
     */
    closeBuffer() {
        this._bufferOpen = false;
        this._parseBuffer();
    }
    /**
     * Skip characters in the buffer till we get to the start of an object.
     * Then attempt to read a full object.
     * If we do read a full object, turn it into a chunk and send it to the chunk handler.
     * Repeat this for as much as we can.
     */
    _parseBuffer() {
        let obj = null;
        do {
            this._skipTo("{");
            obj = this._getFullObject();
            if (obj !== null) {
                const chunk = this._simplifyObject(obj);
                this._handleChunk(chunk);
            }
        } while (obj !== null);
        if (!this._bufferOpen) {
            // No more data will be added, and we have parsed everything we could,
            // so everything else is garbage.
            this._handleChunk(null);
            this._buffer = "";
        }
    }
    /**
     * If the string is present, move the start of the buffer to the first occurrence
     * of that string. This is useful for skipping over elements or parts that we're not
     * really interested in parsing. (ie - the opening characters, comma separators, etc.)
     * @param start The string to start the buffer with
     */
    _skipTo(start) {
        const index = this._buffer.indexOf(start);
        if (index > 0) {
            this._buffer = this._buffer.slice(index);
        }
    }
    /**
     * Given what is in the buffer, parse a single object out of it.
     * If a complete object isn't available, return null.
     * Assumes that we are at the start of an object to parse.
     */
    _getFullObject() {
        let ret = null;
        // Loop while we don't have something to return AND we have something in the buffer
        let index = 0;
        while (ret === null && this._buffer.length > index) {
            // Advance to the next close bracket after our current index
            index = this._buffer.indexOf("}", index + 1);
            // If we don't find one, exit with null
            if (index === -1) {
                return null;
            }
            // If we have one, try to turn it into an object to return
            try {
                const objStr = this._buffer.substring(0, index + 1);
                ret = JSON.parse(objStr);
                // We only get here if it parsed it ok
                // If we did turn it into an object, remove it from the buffer
                this._buffer = this._buffer.slice(index + 1);
            }
            catch (xx) {
                // It didn't parse it correctly, so we swallow the exception and continue
            }
        }
        return ret;
    }
    _simplifyObject(obj) {
        return simpleValue(obj);
    }
    /**
     * Register that we have another chunk available for consumption.
     * If we are waiting for a chunk, resolve the promise waiting for it immediately.
     * If not, then add it to the queue.
     * @param chunk
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _handleChunk(chunk) {
        if (this._chunkPending) {
            this._chunkResolution(chunk);
            this._chunkPending = null;
        }
        else {
            this._chunkQueue.push(chunk);
        }
    }
    /**
     * Get the next chunk that is coming from the stream.
     * This chunk may be null, usually indicating the last chunk in the stream.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async nextChunk() {
        if (this._chunkQueue.length > 0) {
            // If there is data in the queue, return the next queue chunk
            return this._chunkQueue.shift();
        }
        else {
            // Otherwise, set up a promise that handleChunk will cause to be resolved
            this._chunkPending = new Promise((resolve) => {
                this._chunkResolution = resolve;
            });
            return this._chunkPending;
        }
    }
    /**
     * Is the stream done?
     * A stream is only done if all of the following are true:
     * - There is no more data to be added to the text buffer
     * - There is no more data in the text buffer
     * - There are no chunks that are waiting to be consumed
     */
    get streamDone() {
        return (!this._bufferOpen &&
            this._buffer.length === 0 &&
            this._chunkQueue.length === 0 &&
            this._chunkPending === null);
    }
}
exports.GoogleVertexAIStream = GoogleVertexAIStream;
