import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { BlobServiceClient } from "@azure/storage-blob";
import { BaseDocumentLoader } from "../base.js";
import { UnstructuredLoader, } from "../fs/unstructured.js";
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
export class AzureBlobStorageFileLoader extends BaseDocumentLoader {
    constructor({ azureConfig, unstructuredConfig, }) {
        super();
        Object.defineProperty(this, "connectionString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "blobName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unstructuredConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.connectionString = azureConfig.connectionString;
        this.container = azureConfig.container;
        this.blobName = azureConfig.blobName;
        this.unstructuredConfig = unstructuredConfig;
    }
    /**
     * Method to load a specific file from Azure Blob Storage. It creates a
     * temporary directory, constructs the file path, downloads the file, and
     * loads the documents using the UnstructuredLoader. The loaded documents
     * are returned, and the temporary directory is deleted.
     * @returns An array of documents loaded from the file in Azure Blob Storage.
     */
    async load() {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "azureblobfileloader-"));
        const filePath = path.join(tempDir, this.blobName);
        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString, {
                userAgentOptions: {
                    userAgentPrefix: "langchainjs-blob-storage-file",
                },
            });
            const containerClient = blobServiceClient.getContainerClient(this.container);
            const blobClient = containerClient.getBlobClient(this.blobName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            await blobClient.downloadToFile(filePath);
        }
        catch (e) {
            throw new Error(`Failed to download file ${this.blobName} from Azure Blob Storage container ${this.container}: ${e.message}`);
        }
        try {
            const unstructuredLoader = new UnstructuredLoader(filePath, this.unstructuredConfig);
            const docs = await unstructuredLoader.load();
            return docs;
        }
        catch {
            throw new Error(`Failed to load file ${filePath} using unstructured loader.`);
        }
        finally {
            fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
        }
    }
}
