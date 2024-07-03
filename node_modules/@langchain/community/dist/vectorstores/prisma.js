import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
const IdColumnSymbol = Symbol("id");
const ContentColumnSymbol = Symbol("content");
const OpMap = {
    equals: "=",
    in: "IN",
    isNull: "IS NULL",
    isNotNull: "IS NOT NULL",
    like: "LIKE",
    lt: "<",
    lte: "<=",
    gt: ">",
    gte: ">=",
    not: "<>",
};
/**
 * A specific implementation of the VectorStore class that is designed to
 * work with Prisma. It provides methods for adding models, documents, and
 * vectors, as well as for performing similarity searches.
 */
export class PrismaVectorStore extends VectorStore {
    _vectorstoreType() {
        return "prisma";
    }
    constructor(embeddings, config) {
        super(embeddings, {});
        Object.defineProperty(this, "tableName", {
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
        Object.defineProperty(this, "selectColumns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "idColumn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "contentColumn", {
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
        Object.defineProperty(this, "Prisma", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.Prisma = config.prisma;
        this.db = config.db;
        const entries = Object.entries(config.columns);
        const idColumn = entries.find((i) => i[1] === IdColumnSymbol)?.[0];
        const contentColumn = entries.find((i) => i[1] === ContentColumnSymbol)?.[0];
        if (idColumn == null)
            throw new Error("Missing ID column");
        if (contentColumn == null)
            throw new Error("Missing content column");
        this.idColumn = idColumn;
        this.contentColumn = contentColumn;
        this.tableName = config.tableName;
        this.vectorColumnName = config.vectorColumnName;
        this.selectColumns = entries
            .map(([key, alias]) => (alias && key) || null)
            .filter((x) => !!x);
        if (config.filter) {
            this.filter = config.filter;
        }
    }
    /**
     * Creates a new PrismaVectorStore with the specified model.
     * @param db The PrismaClient instance.
     * @returns An object with create, fromTexts, and fromDocuments methods.
     */
    static withModel(db) {
        function create(embeddings, config) {
            return new PrismaVectorStore(embeddings, { ...config, db });
        }
        async function fromTexts(texts, metadatas, embeddings, dbConfig) {
            const docs = [];
            for (let i = 0; i < texts.length; i += 1) {
                const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
                const newDoc = new Document({
                    pageContent: texts[i],
                    metadata,
                });
                docs.push(newDoc);
            }
            return PrismaVectorStore.fromDocuments(docs, embeddings, {
                ...dbConfig,
                db,
            });
        }
        async function fromDocuments(docs, embeddings, dbConfig) {
            const instance = new PrismaVectorStore(embeddings, { ...dbConfig, db });
            await instance.addDocuments(docs);
            return instance;
        }
        return { create, fromTexts, fromDocuments };
    }
    /**
     * Adds the specified models to the store.
     * @param models The models to add.
     * @returns A promise that resolves when the models have been added.
     */
    async addModels(models) {
        return this.addDocuments(models.map((metadata) => {
            const pageContent = metadata[this.contentColumn];
            if (typeof pageContent !== "string")
                throw new Error("Content column must be a string");
            return new Document({ pageContent, metadata });
        }));
    }
    /**
     * Adds the specified documents to the store.
     * @param documents The documents to add.
     * @returns A promise that resolves when the documents have been added.
     */
    async addDocuments(documents) {
        const texts = documents.map(({ pageContent }) => pageContent);
        return this.addVectors(await this.embeddings.embedDocuments(texts), documents);
    }
    /**
     * Adds the specified vectors to the store.
     * @param vectors The vectors to add.
     * @param documents The documents associated with the vectors.
     * @returns A promise that resolves when the vectors have been added.
     */
    async addVectors(vectors, documents) {
        // table name, column name cannot be parametrised
        // these fields are thus not escaped by Prisma and can be dangerous if user input is used
        const idColumnRaw = this.Prisma.raw(`"${this.idColumn}"`);
        const tableNameRaw = this.Prisma.raw(`"${this.tableName}"`);
        const vectorColumnRaw = this.Prisma.raw(`"${this.vectorColumnName}"`);
        await this.db.$transaction(vectors.map((vector, idx) => this.db.$executeRaw `
          UPDATE ${tableNameRaw}
          SET ${vectorColumnRaw} = ${`[${vector.join(",")}]`}::vector
          WHERE ${idColumnRaw} = ${documents[idx].metadata[this.idColumn]}
        `));
    }
    /**
     * Performs a similarity search with the specified query.
     * @param query The query to use for the similarity search.
     * @param k The number of results to return.
     * @param _filter The filter to apply to the results.
     * @param _callbacks The callbacks to use during the search.
     * @returns A promise that resolves with the search results.
     */
    async similaritySearch(query, k = 4, filter = undefined) {
        const results = await this.similaritySearchVectorWithScore(await this.embeddings.embedQuery(query), k, filter);
        return results.map((result) => result[0]);
    }
    /**
     * Performs a similarity search with the specified query and returns the
     * results along with their scores.
     * @param query The query to use for the similarity search.
     * @param k The number of results to return.
     * @param filter The filter to apply to the results.
     * @param _callbacks The callbacks to use during the search.
     * @returns A promise that resolves with the search results and their scores.
     */
    async similaritySearchWithScore(query, k, filter) {
        return super.similaritySearchWithScore(query, k, filter);
    }
    /**
     * Performs a similarity search with the specified vector and returns the
     * results along with their scores.
     * @param query The vector to use for the similarity search.
     * @param k The number of results to return.
     * @param filter The filter to apply to the results.
     * @returns A promise that resolves with the search results and their scores.
     */
    async similaritySearchVectorWithScore(query, k, filter) {
        // table name, column names cannot be parametrised
        // these fields are thus not escaped by Prisma and can be dangerous if user input is used
        const vectorColumnRaw = this.Prisma.raw(`"${this.vectorColumnName}"`);
        const tableNameRaw = this.Prisma.raw(`"${this.tableName}"`);
        const selectRaw = this.Prisma.raw(this.selectColumns.map((x) => `"${x}"`).join(", "));
        const vector = `[${query.join(",")}]`;
        const articles = await this.db.$queryRaw(this.Prisma.join([
            this.Prisma.sql `
            SELECT ${selectRaw}, ${vectorColumnRaw} <=> ${vector}::vector as "_distance"
            FROM ${tableNameRaw}
          `,
            this.buildSqlFilterStr(filter ?? this.filter),
            this.Prisma.sql `
            ORDER BY "_distance" ASC
            LIMIT ${k};
          `,
        ].filter((x) => x != null), ""));
        const results = [];
        for (const article of articles) {
            if (article._distance != null && article[this.contentColumn] != null) {
                results.push([
                    new Document({
                        pageContent: article[this.contentColumn],
                        metadata: article,
                    }),
                    article._distance,
                ]);
            }
        }
        return results;
    }
    buildSqlFilterStr(filter) {
        if (filter == null)
            return null;
        return this.Prisma.join(Object.entries(filter).flatMap(([key, ops]) => Object.entries(ops).map(([opName, value]) => {
            // column name, operators cannot be parametrised
            // these fields are thus not escaped by Prisma and can be dangerous if user input is used
            const opNameKey = opName;
            const colRaw = this.Prisma.raw(`"${key}"`);
            const opRaw = this.Prisma.raw(OpMap[opNameKey]);
            switch (OpMap[opNameKey]) {
                case OpMap.in: {
                    if (!Array.isArray(value) ||
                        !value.every((v) => typeof v === "string")) {
                        throw new Error(`Invalid filter: IN operator requires an array of strings. Received: ${JSON.stringify(value, null, 2)}`);
                    }
                    return this.Prisma.sql `${colRaw} ${opRaw} (${this.Prisma.join(value)})`;
                }
                case OpMap.isNull:
                case OpMap.isNotNull:
                    return this.Prisma.sql `${colRaw} ${opRaw}`;
                default:
                    return this.Prisma.sql `${colRaw} ${opRaw} ${value}`;
            }
        })), " AND ", " WHERE ");
    }
    /**
     * Creates a new PrismaVectorStore from the specified texts.
     * @param texts The texts to use to create the store.
     * @param metadatas The metadata for the texts.
     * @param embeddings The embeddings to use.
     * @param dbConfig The database configuration.
     * @returns A promise that resolves with the new PrismaVectorStore.
     */
    static async fromTexts(texts, metadatas, embeddings, dbConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(newDoc);
        }
        return PrismaVectorStore.fromDocuments(docs, embeddings, dbConfig);
    }
    /**
     * Creates a new PrismaVectorStore from the specified documents.
     * @param docs The documents to use to create the store.
     * @param embeddings The embeddings to use.
     * @param dbConfig The database configuration.
     * @returns A promise that resolves with the new PrismaVectorStore.
     */
    static async fromDocuments(docs, embeddings, dbConfig) {
        const instance = new PrismaVectorStore(embeddings, dbConfig);
        await instance.addDocuments(docs);
        return instance;
    }
}
Object.defineProperty(PrismaVectorStore, "IdColumn", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: IdColumnSymbol
});
Object.defineProperty(PrismaVectorStore, "ContentColumn", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: ContentColumnSymbol
});
