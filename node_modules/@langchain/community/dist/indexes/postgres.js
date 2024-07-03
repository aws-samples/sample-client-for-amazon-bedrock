import pg from "pg";
export class PostgresRecordManager {
    constructor(namespace, config) {
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "recordmanagers", "postgres"]
        });
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableName", {
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
        Object.defineProperty(this, "finalTableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { postgresConnectionOptions, tableName } = config;
        this.namespace = namespace;
        this.pool = new pg.Pool(postgresConnectionOptions);
        this.tableName = tableName || "upsertion_records";
        this.finalTableName = config.schema
            ? `"${config.schema}"."${tableName}"`
            : `"${tableName}"`;
    }
    async createSchema() {
        try {
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.finalTableName} (
          uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT NOT NULL,
          namespace TEXT NOT NULL,
          updated_at Double PRECISION NOT NULL,
          group_id TEXT,
          UNIQUE (key, namespace)
        );
        CREATE INDEX IF NOT EXISTS updated_at_index ON ${this.finalTableName} (updated_at);
        CREATE INDEX IF NOT EXISTS key_index ON ${this.finalTableName} (key);
        CREATE INDEX IF NOT EXISTS namespace_index ON ${this.finalTableName} (namespace);
        CREATE INDEX IF NOT EXISTS group_id_index ON ${this.finalTableName} (group_id);`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            // This error indicates that the table already exists
            // Due to asynchronous nature of the code, it is possible that
            // the table is created between the time we check if it exists
            // and the time we try to create it. It can be safely ignored.
            if ("code" in e && e.code === "23505") {
                return;
            }
            throw e;
        }
    }
    async getTime() {
        const res = await this.pool.query("SELECT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)");
        return Number.parseFloat(res.rows[0].extract);
    }
    /**
     * Generates the SQL placeholders for a specific row at the provided index.
     *
     * @param index - The index of the row for which placeholders need to be generated.
     * @param numOfColumns - The number of columns we are inserting data into.
     * @returns The SQL placeholders for the row values.
     */
    generatePlaceholderForRowAt(index, numOfColumns) {
        const placeholders = [];
        for (let i = 0; i < numOfColumns; i += 1) {
            placeholders.push(`$${index * numOfColumns + i + 1}`);
        }
        return `(${placeholders.join(", ")})`;
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
            throw new Error(`Number of keys (${keys.length}) does not match number of group_ids ${groupIds.length})`);
        }
        const recordsToUpsert = keys.map((key, i) => [
            key,
            this.namespace,
            updatedAt,
            groupIds[i],
        ]);
        const valuesPlaceholders = recordsToUpsert
            .map((_, j) => this.generatePlaceholderForRowAt(j, recordsToUpsert[0].length))
            .join(", ");
        const query = `INSERT INTO ${this.finalTableName} (key, namespace, updated_at, group_id) VALUES ${valuesPlaceholders} ON CONFLICT (key, namespace) DO UPDATE SET updated_at = EXCLUDED.updated_at;`;
        await this.pool.query(query, recordsToUpsert.flat());
    }
    async exists(keys) {
        if (keys.length === 0) {
            return [];
        }
        const startIndex = 2;
        const arrayPlaceholders = keys
            .map((_, i) => `$${i + startIndex}`)
            .join(", ");
        const query = `
      SELECT k, (key is not null) ex from unnest(ARRAY[${arrayPlaceholders}]) k left join ${this.finalTableName} on k=key and namespace = $1;
      `;
        const res = await this.pool.query(query, [this.namespace, ...keys.flat()]);
        return res.rows.map((row) => row.ex);
    }
    async listKeys(options) {
        const { before, after, limit, groupIds } = options ?? {};
        let query = `SELECT key FROM ${this.finalTableName} WHERE namespace = $1`;
        const values = [this.namespace];
        let index = 2;
        if (before) {
            values.push(before);
            query += ` AND updated_at < $${index}`;
            index += 1;
        }
        if (after) {
            values.push(after);
            query += ` AND updated_at > $${index}`;
            index += 1;
        }
        if (limit) {
            values.push(limit);
            query += ` LIMIT $${index}`;
            index += 1;
        }
        if (groupIds) {
            values.push(groupIds);
            query += ` AND group_id = ANY($${index})`;
            index += 1;
        }
        query += ";";
        const res = await this.pool.query(query, values);
        return res.rows.map((row) => row.key);
    }
    async deleteKeys(keys) {
        if (keys.length === 0) {
            return;
        }
        const query = `DELETE FROM ${this.finalTableName} WHERE namespace = $1 AND key = ANY($2);`;
        await this.pool.query(query, [this.namespace, keys]);
    }
    /**
     * Terminates the connection pool.
     * @returns {Promise<void>}
     */
    async end() {
        await this.pool.end();
    }
}
