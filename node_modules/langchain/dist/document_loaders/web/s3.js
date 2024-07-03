import * as fsDefault from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { Readable } from "node:stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { BaseDocumentLoader } from "../base.js";
import { UnstructuredLoader as UnstructuredLoaderDefault } from "../fs/unstructured.js";
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
export class S3Loader extends BaseDocumentLoader {
    constructor({ bucket, key, unstructuredAPIURL, unstructuredAPIKey, s3Config = {}, fs = fsDefault, UnstructuredLoader = UnstructuredLoaderDefault, }) {
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
            const s3Client = new S3Client(this.s3Config);
            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucket,
                Key: this.key,
            });
            const response = await s3Client.send(getObjectCommand);
            const objectData = await new Promise((resolve, reject) => {
                const chunks = [];
                // eslint-disable-next-line no-instanceof/no-instanceof
                if (response.Body instanceof Readable) {
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
