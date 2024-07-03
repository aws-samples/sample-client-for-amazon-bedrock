import { BaseDocumentLoader } from "../base.js";
import { UnstructuredLoaderOptions } from "../fs/unstructured.js";
/**
 * Interface representing the configuration for accessing a specific file
 * in Azure Blob Storage.
 */
interface AzureBlobStorageFileConfig {
    connectionString: string;
    container: string;
    blobName: string;
}
/**
 * Interface representing the configuration for the
 * AzureBlobStorageFileLoader. It contains the Azure Blob Storage file
 * configuration and the options for the UnstructuredLoader.
 */
interface AzureBlobStorageFileLoaderConfig {
    azureConfig: AzureBlobStorageFileConfig;
    unstructuredConfig?: UnstructuredLoaderOptions;
}
/**
 * Class representing a document loader that loads a specific file from
 * Azure Blob Storage. It extends the BaseDocumentLoader class and
 * implements the DocumentLoader interface.
 * @example
 * ```typescript
 * const loader = new AzureBlobStorageFileLoader({
 *   azureConfig: {
 *     connectionString: "{connectionString}",
 *     container: "{containerName}",
 *     blobName: "{blobName}",
 *   },
 * });
 * const docs = await loader.load();
 * ```
 */
export declare class AzureBlobStorageFileLoader extends BaseDocumentLoader {
    private readonly connectionString;
    private readonly container;
    private readonly blobName;
    private readonly unstructuredConfig?;
    constructor({ azureConfig, unstructuredConfig, }: AzureBlobStorageFileLoaderConfig);
    /**
     * Method to load a specific file from Azure Blob Storage. It creates a
     * temporary directory, constructs the file path, downloads the file, and
     * loads the documents using the UnstructuredLoader. The loaded documents
     * are returned, and the temporary directory is deleted.
     * @returns An array of documents loaded from the file in Azure Blob Storage.
     */
    load(): Promise<import("@langchain/core/documents").Document<Record<string, any>>[]>;
}
export {};
