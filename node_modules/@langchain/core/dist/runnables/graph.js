import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import { isRunnableInterface } from "./utils.js";
const MAX_DATA_DISPLAY_NAME_LENGTH = 42;
export function nodeDataStr(node) {
    if (!isUuid(node.id)) {
        return node.id;
    }
    else if (isRunnableInterface(node.data)) {
        try {
            let data = node.data.toString();
            if (data.startsWith("<") ||
                data[0] !== data[0].toUpperCase() ||
                data.split("\n").length > 1) {
                data = node.data.getName();
            }
            else if (data.length > MAX_DATA_DISPLAY_NAME_LENGTH) {
                data = `${data.substring(0, MAX_DATA_DISPLAY_NAME_LENGTH)}...`;
            }
            return data.startsWith("Runnable") ? data.slice("Runnable".length) : data;
        }
        catch (error) {
            return node.data.getName();
        }
    }
    else {
        return node.data.name ?? "UnknownSchema";
    }
}
function nodeDataJson(node) {
    // if node.data is implements Runnable
    if (isRunnableInterface(node.data)) {
        return {
            type: "runnable",
            data: {
                id: node.data.lc_id,
                name: node.data.getName(),
            },
        };
    }
    else {
        return {
            type: "schema",
            data: { ...zodToJsonSchema(node.data.schema), title: node.data.name },
        };
    }
}
export class Graph {
    constructor() {
        Object.defineProperty(this, "nodes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "edges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    // Convert the graph to a JSON-serializable format.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON() {
        const stableNodeIds = {};
        Object.values(this.nodes).forEach((node, i) => {
            stableNodeIds[node.id] = isUuid(node.id) ? i : node.id;
        });
        return {
            nodes: Object.values(this.nodes).map((node) => ({
                id: stableNodeIds[node.id],
                ...nodeDataJson(node),
            })),
            edges: this.edges.map((edge) => edge.data
                ? {
                    source: stableNodeIds[edge.source],
                    target: stableNodeIds[edge.target],
                    data: edge.data,
                }
                : {
                    source: stableNodeIds[edge.source],
                    target: stableNodeIds[edge.target],
                }),
        };
    }
    addNode(data, id) {
        if (id !== undefined && this.nodes[id] !== undefined) {
            throw new Error(`Node with id ${id} already exists`);
        }
        const nodeId = id || uuidv4();
        const node = { id: nodeId, data };
        this.nodes[nodeId] = node;
        return node;
    }
    removeNode(node) {
        // Remove the node from the nodes map
        delete this.nodes[node.id];
        // Filter out edges connected to the node
        this.edges = this.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
    }
    addEdge(source, target, data) {
        if (this.nodes[source.id] === undefined) {
            throw new Error(`Source node ${source.id} not in graph`);
        }
        if (this.nodes[target.id] === undefined) {
            throw new Error(`Target node ${target.id} not in graph`);
        }
        const edge = { source: source.id, target: target.id, data };
        this.edges.push(edge);
        return edge;
    }
    firstNode() {
        const targets = new Set(this.edges.map((edge) => edge.target));
        const found = [];
        Object.values(this.nodes).forEach((node) => {
            if (!targets.has(node.id)) {
                found.push(node);
            }
        });
        return found[0];
    }
    lastNode() {
        const sources = new Set(this.edges.map((edge) => edge.source));
        const found = [];
        Object.values(this.nodes).forEach((node) => {
            if (!sources.has(node.id)) {
                found.push(node);
            }
        });
        return found[0];
    }
    extend(graph) {
        // Add all nodes from the other graph, taking care to avoid duplicates
        Object.entries(graph.nodes).forEach(([key, value]) => {
            this.nodes[key] = value;
        });
        // Add all edges from the other graph
        this.edges = [...this.edges, ...graph.edges];
    }
    trimFirstNode() {
        const firstNode = this.firstNode();
        if (firstNode) {
            const outgoingEdges = this.edges.filter((edge) => edge.source === firstNode.id);
            if (Object.keys(this.nodes).length === 1 || outgoingEdges.length === 1) {
                this.removeNode(firstNode);
            }
        }
    }
    trimLastNode() {
        const lastNode = this.lastNode();
        if (lastNode) {
            const incomingEdges = this.edges.filter((edge) => edge.target === lastNode.id);
            if (Object.keys(this.nodes).length === 1 || incomingEdges.length === 1) {
                this.removeNode(lastNode);
            }
        }
    }
}
