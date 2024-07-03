"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trie = exports.TrieOp = exports.Node = void 0;
/** @internal */
var Node = /** @class */ (function () {
    function Node(key, value, children) {
        if (children === void 0) { children = new Map(); }
        this.key = key;
        this.value = value;
        this.children = children;
    }
    return Node;
}());
exports.Node = Node;
/** @internal */
var TrieOp;
(function (TrieOp) {
    TrieOp[TrieOp["Insert"] = 0] = "Insert";
    TrieOp[TrieOp["Delete"] = 1] = "Delete";
    TrieOp[TrieOp["Find"] = 2] = "Find";
})(TrieOp = exports.TrieOp || (exports.TrieOp = {}));
;
/** @internal */
var Trie = /** @class */ (function () {
    function Trie(split) {
        this.root = new Node();
        if (typeof (split) === 'string') {
            var delimeter_1 = split;
            split = function (key) {
                return key.split(delimeter_1);
            };
        }
        this.split_key = split;
    }
    Trie.prototype.find_node = function (key, op) {
        var e_1, _a;
        var parts = this.split_key(key);
        var current = this.root;
        var parent = undefined;
        try {
            for (var parts_1 = __values(parts), parts_1_1 = parts_1.next(); !parts_1_1.done; parts_1_1 = parts_1.next()) {
                var part = parts_1_1.value;
                var child = current.children.get(part);
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
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (parts_1_1 && !parts_1_1.done && (_a = parts_1.return)) _a.call(parts_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (parent && op == TrieOp.Delete) {
            parent.children.delete(current.key);
        }
        return current;
    };
    Trie.prototype.insert = function (key, value) {
        var node = this.find_node(key, TrieOp.Insert);
        node.value = value;
    };
    Trie.prototype.remove = function (key) {
        this.find_node(key, TrieOp.Delete);
    };
    Trie.prototype.find = function (key) {
        var node = this.find_node(key, TrieOp.Find);
        return node ? node.value : undefined;
    };
    return Trie;
}());
exports.Trie = Trie;
//# sourceMappingURL=trie.js.map