"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLLM = void 0;
const base_1 = require("@langchain/core/language_models/base");
const load_js_1 = require("../util/load.cjs");
const parse_js_1 = require("../util/parse.cjs");
/**
 * Load an LLM from a local file.
 *
 * @example
 * ```ts
 * import { loadLLM } from "langchain/llms/load";
 * const model = await loadLLM("/path/to/llm.json");
 * ```
 */
const loader = (file, path) => base_1.BaseLanguageModel.deserialize((0, parse_js_1.parseFileConfig)(file, path));
const loadLLM = (uri) => (0, load_js_1.loadFromFile)(uri, loader);
exports.loadLLM = loadLLM;
