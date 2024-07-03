import { Schema } from "./types.js";
export declare const schemaKeyword: Record<string, boolean>;
export declare const schemaArrayKeyword: Record<string, boolean>;
export declare const schemaMapKeyword: Record<string, boolean>;
export declare const ignoredKeyword: Record<string, boolean>;
/**
 * Default base URI for schemas without an $id.
 * https://json-schema.org/draft/2019-09/json-schema-core.html#initial-base
 * https://tools.ietf.org/html/rfc3986#section-5.1
 */
export declare let initialBaseURI: URL;
export declare function dereference(schema: Schema | boolean, lookup?: Record<string, Schema | boolean>, baseURI?: URL, basePointer?: string): Record<string, boolean | Schema>;
