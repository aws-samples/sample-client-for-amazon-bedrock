import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlobStorageFileLoader } from "./azure_blob_storage_file.js";
import { BaseDocumentLoader } from "../base.js";
/**
 * Class representing a document loader that loads documents from an Azure
 * Blob Storage container. It extends the BaseDocumentLoader class.
 */
export class AzureBlobStorageContainerLoader extends BaseDocumentLoader {
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
        Object.defineProperty(this, "unstructuredConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.connectionString = azureConfig.connectionString;
        this.container = azureConfig.container;
        this.unstructuredConfig = unstructuredConfig;
    }
    /**
     * Method to load documents from an Azure Blob Storage container. It
     * creates a BlobServiceClient using the connection string, gets the
     * container client using the container name, and iterates over the blobs
     * in the container. For each blob, it creates an instance of
     * AzureBlobStorageFileLoader and loads the documents using the loader.
     * The loaded documents are concatenated to the docs array and returned.
     * @returns An array of loaded documents.
     */
    async load() {
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString, {
            userAgentOptions: {
                userAgentPrefix: "langchainjs-blob-storage-container",
            },
        });
        const containerClient = blobServiceClient.getContainerClient(this.container);
        let docs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            const loader = new AzureBlobStorageFileLoader({
                azureConfig: {
                    connectionString: this.connectionString,
                    container: this.container,
                    blobName: blob.name,
                },
                unstructuredConfig: this.unstructuredConfig,
            });
            docs = docs.concat(await loader.load());
        }
        return docs;
    }
}
