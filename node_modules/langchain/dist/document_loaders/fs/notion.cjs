"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionLoader = void 0;
const directory_js_1 = require("./directory.cjs");
const text_js_1 = require("./text.cjs");
/**
 * A class that extends the DirectoryLoader class. It represents a
 * document loader that loads documents from a directory in the Notion
 * format. It uses the TextLoader for loading '.md' files and ignores
 * unknown file types.
 */
class NotionLoader extends directory_js_1.DirectoryLoader {
    constructor(directoryPath) {
        super(directoryPath, {
            ".md": (filePath) => new text_js_1.TextLoader(filePath),
        }, true, directory_js_1.UnknownHandling.Ignore);
    }
}
exports.NotionLoader = NotionLoader;
