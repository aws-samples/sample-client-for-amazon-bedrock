"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonixAudioTranscriptionLoader = void 0;
const sonix_speech_recognition_1 = require("sonix-speech-recognition");
const documents_1 = require("@langchain/core/documents");
const base_js_1 = require("../base.cjs");
/**
 * A class that represents a document loader for transcribing audio files
 * using the Sonix Speech Recognition service.
 * @example
 * ```typescript
 * const loader = new SonixAudioTranscriptionLoader({
 *   sonixAuthKey: "SONIX_AUTH_KEY",
 *   request: {
 *     audioFilePath: "LOCAL_AUDIO_FILE_PATH",
 *     fileName: "FILE_NAME",
 *     language: "en",
 *   },
 * });
 * const docs = await loader.load();
 * ```
 */
class SonixAudioTranscriptionLoader extends base_js_1.BaseDocumentLoader {
    constructor({ sonixAuthKey, request: speechToTextRequest, }) {
        super();
        Object.defineProperty(this, "sonixSpeechRecognitionService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "speechToTextRequest", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sonixSpeechRecognitionService = new sonix_speech_recognition_1.SonixSpeechRecognitionService(sonixAuthKey);
        this.speechToTextRequest = speechToTextRequest;
    }
    /**
     * Performs the speech-to-text transcription using the
     * SonixSpeechRecognitionService and returns the transcribed text as a
     * Document object.
     * @returns An array of Document objects containing the transcribed text.
     */
    async load() {
        const { text, status, error } = await this.sonixSpeechRecognitionService.speechToText(this.speechToTextRequest);
        if (status === "failed") {
            throw new Error(`Failed to transcribe audio file. Error: ${error}`);
        }
        const document = new documents_1.Document({
            pageContent: text,
            metadata: {
                fileName: this.speechToTextRequest.fileName,
            },
        });
        return [document];
    }
}
exports.SonixAudioTranscriptionLoader = SonixAudioTranscriptionLoader;
