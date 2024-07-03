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
exports.S3Loader = void 0;
const fsDefault = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const node_stream_1 = require("node:stream");
const client_s3_1 = require("@aws-sdk/client-s3");
const base_js_1 = require("../base.cjs");
const unstructured_js_1 = require("../fs/unstructured.cjs");
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
class S3Loader extends base_js_1.BaseDocumentLoader {
    constructor({ bucket, key, unstructuredAPIURL, unstructuredAPIKey, s3Config = {}, fs = fsDefault, UnstructuredLoader = unstructured_js_1.UnstructuredLoader, }) {
        super();
        Object.defineProperty(this, "bucket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "key", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unstructuredAPIURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unstructuredAPIKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "s3Config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_fs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_UnstructuredLoader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.bucket = bucket;
        this.key = key;
        this.unstructuredAPIURL = unstructuredAPIURL;
        this.unstructuredAPIKey = unstructuredAPIKey;
        this.s3Config = s3Config;
        this._fs = fs;
        this._UnstructuredLoader = UnstructuredLoader;
    }
    /**
     * Loads the file from the S3 bucket, saves it to a temporary directory,
     * and then uses the UnstructuredLoader to load the file as a document.
     * @returns An array of Document objects representing the loaded documents.
     */
    async load() {
        const tempDir = this._fs.mkdtempSync(path.join(os.tmpdir(), "s3fileloader-"));
        const filePath = path.join(tempDir, this.key);
        try {
            const s3Client = new client_s3_1.S3Client(this.s3Config);
            const getObjectCommand = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: this.key,
            });
            const response = await s3Client.send(getObjectCommand);
            const objectData = await new Promise((resolve, reject) => {
                const chunks = [];
                // eslint-disable-next-line no-instanceof/no-instanceof
                if (response.Body instanceof node_stream_1.Readable) {
                    response.Body.on("data", (chunk) => chunks.push(chunk));
                    response.Body.on("end", () => resolve(Buffer.concat(chunks)));
                    response.Body.on("error", reject);
                }
                else {
                    reject(new Error("Response body is not a readable stream."));
                }
            });
            this._fs.mkdirSync(path.dirname(filePath), { recursive: true });
            this._fs.writeFileSync(filePath, objectData);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            throw new Error(`Failed to download file ${this.key} from S3 bucket ${this.bucket}: ${e.message}`);
        }
        try {
            const options = {
                apiUrl: this.unstructuredAPIURL,
                apiKey: this.unstructuredAPIKey,
            };
            const unstructuredLoader = new this._UnstructuredLoader(filePath, options);
            const docs = await unstructuredLoader.load();
            return docs;
        }
        catch {
            throw new Error(`Failed to load file ${filePath} using unstructured loader.`);
        }
    }
}
exports.S3Loader = S3Loader;
