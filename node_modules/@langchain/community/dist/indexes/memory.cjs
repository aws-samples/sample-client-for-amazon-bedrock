"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRecordManager = void 0;
const base_js_1 = require("./base.cjs");
class InMemoryRecordManager extends base_js_1.RecordManager {
    constructor() {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "recordmanagers", "memory"]
        });
        Object.defineProperty(this, "records", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.records = new Map();
    }
    async createSchema() {
        // nothing to do here
        // compatibility with other record managers
        return Promise.resolve();
    }
    async getTime() {
        return Promise.resolve(Date.now());
    }
    async update(keys, updateOptions) {
        const updatedAt = await this.getTime();
        const { timeAtLeast, groupIds: _groupIds } = updateOptions ?? {};
        if (timeAtLeast && updatedAt < timeAtLeast) {
            throw new Error(`Time sync issue with database ${updatedAt} < ${timeAtLeast}`);
        }
        const groupIds = _groupIds ?? keys.map(() => null);
        if (groupIds.length !== keys.length) {
            throw new Error(`Number of keys (${keys.length}) does not match number of group_ids ${groupIds.length})`);
        }
        keys.forEach((key, i) => {
            const old = this.records.get(key);
            if (old) {
                old.updatedAt = updatedAt;
            }
            else {
                this.records.set(key, { updatedAt, groupId: groupIds[i] });
            }
        });
    }
    async exists(keys) {
        return Promise.resolve(keys.map((key) => this.records.has(key)));
    }
    async listKeys(options) {
        const { before, after, limit, groupIds } = options ?? {};
        const filteredRecords = Array.from(this.records).filter(([_key, doc]) => {
            // Inclusive bounds for before and after (i.e. <= and >=).
            // This is technically incorrect, but because there is no
            // latency, it is not garanteed that after an update the
            // timestamp on subsequent listKeys calls will be different.
            const isBefore = !before || doc.updatedAt <= before;
            const isAfter = !after || doc.updatedAt >= after;
            const belongsToGroup = !groupIds || groupIds.includes(doc.groupId);
            return isBefore && isAfter && belongsToGroup;
        });
        return Promise.resolve(filteredRecords
            .map(([key]) => key)
            .slice(0, limit ?? filteredRecords.length));
    }
    async deleteKeys(keys) {
        keys.forEach((key) => this.records.delete(key));
        return Promise.resolve();
    }
}
exports.InMemoryRecordManager = InMemoryRecordManager;
