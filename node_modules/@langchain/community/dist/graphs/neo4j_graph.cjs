"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jGraph = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
/**
 * @security *Security note*: Make sure that the database connection uses credentials
 * that are narrowly-scoped to only include necessary permissions.
 * Failure to do so may result in data corruption or loss, since the calling
 * code may attempt commands that would result in deletion, mutation
 * of data if appropriately prompted or reading sensitive data if such
 * data is present in the database.
 * The best way to guard against such negative outcomes is to (as appropriate)
 * limit the permissions granted to the credentials used with this tool.
 * For example, creating read only users for the database is a good way to
 * ensure that the calling code cannot mutate or delete data.
 *
 * @link See https://js.langchain.com/docs/security for more information.
 */
class Neo4jGraph {
    constructor({ url, username, password, database = "neo4j", timeoutMs, }) {
        Object.defineProperty(this, "driver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "database", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeoutMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "structuredSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                nodeProps: {},
                relProps: {},
                relationships: [],
            }
        });
        try {
            this.driver = neo4j_driver_1.default.driver(url, neo4j_driver_1.default.auth.basic(username, password));
            this.database = database;
            this.timeoutMs = timeoutMs;
        }
        catch (error) {
            throw new Error("Could not create a Neo4j driver instance. Please check the connection details.");
        }
    }
    static async initialize(config) {
        const graph = new Neo4jGraph(config);
        try {
            await graph.verifyConnectivity();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            console.log("Failed to verify connection.");
        }
        try {
            await graph.refreshSchema();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            const message = [
                "Could not use APOC procedures.",
                "Please ensure the APOC plugin is installed in Neo4j and that",
                "'apoc.meta.data()' is allowed in Neo4j configuration",
            ].join("\n");
            throw new Error(message);
        }
        finally {
            console.log("Schema refreshed successfully.");
        }
        return graph;
    }
    getSchema() {
        return this.schema;
    }
    getStructuredSchema() {
        return this.structuredSchema;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async query(query, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params = {}, routing = neo4j_driver_1.default.routing.WRITE) {
        const result = await this.driver.executeQuery(query, params, {
            database: this.database,
            routing,
            transactionConfig: { timeout: this.timeoutMs },
        });
        return toObjects(result.records);
    }
    async verifyConnectivity() {
        await this.driver.verifyAuthentication();
    }
    async refreshSchema() {
        const nodePropertiesQuery = `
      CALL apoc.meta.data()
      YIELD label, other, elementType, type, property
      WHERE NOT type = "RELATIONSHIP" AND elementType = "node"
      WITH label AS nodeLabels, collect({property:property, type:type}) AS properties
      RETURN {labels: nodeLabels, properties: properties} AS output
    `;
        const relPropertiesQuery = `
      CALL apoc.meta.data()
      YIELD label, other, elementType, type, property
      WHERE NOT type = "RELATIONSHIP" AND elementType = "relationship"
      WITH label AS nodeLabels, collect({property:property, type:type}) AS properties
      RETURN {type: nodeLabels, properties: properties} AS output
    `;
        const relQuery = `
      CALL apoc.meta.data()
      YIELD label, other, elementType, type, property
      WHERE type = "RELATIONSHIP" AND elementType = "node"
      UNWIND other AS other_node
      RETURN {start: label, type: property, end: toString(other_node)} AS output
    `;
        // Assuming query method is defined and returns a Promise
        const nodeProperties = (await this.query(nodePropertiesQuery))?.map((el) => el.output);
        const relationshipsProperties = (await this.query(relPropertiesQuery))?.map((el) => el.output);
        const relationships = (await this.query(relQuery))?.map((el) => el.output);
        // Structured schema similar to Python's dictionary comprehension
        this.structuredSchema = {
            nodeProps: Object.fromEntries(nodeProperties?.map((el) => [el.labels, el.properties]) || []),
            relProps: Object.fromEntries(relationshipsProperties?.map((el) => [el.type, el.properties]) || []),
            relationships: relationships || [],
        };
        // Format node properties
        const formattedNodeProps = nodeProperties?.map((el) => {
            const propsStr = el.properties
                .map((prop) => `${prop.property}: ${prop.type}`)
                .join(", ");
            return `${el.labels} {${propsStr}}`;
        });
        // Format relationship properties
        const formattedRelProps = relationshipsProperties?.map((el) => {
            const propsStr = el.properties
                .map((prop) => `${prop.property}: ${prop.type}`)
                .join(", ");
            return `${el.type} {${propsStr}}`;
        });
        // Format relationships
        const formattedRels = relationships?.map((el) => `(:${el.start})-[:${el.type}]->(:${el.end})`);
        // Combine all formatted elements into a single string
        this.schema = [
            "Node properties are the following:",
            formattedNodeProps?.join(", "),
            "Relationship properties are the following:",
            formattedRelProps?.join(", "),
            "The relationships are the following:",
            formattedRels?.join(", "),
        ].join("\n");
    }
    async close() {
        await this.driver.close();
    }
}
exports.Neo4jGraph = Neo4jGraph;
function toObjects(records) {
    return records.map((record) => {
        const rObj = record.toObject();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const out = {};
        Object.keys(rObj).forEach((key) => {
            out[key] = itemIntToString(rObj[key]);
        });
        return out;
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function itemIntToString(item) {
    if (neo4j_driver_1.default.isInt(item))
        return item.toString();
    if (Array.isArray(item))
        return item.map((ii) => itemIntToString(ii));
    if (["number", "string", "boolean"].indexOf(typeof item) !== -1)
        return item;
    if (item === null)
        return item;
    if (typeof item === "object")
        return objIntToString(item);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function objIntToString(obj) {
    const entry = extractFromNeoObjects(obj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newObj = null;
    if (Array.isArray(entry)) {
        newObj = entry.map((item) => itemIntToString(item));
    }
    else if (entry !== null && typeof entry === "object") {
        newObj = {};
        Object.keys(entry).forEach((key) => {
            newObj[key] = itemIntToString(entry[key]);
        });
    }
    return newObj;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFromNeoObjects(obj) {
    if (
    // eslint-disable-next-line
    obj instanceof neo4j_driver_1.default.types.Node ||
        // eslint-disable-next-line
        obj instanceof neo4j_driver_1.default.types.Relationship) {
        return obj.properties;
        // eslint-disable-next-line
    }
    else if (obj instanceof neo4j_driver_1.default.types.Path) {
        // eslint-disable-next-line
        return [].concat.apply([], extractPathForRows(obj));
    }
    return obj;
}
const extractPathForRows = (path) => {
    let { segments } = path;
    // Zero length path. No relationship, end === start
    if (!Array.isArray(path.segments) || path.segments.length < 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        segments = [{ ...path, end: null }];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return segments.map((segment) => [
        objIntToString(segment.start),
        objIntToString(segment.relationship),
        objIntToString(segment.end),
    ].filter((part) => part !== null));
};
