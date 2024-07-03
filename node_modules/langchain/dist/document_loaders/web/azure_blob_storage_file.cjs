"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobStorageFileLoader = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const storage_blob_1 = require("@azure/storage-blob");
const base_js_1 = require("../base.cjs");
const unstructured_js_1 = require("../fs/unstructured.cjs");
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
class AzureBlobStorageFileLoader extends base_js_1.BaseDocumentLoader {
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
            const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(this.connectionString, {
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
            const unstructuredLoader = new unstructured_js_1.UnstructuredLoader(filePath, this.unstructuredConfig);
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
exports.AzureBlobStorageFileLoader = AzureBlobStorageFileLoader;
