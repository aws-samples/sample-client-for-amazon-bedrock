import { SpeechToTextRequest } from "sonix-speech-recognition/lib/types.js";
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
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
export declare class SonixAudioTranscriptionLoader extends BaseDocumentLoader {
    private readonly sonixSpeechRecognitionService;
    private readonly speechToTextRequest;
    constructor({ sonixAuthKey, request: speechToTextRequest, }: {
        sonixAuthKey: string;
        request: SpeechToTextRequest;
    });
    /**
     * Performs the speech-to-text transcription using the
     * SonixSpeechRecognitionService and returns the transcribed text as a
     * Document object.
     * @returns An array of Document objects containing the transcribed text.
     */
    load(): Promise<Document[]>;
}
