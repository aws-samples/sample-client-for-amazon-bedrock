import type { RunnableInterface, RunnableIOSchema } from "./types.js";
interface Edge {
    source: string;
    target: string;
    data?: string;
}
interface Node {
    id: string;
    data: RunnableIOSchema | RunnableInterface;
}
export declare function nodeDataStr(node: Node): string;
export declare class Graph {
    nodes: Record<string, Node>;
    edges: Edge[];
    toJSON(): Record<string, any>;
    addNode(data: RunnableInterface | RunnableIOSchema, id?: string): Node;
    removeNode(node: Node): void;
    addEdge(source: Node, target: Node, data?: string): Edge;
    firstNode(): Node | undefined;
    lastNode(): Node | undefined;
    extend(graph: Graph): void;
    trimFirstNode(): void;
    trimLastNode(): void;
}
export {};
