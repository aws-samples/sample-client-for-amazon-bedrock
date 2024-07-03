import { DirectoryLoader } from "./directory.js";
/**
 * A class that extends the DirectoryLoader class. It represents a
 * document loader that loads documents from a directory in the Notion
 * format. It uses the TextLoader for loading '.md' files and ignores
 * unknown file types.
 */
export declare class NotionLoader extends DirectoryLoader {
    constructor(directoryPath: string);
}
