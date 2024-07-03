"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttributes = exports.getBaseAttributes = exports.getRoleAttributes = exports.isStructTreeNodeWithOnlyContentChild = exports.isStructTreeNode = exports.isPdfRole = void 0;
const constants_js_1 = require("./constants.js");
function isPdfRole(role) {
    return role in constants_js_1.PDF_ROLE_TO_HTML_ROLE;
}
exports.isPdfRole = isPdfRole;
function isStructTreeNode(node) {
    return 'children' in node;
}
exports.isStructTreeNode = isStructTreeNode;
function isStructTreeNodeWithOnlyContentChild(node) {
    if (!isStructTreeNode(node)) {
        return false;
    }
    return node.children.length === 1 && 0 in node.children && 'id' in node.children[0];
}
exports.isStructTreeNodeWithOnlyContentChild = isStructTreeNodeWithOnlyContentChild;
function getRoleAttributes(node) {
    const attributes = {};
    if (isStructTreeNode(node)) {
        const { role } = node;
        const matches = role.match(constants_js_1.HEADING_PATTERN);
        if (matches) {
            attributes.role = 'heading';
            attributes['aria-level'] = Number(matches[1]);
        }
        else if (isPdfRole(role)) {
            const htmlRole = constants_js_1.PDF_ROLE_TO_HTML_ROLE[role];
            if (htmlRole) {
                attributes.role = htmlRole;
            }
        }
    }
    return attributes;
}
exports.getRoleAttributes = getRoleAttributes;
function getBaseAttributes(node) {
    const attributes = {};
    if (isStructTreeNode(node)) {
        if (node.alt !== undefined) {
            attributes['aria-label'] = node.alt;
        }
        if (node.lang !== undefined) {
            attributes.lang = node.lang;
        }
        if (isStructTreeNodeWithOnlyContentChild(node)) {
            const [child] = node.children;
            if (child) {
                const childAttributes = getBaseAttributes(child);
                return Object.assign(Object.assign({}, attributes), childAttributes);
            }
        }
    }
    else {
        if ('id' in node) {
            attributes['aria-owns'] = node.id;
        }
    }
    return attributes;
}
exports.getBaseAttributes = getBaseAttributes;
function getAttributes(node) {
    if (!node) {
        return null;
    }
    return Object.assign(Object.assign({}, getRoleAttributes(node)), getBaseAttributes(node));
}
exports.getAttributes = getAttributes;
