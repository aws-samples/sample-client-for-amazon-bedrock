/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/** @internal */
export class Node<T> {
    constructor(
        public key?: string,
        public value?: T,
        public children: Map<string, Node<T>> = new Map<string, Node<T>>()) {
    }
}

/** @internal */
export type KeySplitter = (key: string) => string[];
/** @internal */
export enum TrieOp {
    Insert,
    Delete,
    Find,
};

/** @internal */
export class Trie<T> {
    protected root = new Node<T>();
    protected split_key: KeySplitter;

    constructor(split: KeySplitter | string) {
        if (typeof (split) === 'string') {
            const delimeter = split;
            split = (key: string) => {
                return key.split(delimeter);
            }
        }
        this.split_key = split;
    }

    protected find_node(key: string, op: TrieOp) {
        const parts = this.split_key(key);
        let current = this.root;
        let parent = undefined;
        for (const part of parts) {
            let child = current.children.get(part);
            if (!child) {
                if (op == TrieOp.Insert) {
                    current.children.set(part, child = new Node(part));
                }
                else {
                    return undefined;
                }
            }
            parent = current;
            current = child;
        }
        if (parent && op == TrieOp.Delete) {
            parent.children.delete(current.key!);
        }
        return current;
    }

    insert(key: string, value: T) {
        let node = this.find_node(key, TrieOp.Insert);
        node!.value = value;
    }

    remove(key: string) {
        this.find_node(key, TrieOp.Delete);
    }

    find(key: string) {
        const node = this.find_node(key, TrieOp.Find);
        return node ? node.value : undefined;
    }
}
