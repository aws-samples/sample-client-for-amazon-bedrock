import { Embeddings } from "@langchain/core/embeddings";
export class OllamaEmbeddings extends Embeddings {
    constructor(params) {
        super({ maxConcurrency: 1, ...params });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "llama2"
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "http://localhost:11434"
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keepAlive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "5m"
        });
        Object.defineProperty(this, "requestOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (params?.model) {
            this.model = params.model;
        }
        if (params?.baseUrl) {
            this.baseUrl = params.baseUrl;
        }
        if (params?.headers) {
            this.headers = params.headers;
        }
        if (params?.keepAlive) {
            this.keepAlive = params.keepAlive;
        }
        if (params?.requestOptions) {
            this.requestOptions = this._convertOptions(params.requestOptions);
        }
    }
    /** convert camelCased Ollama request options like "useMMap" to
     * the snake_cased equivalent which the ollama API actually uses.
     * Used only for consistency with the llms/Ollama and chatModels/Ollama classes
     */
    _convertOptions(requestOptions) {
        const snakeCasedOptions = {};
        const mapping = {
            embeddingOnly: "embedding_only",
            f16KV: "f16_kv",
            frequencyPenalty: "frequency_penalty",
            keepAlive: "keep_alive",
            logitsAll: "logits_all",
            lowVram: "low_vram",
            mainGpu: "main_gpu",
            mirostat: "mirostat",
            mirostatEta: "mirostat_eta",
            mirostatTau: "mirostat_tau",
            numBatch: "num_batch",
            numCtx: "num_ctx",
            numGpu: "num_gpu",
            numGqa: "num_gqa",
            numKeep: "num_keep",
            numPredict: "num_predict",
            numThread: "num_thread",
            penalizeNewline: "penalize_newline",
            presencePenalty: "presence_penalty",
            repeatLastN: "repeat_last_n",
            repeatPenalty: "repeat_penalty",
            ropeFrequencyBase: "rope_frequency_base",
            ropeFrequencyScale: "rope_frequency_scale",
            temperature: "temperature",
            stop: "stop",
            tfsZ: "tfs_z",
            topK: "top_k",
            topP: "top_p",
            typicalP: "typical_p",
            useMLock: "use_mlock",
            useMMap: "use_mmap",
            vocabOnly: "vocab_only",
        };
        for (const [key, value] of Object.entries(requestOptions)) {
            const snakeCasedOption = mapping[key];
            if (snakeCasedOption) {
                snakeCasedOptions[snakeCasedOption] = value;
            }
        }
        return snakeCasedOptions;
    }
    async _request(prompt) {
        const { model, baseUrl, keepAlive, requestOptions } = this;
        let formattedBaseUrl = baseUrl;
        if (formattedBaseUrl.startsWith("http://localhost:")) {
            // Node 18 has issues with resolving "localhost"
            // See https://github.com/node-fetch/node-fetch/issues/1624
            formattedBaseUrl = formattedBaseUrl.replace("http://localhost:", "http://127.0.0.1:");
        }
        const response = await fetch(`${formattedBaseUrl}/api/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.headers,
            },
            body: JSON.stringify({
                prompt,
                model,
                keep_alive: keepAlive,
                options: requestOptions,
            }),
        });
        if (!response.ok) {
            throw new Error(`Request to Ollama server failed: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return json.embedding;
    }
    async _embed(texts) {
        const embeddings = await Promise.all(texts.map((text) => this.caller.call(() => this._request(text))));
        return embeddings;
    }
    async embedDocuments(documents) {
        return this._embed(documents);
    }
    async embedQuery(document) {
        return (await this.embedDocuments([document]))[0];
    }
}
