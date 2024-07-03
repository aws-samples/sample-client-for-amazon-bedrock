import { Database as DatabaseType } from "better-sqlite3";
import { ListKeyOptions, RecordManagerInterface, UpdateOptions } from "./base.js";
/**
 * Options for configuring the SQLiteRecordManager class.
 */
export type SQLiteRecordManagerOptions = {
    /**
     * The file path of the SQLite database.
     * One of either `localPath` or `connectionString` is required.
     */
    localPath?: string;
    /**
     * The connection string of the SQLite database.
     * One of either `localPath` or `connectionString` is required.
     */
    connectionString?: string;
    /**
     * The name of the table in the SQLite database.
     */
    tableName: string;
};
export declare class SQLiteRecordManager implements RecordManagerInterface {
    lc_namespace: string[];
    tableName: string;
    db: DatabaseType;
    namespace: string;
    constructor(namespace: string, config: SQLiteRecordManagerOptions);
    createSchema(): Promise<void>;
    getTime(): Promise<number>;
    update(keys: string[], updateOptions?: UpdateOptions): Promise<void>;
    exists(keys: string[]): Promise<boolean[]>;
    listKeys(options?: ListKeyOptions): Promise<string[]>;
    deleteKeys(keys: string[]): Promise<void>;
}
