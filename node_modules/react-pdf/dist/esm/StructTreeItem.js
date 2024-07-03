import React, { useMemo } from 'react';
import { getAttributes, isStructTreeNode, isStructTreeNodeWithOnlyContentChild, } from './shared/structTreeUtils.js';
export default function StructTreeItem({ className, node }) {
    const attributes = useMemo(() => getAttributes(node), [node]);
    const children = useMemo(() => {
        if (!isStructTreeNode(node)) {
            return null;
        }
        if (isStructTreeNodeWithOnlyContentChild(node)) {
            return null;
        }
        return node.children.map((child, index) => {
            return (
            // eslint-disable-next-line react/no-array-index-key
            React.createElement(StructTreeItem, { key: index, node: child }));
        });
    }, [node]);
    return (React.createElement("span", Object.assign({ className: className }, attributes), children));
}
