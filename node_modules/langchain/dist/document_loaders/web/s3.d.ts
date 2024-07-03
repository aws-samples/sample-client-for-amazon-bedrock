/// <reference types="node" resolution-mode="require"/>
import * as fsDefault from "node:fs";
import { S3ClientConfig } from "@aws-sdk/client-s3";
import { BaseDocumentLoader } from "../base.js";
import { UnstructuredLoader as UnstructuredLoaderDefault } from "../fs/unstructured.js";
/**
 * Represents the configuration options for the S3 client. It extends the
 * S3ClientConfig interface from the "@aws-sdk/client-s3" package and
 * includes additional deprecated properties for access key ID and secret
 * access key.
 */
export type S3Config = S3ClientConfig & {
    /** @deprecated Use the credentials object instead */
    accessKeyId?: string;
    /** @deprecated Use the credentials object instead */
    secretAccessKey?: string;
};
/**
 * Represents the parameters for the S3Loader class. It includes
 * properties such as the S3 bucket, key, unstructured API URL,
 * unstructured API key, S3 configuration, file system module, and
 * UnstructuredLoader module.
 */
export interface S3LoaderParams {
    bucket: string;
    key: string;
    unstructuredAPIURL: string;
    unstructuredAPIKey: string;
    s3Config?: S3Config & {
        /** @deprecated Use the credentials object instead */
        accessKeyId?: string;
        /** @deprecated Use the credentials object instead */
        secretAccessKey?: string;
    };
    fs?: typeof fsDefault;
    UnstructuredLoader?: typeof UnstructuredLoaderDefault;
}
/**
 * A class that extends the BaseDocumentLoader class. It represents a
 * document loader for loading files from an S3 bucket.
 * @example
 * ```typescript
 * const loader = new S3Loader({
 *   bucket: "my-document-bucket-123",
 *   key: "AccountingOverview.pdf",
 *   s3Config: {
 *     region: "us-east-1",
 *     credentials: {
 *       accessKeyId: "<YourAccessKeyId>",
 *       secretAccessKey: "<YourSecretAccessKey>",
 *     },
 *   },
 *   unstructuredAPIURL: "<YourUnstructuredAPIURL>",
 *   unstructuredAPIKey: "<YourUnstructuredAPIKey>",
 * });
 * const docs = await loader.load();
 * ```
 */
export declare class S3Loader extends BaseDocumentLoader {
    private bucket;
    private key;
    private unstructuredAPIURL;
    private unstructuredAPIKey;
    private s3Config;
    private _fs;
    private _UnstructuredLoader;
    constructor({ bucket, key, unstructuredAPIURL, unstructuredAPIKey, s3Config, fs, UnstructuredLoader, }: S3LoaderParams);
    /**
     * Loads the file from the S3 bucket, saves it to a temporary directory,
     * and then uses the UnstructuredLoader to load the file as a document.
     * @returns An array of Document objects representing the loaded documents.
     */
    load(): Promise<import("@langchain/core/documents").Document<Record<string, any>>[]>;
}
