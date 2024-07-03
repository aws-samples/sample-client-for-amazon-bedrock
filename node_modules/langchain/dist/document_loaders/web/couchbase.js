import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * loader for couchbase document
 */
export class CouchbaseDocumentLoader extends BaseDocumentLoader {
    /**
     * construct Couchbase document loader with a requirement for couchbase cluster client
     * @param client { Cluster } [ couchbase connected client to connect to database ]
     * @param query { string } [ query to get results from while loading the data ]
     * @param pageContentFields { Array<string> } [ filters fields of the document and shows these only ]
     * @param metadataFields { Array<string> } [ metadata fields required ]
     */
    constructor(client, query, pageContentFields, metadataFields) {
        super();
        Object.defineProperty(this, "cluster", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "query", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pageContentFields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metadataFields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!client) {
            throw new Error("Couchbase client cluster must be provided.");
        }
        this.cluster = client;
        this.query = query;
        this.pageContentFields = pageContentFields;
        this.metadataFields = metadataFields;
    }
    /**
     * Function to load document based on query from couchbase
     * @returns {Promise<Document[]>} [ Returns a promise of all the documents as array ]
     */
    async load() {
        const documents = [];
        for await (const doc of this.lazyLoad()) {
            documents.push(doc);
        }
        return documents;
    }
    /**
     * Function to load documents based on iterator rather than full load
     * @returns {AsyncIterable<Document>} [ Returns an iterator to fetch documents ]
     */
    async *lazyLoad() {
        // Run SQL++ Query
        const result = await this.cluster.query(this.query);
        for await (const row of result.rows) {
            let { metadataFields, pageContentFields } = this;
            if (!pageContentFields) {
                pageContentFields = Object.keys(row);
            }
            if (!metadataFields) {
                metadataFields = [];
            }
            const metadata = metadataFields.reduce((obj, field) => ({ ...obj, [field]: row[field] }), {});
            const document = pageContentFields
                .map((k) => `${k}: ${JSON.stringify(row[k])}`)
                .join("\n");
            yield new Document({
                pageContent: document,
                metadata,
            });
        }
    }
}
