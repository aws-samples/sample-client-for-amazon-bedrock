"use strict";
/* eslint-disable spaced-comment */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMany = exports.upsert = exports.lookup = exports.insert = exports.get = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const server_1 = require("convex/server");
// eslint-disable-next-line import/no-extraneous-dependencies
const values_1 = require("convex/values");
exports.get = (0, server_1.internalQueryGeneric)({
    args: {
        id: /*#__PURE__*/ values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.get(args.id);
        return result;
    },
});
exports.insert = (0, server_1.internalMutationGeneric)({
    args: {
        table: /*#__PURE__*/ values_1.v.string(),
        document: /*#__PURE__*/ values_1.v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert(args.table, args.document);
    },
});
exports.lookup = (0, server_1.internalQueryGeneric)({
    args: {
        table: /*#__PURE__*/ values_1.v.string(),
        index: /*#__PURE__*/ values_1.v.string(),
        keyField: /*#__PURE__*/ values_1.v.string(),
        key: /*#__PURE__*/ values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const result = await ctx.db
            .query(args.table)
            .withIndex(args.index, (q) => q.eq(args.keyField, args.key))
            .collect();
        return result;
    },
});
exports.upsert = (0, server_1.internalMutationGeneric)({
    args: {
        table: /*#__PURE__*/ values_1.v.string(),
        index: /*#__PURE__*/ values_1.v.string(),
        keyField: /*#__PURE__*/ values_1.v.string(),
        key: /*#__PURE__*/ values_1.v.string(),
        document: /*#__PURE__*/ values_1.v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query(args.table)
            .withIndex(args.index, (q) => q.eq(args.keyField, args.key))
            .unique();
        if (existing !== null) {
            await ctx.db.replace(existing._id, args.document);
        }
        else {
            await ctx.db.insert(args.table, args.document);
        }
    },
});
exports.deleteMany = (0, server_1.internalMutationGeneric)({
    args: {
        table: /*#__PURE__*/ values_1.v.string(),
        index: /*#__PURE__*/ values_1.v.string(),
        keyField: /*#__PURE__*/ values_1.v.string(),
        key: /*#__PURE__*/ values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query(args.table)
            .withIndex(args.index, (q) => q.eq(args.keyField, args.key))
            .collect();
        await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    },
});
