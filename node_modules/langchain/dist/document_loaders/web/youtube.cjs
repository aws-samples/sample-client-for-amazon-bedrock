"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeLoader = void 0;
const youtube_transcript_1 = require("youtube-transcript");
const youtubei_js_1 = require("youtubei.js");
const documents_1 = require("@langchain/core/documents");
const base_js_1 = require("../base.cjs");
/**
 * A document loader for loading data from YouTube videos. It uses the
 * youtube-transcript and youtubei.js libraries to fetch the transcript
 * and video metadata.
 * @example
 * ```typescript
 * const loader = new YoutubeLoader(
 *   "https:
 *   "en",
 *   true,
 * );
 * const docs = await loader.load();
 * ```
 */
class YoutubeLoader extends base_js_1.BaseDocumentLoader {
    constructor(config) {
        super();
        Object.defineProperty(this, "videoId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "language", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "addVideoInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.videoId = config.videoId;
        this.language = config?.language;
        this.addVideoInfo = config?.addVideoInfo ?? false;
    }
    /**
     * Extracts the videoId from a YouTube video URL.
     * @param url The URL of the YouTube video.
     * @returns The videoId of the YouTube video.
     */
    static getVideoID(url) {
        const match = url.match(/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/);
        if (match !== null && match[1].length === 11) {
            return match[1];
        }
        else {
            throw new Error("Failed to get youtube video id from the url");
        }
    }
    /**
     * Creates a new instance of the YoutubeLoader class from a YouTube video
     * URL.
     * @param url The URL of the YouTube video.
     * @param config Optional configuration options for the YoutubeLoader instance, excluding the videoId.
     * @returns A new instance of the YoutubeLoader class.
     */
    static createFromUrl(url, config) {
        const videoId = YoutubeLoader.getVideoID(url);
        return new YoutubeLoader({ ...config, videoId });
    }
    /**
     * Loads the transcript and video metadata from the specified YouTube
     * video. It uses the youtube-transcript library to fetch the transcript
     * and the youtubei.js library to fetch the video metadata.
     * @returns An array of Documents representing the retrieved data.
     */
    async load() {
        let transcript;
        const metadata = {
            source: this.videoId,
        };
        try {
            transcript = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(this.videoId, {
                lang: this.language,
            });
            if (transcript === undefined) {
                throw new Error("Transcription not found");
            }
            if (this.addVideoInfo) {
                const youtube = await youtubei_js_1.Innertube.create();
                const info = (await youtube.getBasicInfo(this.videoId)).basic_info;
                metadata.description = info.short_description;
                metadata.title = info.title;
                metadata.view_count = info.view_count;
                metadata.author = info.author;
            }
        }
        catch (e) {
            throw new Error(`Failed to get YouTube video transcription: ${e.message}`);
        }
        const document = new documents_1.Document({
            pageContent: transcript.map((item) => item.text).join(" "),
            metadata,
        });
        return [document];
    }
}
exports.YoutubeLoader = YoutubeLoader;
