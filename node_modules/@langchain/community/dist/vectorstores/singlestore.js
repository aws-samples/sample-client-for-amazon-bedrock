import { format } from "mysql2";
import { createPool } from "mysql2/promise";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
const OrderingDirective = {
    DOT_PRODUCT: "DESC",
    EUCLIDEAN_DISTANCE: "",
};
function withConnectAttributes(config) {
    let newOptions = {};
    if (config.connectionURI) {
        newOptions = {
            uri: config.connectionURI,
        };
    }
    else if (config.connectionOptions) {
        newOptions = {
            ...config.connectionOptions,
        };
    }
    const result = {
        ...newOptions,
        connectAttributes: {
            ...newOptions.connectAttributes,
        },
    };
    if (!result.connectAttributes) {
        result.connectAttributes = {};
    }
    result.connectAttributes = {
        ...result.connectAttributes,
        _connector_name: "langchain js sdk",
        _connector_version: "1.0.0",
        _driver_name: "Node-MySQL-2",
    };
    return result;
}
/**
 * Class for interacting with SingleStoreDB, a high-performance
 * distributed SQL database. It provides vector storage and vector
 * functions.
 */
export class SingleStoreVectorStore extends VectorStore {
    _vectorstoreType() {
        return "singlestore";
    }
    constructor(embeddings, config) {
        super(embeddings, config);
        Object.defineProperty(this, "connectionPool", {
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
        Object.defineProperty(this, "contentColumnName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "vectorColumnName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metadataColumnName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "distanceMetric", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.connectionPool = createPool(withConnectAttributes(config));
        this.tableName = config.tableName ?? "embeddings";
        this.contentColumnName = config.contentColumnName ?? "content";
        this.vectorColumnName = config.vectorColumnName ?? "vector";
        this.metadataColumnName = config.metadataColumnName ?? "metadata";
        this.distanceMetric = config.distanceMetric ?? "DOT_PRODUCT";
    }
    /**
     * Creates a new table in the SingleStoreDB database if it does not
     * already exist.
     */
    async createTableIfNotExists() {
        await this.connectionPool
            .execute(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
      ${this.contentColumnName} TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
      ${this.vectorColumnName} BLOB,
      ${this.metadataColumnName} JSON);`);
    }
    /**
     * Ends the connection to the SingleStoreDB database.
     */
    async end() {
        return this.connectionPool.end();
    }
    /**
     * Adds new documents to the SingleStoreDB database.
     * @param documents An array of Document objects.
     */
    async addDocuments(documents) {
        const texts = documents.map(({ pageContent }) => pageContent);
        const vectors = await this.embeddings.embedDocuments(texts);
        return this.addVectors(vectors, documents);
    }
    /**
     * Adds new vectors to the SingleStoreDB database.
     * @param vectors An array of vectors.
     * @param documents An array of Document objects.
     */
    async addVectors(vectors, documents) {
        await this.createTableIfNotExists();
        const { tableName } = this;
        await Promise.all(vectors.map(async (vector, idx) => {
            try {
                await this.connectionPool.execute(format(`INSERT INTO ${tableName} VALUES (?, JSON_ARRAY_PACK('[?]'), ?);`, [
                    documents[idx].pageContent,
                    vector,
                    JSON.stringify(documents[idx].metadata),
                ]));
            }
            catch (error) {
                console.error(`Error adding vector at index ${idx}:`, error);
            }
        }));
    }
    /**
     * Performs a similarity search on the vectors stored in the SingleStoreDB
     * database.
     * @param query An array of numbers representing the query vector.
     * @param k The number of nearest neighbors to return.
     * @param filter Optional metadata to filter the vectors by.
     * @returns Top matching vectors with score
     */
    async similaritySearchVectorWithScore(query, k, filter) {
        // build the where clause from filter
        const whereArgs = [];
        const buildWhereClause = (record, argList) => {
            const whereTokens = [];
            for (const key in record)
                if (record[key] !== undefined) {
                    if (typeof record[key] === "object" &&
                        record[key] != null &&
                        !Array.isArray(record[key])) {
                        whereTokens.push(buildWhereClause(record[key], argList.concat([key])));
                    }
                    else {
                        whereTokens.push(`JSON_EXTRACT_JSON(${this.metadataColumnName}, `.concat(Array.from({ length: argList.length + 1 }, () => "?").join(", "), ") = ?"));
                        whereArgs.push(...argList, key, JSON.stringify(record[key]));
                    }
                }
            return whereTokens.join(" AND ");
        };
        const whereClause = filter
            ? "WHERE ".concat(buildWhereClause(filter, []))
            : "";
        const [rows] = await this.connectionPool.query(format(`SELECT ${this.contentColumnName},
      ${this.metadataColumnName},
      ${this.distanceMetric}(${this.vectorColumnName}, JSON_ARRAY_PACK('[?]')) as __score FROM ${this.tableName} ${whereClause}
      ORDER BY __score ${OrderingDirective[this.distanceMetric]} LIMIT ?;`, [query, ...whereArgs, k]));
        const result = [];
        for (const row of rows) {
            const rowData = row;
            result.push([
                new Document({
                    pageContent: rowData[this.contentColumnName],
                    metadata: rowData[this.metadataColumnName],
                }),
                Number(rowData.score),
            ]);
        }
        return result;
    }
    /**
     * Creates a new instance of the SingleStoreVectorStore class from a list
     * of texts.
     * @param texts An array of strings.
     * @param metadatas An array of metadata objects.
     * @param embeddings An Embeddings object.
     * @param dbConfig A SingleStoreVectorStoreConfig object.
     * @returns A new SingleStoreVectorStore instance
     */
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = texts.map((text, idx) => {
            const metadata = Array.isArray(metadatas) ? metadatas[idx] : metadatas;
            return new Document({
                pageContent: text,
                metadata,
            });
        });
        return SingleStoreVectorStore.fromDocuments(docs, embeddings, dbConfig);
    }
    /**
     * Creates a new instance of the SingleStoreVectorStore class from a list
     * of Document objects.
     * @param docs An array of Document objects.
     * @param embeddings An Embeddings object.
     * @param dbConfig A SingleStoreVectorStoreConfig object.
     * @returns A new SingleStoreVectorStore instance
     */
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new this(embeddings, dbConfig);
        await instance.addDocuments(docs);
        return instance;
    }
}
