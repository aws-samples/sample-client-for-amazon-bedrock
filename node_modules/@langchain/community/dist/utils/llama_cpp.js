import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";
export function createLlamaModel(inputs) {
    const options = {
        gpuLayers: inputs?.gpuLayers,
        modelPath: inputs.modelPath,
        useMlock: inputs?.useMlock,
        useMmap: inputs?.useMmap,
        vocabOnly: inputs?.vocabOnly,
    };
    return new LlamaModel(options);
}
export function createLlamaContext(model, inputs) {
    const options = {
        batchSize: inputs?.batchSize,
        contextSize: inputs?.contextSize,
        embedding: inputs?.embedding,
        f16Kv: inputs?.f16Kv,
        logitsAll: inputs?.logitsAll,
        model,
        prependBos: inputs?.prependBos,
        seed: inputs?.seed,
        threads: inputs?.threads,
    };
    return new LlamaContext(options);
}
export function createLlamaSession(context) {
    return new LlamaChatSession({ context });
}
