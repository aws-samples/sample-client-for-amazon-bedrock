import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * Configuration options for the YoutubeLoader class. Includes properties
 * such as the videoId, language, and addVideoInfo.
 */
interface YoutubeConfig {
    videoId: string;
    language?: string;
    addVideoInfo?: boolean;
}
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
export declare class YoutubeLoader extends BaseDocumentLoader {
    private videoId;
    private language?;
    private addVideoInfo;
    constructor(config: YoutubeConfig);
    /**
     * Extracts the videoId from a YouTube video URL.
     * @param url The URL of the YouTube video.
     * @returns The videoId of the YouTube video.
     */
    private static getVideoID;
    /**
     * Creates a new instance of the YoutubeLoader class from a YouTube video
     * URL.
     * @param url The URL of the YouTube video.
     * @param config Optional configuration options for the YoutubeLoader instance, excluding the videoId.
     * @returns A new instance of the YoutubeLoader class.
     */
    static createFromUrl(url: string, config?: Omit<YoutubeConfig, "videoId">): YoutubeLoader;
    /**
     * Loads the transcript and video metadata from the specified YouTube
     * video. It uses the youtube-transcript library to fetch the transcript
     * and the youtubei.js library to fetch the video metadata.
     * @returns An array of Documents representing the retrieved data.
     */
    load(): Promise<Document[]>;
}
export {};
