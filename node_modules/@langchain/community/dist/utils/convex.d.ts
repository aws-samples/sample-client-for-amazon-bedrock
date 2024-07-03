export declare const get: import("convex/server").RegisteredQuery<"internal", {
    id: string;
}, Promise<any>>;
export declare const insert: import("convex/server").RegisteredMutation<"internal", {
    table: string;
    document: any;
}, Promise<void>>;
export declare const lookup: import("convex/server").RegisteredQuery<"internal", {
    table: string;
    key: string;
    index: string;
    keyField: string;
}, Promise<any[]>>;
export declare const upsert: import("convex/server").RegisteredMutation<"internal", {
    table: string;
    key: string;
    document: any;
    index: string;
    keyField: string;
}, Promise<void>>;
export declare const deleteMany: import("convex/server").RegisteredMutation<"internal", {
    table: string;
    key: string;
    index: string;
    keyField: string;
}, Promise<void>>;
