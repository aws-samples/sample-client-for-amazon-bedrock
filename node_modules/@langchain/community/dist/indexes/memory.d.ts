import { ListKeyOptions, RecordManager, UpdateOptions } from "./base.js";
interface MemoryRecord {
    updatedAt: number;
    groupId: string | null;
}
export declare class InMemoryRecordManager extends RecordManager {
    lc_namespace: string[];
    records: Map<string, MemoryRecord>;
    constructor();
    createSchema(): Promise<void>;
    getTime(): Promise<number>;
    update(keys: string[], updateOptions?: UpdateOptions): Promise<void>;
    exists(keys: string[]): Promise<boolean[]>;
    listKeys(options?: ListKeyOptions): Promise<string[]>;
    deleteKeys(keys: string[]): Promise<void>;
}
export {};
