// eslint-disable-next-line import/no-extraneous-dependencies
import Database from "better-sqlite3";
export class SQLiteRecordManager {
    constructor(namespace, config) {
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "recordmanagers", "sqlite"]
        });
        Object.defineProperty(this, "tableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { localPath, connectionString, tableName } = config;
        if (!connectionString && !localPath) {
            throw new Error("One of either `localPath` or `connectionString` is required.");
        }
        if (connectionString && localPath) {
            throw new Error("Only one of either `localPath` or `connectionString` is allowed.");
        }
        this.namespace = namespace;
        this.tableName = tableName;
        this.db = new Database(connectionString ?? localPath);
    }
    async createSchema() {
        try {
            this.db.exec(`
CREATE TABLE IF NOT EXISTS "${this.tableName}" (
  uuid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT NOT NULL,
  namespace TEXT NOT NULL,
  updated_at REAL NOT NULL,
  group_id TEXT,
  UNIQUE (key, namespace)
);
CREATE INDEX IF NOT EXISTS updated_at_index ON "${this.tableName}" (updated_at);
CREATE INDEX IF NOT EXISTS key_index ON "${this.tableName}" (key);
CREATE INDEX IF NOT EXISTS namespace_index ON "${this.tableName}" (namespace);
CREATE INDEX IF NOT EXISTS group_id_index ON "${this.tableName}" (group_id);`);
        }
        catch (error) {
            console.error("Error creating schema");
            throw error; // Re-throw the error to let the caller handle it
        }
    }
    async getTime() {
        try {
            const statement = this.db.prepare("SELECT strftime('%s', 'now') AS epoch");
            const { epoch } = statement.get();
            return Number(epoch);
        }
        catch (error) {
            console.error("Error getting time in SQLiteRecordManager:");
            throw error;
        }
    }
    async update(keys, updateOptions) {
        if (keys.length === 0) {
            return;
        }
        const updatedAt = await this.getTime();
        const { timeAtLeast, groupIds: _groupIds } = updateOptions ?? {};
        if (timeAtLeast && updatedAt < timeAtLeast) {
            throw new Error(`Time sync issue with database ${updatedAt} < ${timeAtLeast}`);
        }
        const groupIds = _groupIds ?? keys.map(() => null);
        if (groupIds.length !== keys.length) {
            throw new Error(`Number of keys (${keys.length}) does not match number of group_ids (${groupIds.length})`);
        }
        const recordsToUpsert = keys.map((key, i) => [
            key,
            this.namespace,
            updatedAt,
            groupIds[i] ?? null, // Ensure groupIds[i] is null if undefined
        ]);
        // Consider using a transaction for batch operations
        const updateTransaction = this.db.transaction(() => {
            for (const row of recordsToUpsert) {
                this.db
                    .prepare(`
INSERT INTO "${this.tableName}" (key, namespace, updated_at, group_id)
VALUES (?, ?, ?, ?)
ON CONFLICT (key, namespace) DO UPDATE SET updated_at = excluded.updated_at`)
                    .run(...row);
            }
        });
        updateTransaction();
    }
    async exists(keys) {
        if (keys.length === 0) {
            return [];
        }
        // Prepare the placeholders and the query
        const placeholders = keys.map(() => `?`).join(", ");
        const sql = `
SELECT key
FROM "${this.tableName}"
WHERE namespace = ? AND key IN (${placeholders})`;
        // Initialize an array to fill with the existence checks
        const existsArray = new Array(keys.length).fill(false);
        try {
            // Execute the query
            const rows = this.db
                .prepare(sql)
                .all(this.namespace, ...keys);
            // Create a set of existing keys for faster lookup
            const existingKeysSet = new Set(rows.map((row) => row.key));
            // Map the input keys to booleans indicating if they exist
            keys.forEach((key, index) => {
                existsArray[index] = existingKeysSet.has(key);
            });
            return existsArray;
        }
        catch (error) {
            console.error("Error checking existence of keys");
            throw error; // Allow the caller to handle the error
        }
    }
    async listKeys(options) {
        const { before, after, limit, groupIds } = options ?? {};
        let query = `SELECT key FROM "${this.tableName}" WHERE namespace = ?`;
        const values = [this.namespace];
        if (before) {
            query += ` AND updated_at < ?`;
            values.push(before);
        }
        if (after) {
            query += ` AND updated_at > ?`;
            values.push(after);
        }
        if (limit) {
            query += ` LIMIT ?`;
            values.push(limit);
        }
        if (groupIds && Array.isArray(groupIds)) {
            query += ` AND group_id IN (${groupIds
                .filter((gid) => gid !== null)
                .map(() => "?")
                .join(", ")})`;
            values.push(...groupIds.filter((gid) => gid !== null));
        }
        query += ";";
        // Directly using try/catch with async/await for cleaner flow
        try {
            const result = this.db.prepare(query).all(...values);
            return result.map((row) => row.key);
        }
        catch (error) {
            console.error("Error listing keys.");
            throw error; // Re-throw the error to be handled by the caller
        }
    }
    async deleteKeys(keys) {
        if (keys.length === 0) {
            return;
        }
        const placeholders = keys.map(() => "?").join(", ");
        const query = `DELETE FROM "${this.tableName}" WHERE namespace = ? AND key IN (${placeholders});`;
        const values = [this.namespace, ...keys].map((v) => typeof v !== "string" ? `${v}` : v);
        // Directly using try/catch with async/await for cleaner flow
        try {
            this.db.prepare(query).run(...values);
        }
        catch (error) {
            console.error("Error deleting keys");
            throw error; // Re-throw the error to be handled by the caller
        }
    }
}
