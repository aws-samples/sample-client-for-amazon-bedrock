"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTextDescriptionAndArgs = exports.renderTextDescription = void 0;
const zod_to_json_schema_1 = require("zod-to-json-schema");
/**
 * Render the tool name and description in plain text.
 *
 * Output will be in the format of:
 * ```
 * search: This tool is used for search
 * calculator: This tool is used for math
 * ```
 * @param tools
 * @returns a string of all tools and their descriptions
 */
function renderTextDescription(tools) {
    return tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n");
}
exports.renderTextDescription = renderTextDescription;
/**
 * Render the tool name, description, and args in plain text.
 * Output will be in the format of:'
 * ```
 * search: This tool is used for search, args: {"query": {"type": "string"}}
 * calculator: This tool is used for math,
 * args: {"expression": {"type": "string"}}
 * ```
 * @param tools
 * @returns a string of all tools, their descriptions and a stringified version of their schemas
 */
function renderTextDescriptionAndArgs(tools) {
    return tools
        .map((tool) => `${tool.name}: ${tool.description}, args: ${JSON.stringify((0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema).properties)}`)
        .join("\n");
}
exports.renderTextDescriptionAndArgs = renderTextDescriptionAndArgs;
