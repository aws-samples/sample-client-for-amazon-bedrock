/// <reference types="node" resolution-mode="require"/>
import { DirectoryLoader } from "./directory.js";
export type FrontMatter = {
    title?: string;
    description?: string;
    tags?: string[] | string;
    [key: string]: unknown;
};
export interface ObsidianFileLoaderOptions {
    encoding?: BufferEncoding;
    collectMetadata?: boolean;
}
/**
 * Represents a loader for directories containing Obsidian markdown files. This loader extends
 * the DirectoryLoader and provides functionality to load and parse '.md' files with YAML frontmatter,
 * Obsidian tags, and Dataview fields.
 */
export declare class ObsidianLoader extends DirectoryLoader {
    /**
     * Initializes a new instance of the ObsidianLoader class.
     * @param directoryPath The path to the directory containing Obsidian markdown files.
     * @param encoding The character encoding to use when reading files. Defaults to 'utf-8'.
     * @param collectMetadata Determines whether metadata should be collected from the files. Defaults to true.
     */
    constructor(directoryPath: string, options?: ObsidianFileLoaderOptions);
}
