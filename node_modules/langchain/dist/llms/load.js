import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { loadFromFile } from "../util/load.js";
import { parseFileConfig } from "../util/parse.js";
/**
 * Load an LLM from a local file.
 *
 * @example
 * ```ts
 * import { loadLLM } from "langchain/llms/load";
 * const model = await loadLLM("/path/to/llm.json");
 * ```
 */
const loader = (file, path) => BaseLanguageModel.deserialize(parseFileConfig(file, path));
export const loadLLM = (uri) => loadFromFile(uri, loader);
