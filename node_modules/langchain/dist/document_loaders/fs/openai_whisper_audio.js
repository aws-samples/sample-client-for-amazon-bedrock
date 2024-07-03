import { OpenAIClient, toFile } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { BufferLoader } from "./buffer.js";
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
export class OpenAIWhisperAudio extends BufferLoader {
    constructor(filePathOrBlob, fields) {
        super(filePathOrBlob);
        Object.defineProperty(this, "openAIClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.openAIClient = new OpenAIClient(fields?.clientOptions);
    }
    async parse(raw, metadata) {
        const fileName = metadata.source === "blob" ? metadata.blobType : metadata.source;
        const transcriptionResponse = await this.openAIClient.audio.transcriptions.create({
            file: await toFile(raw, fileName),
            model: MODEL_NAME,
        });
        const document = new Document({
            pageContent: transcriptionResponse.text,
            metadata,
        });
        return [document];
    }
}
