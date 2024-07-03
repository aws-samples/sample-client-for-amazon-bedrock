/** @internal */
export declare class Node<T> {
    key?: string | undefined;
    value?: T | undefined;
    children: Map<string, Node<T>>;
    constructor(key?: string | undefined, value?: T | undefined, children?: Map<string, Node<T>>);
}
/** @internal */
export type KeySplitter = (key: string) => string[];
/** @internal */
export declare enum TrieOp {
    Insert = 0,
    Delete = 1,
    Find = 2
}
/** @internal */
export declare class Trie<T> {
    protected root: Node<T>;
    protected split_key: KeySplitter;
    constructor(split: KeySplitter | string);
    protected find_node(key: string, op: TrieOp): Node<T> | undefined;
    insert(key: string, value: T): void;
    remove(key: string): void;
    find(key: string): T | undefined;
}
