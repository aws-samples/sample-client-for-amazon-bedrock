import { BasePromptTemplate, PromptTemplate } from "@langchain/core/prompts";
export declare const DEFAULT_SQL_DATABASE_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_POSTGRES_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_SQLITE_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_MYSQL_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_MSSQL_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_SAP_HANA_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export declare const SQL_ORACLE_PROMPT: PromptTemplate<{
    input: any;
    top_k: any;
    dialect: any;
    table_info: any;
}, any>;
export type SqlDialect = "oracle" | "postgres" | "sqlite" | "mysql" | "mssql" | "sap hana";
export declare const SQL_PROMPTS_MAP: Record<SqlDialect, BasePromptTemplate>;
