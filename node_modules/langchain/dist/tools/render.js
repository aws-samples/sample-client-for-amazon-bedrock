import { zodToJsonSchema } from "zod-to-json-schema";
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
export function renderTextDescription(tools) {
    return tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n");
}
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
export function renderTextDescriptionAndArgs(tools) {
    return tools
        .map((tool) => `${tool.name}: ${tool.description}, args: ${JSON.stringify(zodToJsonSchema(tool.schema).properties)}`)
        .join("\n");
}
