import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
declare const IdColumnSymbol: unique symbol;
declare const ContentColumnSymbol: unique symbol;
type ColumnSymbol = typeof IdColumnSymbol | typeof ContentColumnSymbol;
declare type Value = unknown;
declare type RawValue = Value | Sql;
declare class Sql {
    strings: string[];
    constructor(rawStrings: ReadonlyArray<string>, rawValues: ReadonlyArray<RawValue>);
}
type PrismaNamespace = {
    ModelName: Record<string, string>;
    Sql: typeof Sql;
    raw: (sql: string) => Sql;
    join: (values: RawValue[], separator?: string, prefix?: string, suffix?: string) => Sql;
    sql: (strings: ReadonlyArray<string>, ...values: RawValue[]) => Sql;
};
type PrismaClient = {
    $queryRaw<T = unknown>(query: TemplateStringsArray | Sql, ...values: any[]): Promise<T>;
    $executeRaw(query: TemplateStringsArray | Sql, ...values: any[]): Promise<any>;
    $transaction<P extends Promise<any>[]>(arg: [...P]): Promise<any>;
};
type ObjectIntersect<A, B> = {
    [P in keyof A & keyof B]: A[P] | B[P];
};
type ModelColumns<TModel extends Record<string, unknown>> = {
    [K in keyof TModel]?: true | ColumnSymbol;
};
export type PrismaSqlFilter<TModel extends Record<string, unknown>> = {
    [K in keyof TModel]?: {
        equals?: TModel[K];
        in?: TModel[K][];
        isNull?: TModel[K];
        isNotNull?: TModel[K];
        like?: TModel[K];
        lt?: TModel[K];
        lte?: TModel[K];
        gt?: TModel[K];
        gte?: TModel[K];
        not?: TModel[K];
    };
};
type SimilarityModel<TModel extends Record<string, unknown> = Record<string, unknown>, TColumns extends ModelColumns<TModel> = ModelColumns<TModel>> = Pick<TModel, keyof ObjectIntersect<TModel, TColumns>> & {
    _distance: number | null;
};
type DefaultPrismaVectorStore = PrismaVectorStore<Record<string, unknown>, string, ModelColumns<Record<string, unknown>>, PrismaSqlFilter<Record<string, unknown>>>;
/**
 * A specific implementation of the VectorStore class that is designed to
 * work with Prisma. It provides methods for adding models, documents, and
 * vectors, as well as for performing similarity searches.
 */
export declare class PrismaVectorStore<TModel extends Record<string, unknown>, TModelName extends string, TSelectModel extends ModelColumns<TModel>, TFilterModel extends PrismaSqlFilter<TModel>> extends VectorStore {
    FilterType: TFilterModel;
    protected tableName: string;
    protected vectorColumnName: string;
    protected selectColumns: string[];
    filter?: TFilterModel;
    idColumn: keyof TModel & string;
    contentColumn: keyof TModel & string;
    static IdColumn: typeof IdColumnSymbol;
    static ContentColumn: typeof ContentColumnSymbol;
    protected db: PrismaClient;
    protected Prisma: PrismaNamespace;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, config: {
        db: PrismaClient;
        prisma: PrismaNamespace;
        tableName: TModelName;
        vectorColumnName: string;
        columns: TSelectModel;
        filter?: TFilterModel;
    });
    /**
     * Creates a new PrismaVectorStore with the specified model.
     * @param db The PrismaClient instance.
     * @returns An object with create, fromTexts, and fromDocuments methods.
     */
    static withModel<TModel extends Record<string, unknown>>(db: PrismaClient): {
        create: <TPrisma extends PrismaNamespace, TColumns extends ModelColumns<TModel>, TFilters extends PrismaSqlFilter<TModel>>(embeddings: EmbeddingsInterface, config: {
            prisma: TPrisma;
            tableName: keyof TPrisma["ModelName"] & string;
            vectorColumnName: string;
            columns: TColumns;
            filter?: TFilters | undefined;
        }) => PrismaVectorStore<TModel, keyof TPrisma["ModelName"] & string, TColumns, TFilters>;
        fromTexts: <TPrisma_1 extends PrismaNamespace, TColumns_1 extends ModelColumns<TModel>>(texts: string[], metadatas: TModel[], embeddings: EmbeddingsInterface, dbConfig: {
            prisma: TPrisma_1;
            tableName: keyof TPrisma_1["ModelName"] & string;
            vectorColumnName: string;
            columns: TColumns_1;
        }) => Promise<DefaultPrismaVectorStore>;
        fromDocuments: <TPrisma_2 extends PrismaNamespace, TColumns_2 extends ModelColumns<TModel>, TFilters_1 extends PrismaSqlFilter<TModel>>(docs: Document<TModel>[], embeddings: EmbeddingsInterface, dbConfig: {
            prisma: TPrisma_2;
            tableName: keyof TPrisma_2["ModelName"] & string;
            vectorColumnName: string;
            columns: TColumns_2;
        }) => Promise<PrismaVectorStore<TModel, keyof TPrisma_2["ModelName"] & string, TColumns_2, TFilters_1>>;
    };
    /**
     * Adds the specified models to the store.
     * @param models The models to add.
     * @returns A promise that resolves when the models have been added.
     */
    addModels(models: TModel[]): Promise<void>;
    /**
     * Adds the specified documents to the store.
     * @param documents The documents to add.
     * @returns A promise that resolves when the documents have been added.
     */
    addDocuments(documents: Document<TModel>[]): Promise<void>;
    /**
     * Adds the specified vectors to the store.
     * @param vectors The vectors to add.
     * @param documents The documents associated with the vectors.
     * @returns A promise that resolves when the vectors have been added.
     */
    addVectors(vectors: number[][], documents: Document<TModel>[]): Promise<void>;
    /**
     * Performs a similarity search with the specified query.
     * @param query The query to use for the similarity search.
     * @param k The number of results to return.
     * @param _filter The filter to apply to the results.
     * @param _callbacks The callbacks to use during the search.
     * @returns A promise that resolves with the search results.
     */
    similaritySearch(query: string, k?: number, filter?: this["FilterType"] | undefined): Promise<Document<SimilarityModel<TModel, TSelectModel>>[]>;
    /**
     * Performs a similarity search with the specified query and returns the
     * results along with their scores.
     * @param query The query to use for the similarity search.
     * @param k The number of results to return.
     * @param filter The filter to apply to the results.
     * @param _callbacks The callbacks to use during the search.
     * @returns A promise that resolves with the search results and their scores.
     */
    similaritySearchWithScore(query: string, k?: number, filter?: this["FilterType"]): Promise<[import("@langchain/core/documents").DocumentInterface<Record<string, any>>, number][]>;
    /**
     * Performs a similarity search with the specified vector and returns the
     * results along with their scores.
     * @param query The vector to use for the similarity search.
     * @param k The number of results to return.
     * @param filter The filter to apply to the results.
     * @returns A promise that resolves with the search results and their scores.
     */
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[Document<SimilarityModel<TModel, TSelectModel>>, number][]>;
    buildSqlFilterStr(filter?: this["FilterType"]): Sql | null;
    /**
     * Creates a new PrismaVectorStore from the specified texts.
     * @param texts The texts to use to create the store.
     * @param metadatas The metadata for the texts.
     * @param embeddings The embeddings to use.
     * @param dbConfig The database configuration.
     * @returns A promise that resolves with the new PrismaVectorStore.
     */
    static fromTexts(texts: string[], metadatas: object[], embeddings: EmbeddingsInterface, dbConfig: {
        db: PrismaClient;
        prisma: PrismaNamespace;
        tableName: string;
        vectorColumnName: string;
        columns: ModelColumns<Record<string, unknown>>;
    }): Promise<DefaultPrismaVectorStore>;
    /**
     * Creates a new PrismaVectorStore from the specified documents.
     * @param docs The documents to use to create the store.
     * @param embeddings The embeddings to use.
     * @param dbConfig The database configuration.
     * @returns A promise that resolves with the new PrismaVectorStore.
     */
    static fromDocuments(docs: Document[], embeddings: EmbeddingsInterface, dbConfig: {
        db: PrismaClient;
        prisma: PrismaNamespace;
        tableName: string;
        vectorColumnName: string;
        columns: ModelColumns<Record<string, unknown>>;
    }): Promise<DefaultPrismaVectorStore>;
}
export {};
