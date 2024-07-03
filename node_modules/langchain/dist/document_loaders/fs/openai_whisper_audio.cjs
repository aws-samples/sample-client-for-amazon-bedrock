"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIWhisperAudio = void 0;
const openai_1 = require("@langchain/openai");
const documents_1 = require("@langchain/core/documents");
const buffer_js_1 = require("./buffer.cjs");
const MODEL_NAME = "whisper-1";
/**
 * @example
 * ```typescript
 * const loader = new OpenAIWhisperAudio(
 *   "./src/document_loaders/example_data/test.mp3",
 * );
 * const docs = await loader.load();
 * console.log(docs);
 * ```
 */
class OpenAIWhisperAudio extends buffer_js_1.BufferLoader {
    constructor(filePathOrBlob, fields) {
        super(filePathOrBlob);
        Object.defineProperty(this, "openAIClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.openAIClient = new openai_1.OpenAIClient(fields?.clientOptions);
    }
    async parse(raw, metadata) {
        const fileName = metadata.source === "blob" ? metadata.blobType : metadata.source;
        const transcriptionResponse = await this.openAIClient.audio.transcriptions.create({
            file: await (0, openai_1.toFile)(raw, fileName),
            model: MODEL_NAME,
        });
        const document = new documents_1.Document({
            pageContent: transcriptionResponse.text,
            metadata,
        });
        return [document];
    }
}
exports.OpenAIWhisperAudio = OpenAIWhisperAudio;
