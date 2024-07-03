import { htmlToText } from "html-to-text";
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * Class representing a document loader for loading pages from Confluence.
 * @example
 * ```typescript
 * const loader = new ConfluencePagesLoader({
 *   baseUrl: "https:
 *   spaceKey: "~EXAMPLE362906de5d343d49dcdbae5dEXAMPLE",
 *   username: "your-username",
 *   accessToken: "your-access-token",
 * });
 * const documents = await loader.load();
 * console.log(documents);
 * ```
 */
export class ConfluencePagesLoader extends BaseDocumentLoader {
    constructor({ baseUrl, spaceKey, username, accessToken, limit = 25, expand = "body.storage,version", personalAccessToken, }) {
        super();
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "spaceKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "username", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "limit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * expand parameter for confluence rest api
         * description can be found at https://developer.atlassian.com/server/confluence/expansions-in-the-rest-api/
         */
        Object.defineProperty(this, "expand", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "personalAccessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = baseUrl;
        this.spaceKey = spaceKey;
        this.username = username;
        this.accessToken = accessToken;
        this.limit = limit;
        this.expand = expand;
        this.personalAccessToken = personalAccessToken;
    }
    /**
     * Returns the authorization header for the request.
     * @returns The authorization header as a string, or undefined if no credentials were provided.
     */
    get authorizationHeader() {
        if (this.personalAccessToken) {
            return `Bearer ${this.personalAccessToken}`;
        }
        else if (this.username && this.accessToken) {
            const authToken = Buffer.from(`${this.username}:${this.accessToken}`).toString("base64");
            return `Basic ${authToken}`;
        }
        return undefined;
    }
    /**
     * Fetches all the pages in the specified space and converts each page to
     * a Document instance.
     * @param options the extra options of the load function
     * @param options.limit The limit parameter to overwrite the size to fetch pages.
     * @param options.start The start parameter to set inital offset to fetch pages.
     * @returns Promise resolving to an array of Document instances.
     */
    async load(options) {
        try {
            const pages = await this.fetchAllPagesInSpace(options?.start, options?.limit);
            return pages.map((page) => this.createDocumentFromPage(page));
        }
        catch (error) {
            console.error("Error:", error);
            return [];
        }
    }
    /**
     * Fetches data from the Confluence API using the provided URL.
     * @param url The URL to fetch data from.
     * @returns Promise resolving to the JSON response from the API.
     */
    async fetchConfluenceData(url) {
        try {
            const initialHeaders = {
                "Content-Type": "application/json",
                Accept: "application/json",
            };
            const authHeader = this.authorizationHeader;
            if (authHeader) {
                initialHeaders.Authorization = authHeader;
            }
            const response = await fetch(url, {
                headers: initialHeaders,
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url} from Confluence: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Failed to fetch ${url} from Confluence: ${error}`);
        }
    }
    /**
     * Recursively fetches all the pages in the specified space.
     * @param start The start parameter to paginate through the results.
     * @returns Promise resolving to an array of ConfluencePage objects.
     */
    async fetchAllPagesInSpace(start = 0, limit = this.limit) {
        const url = `${this.baseUrl}/rest/api/content?spaceKey=${this.spaceKey}&limit=${limit}&start=${start}&expand=${this.expand}`;
        const data = await this.fetchConfluenceData(url);
        if (data.size === 0) {
            return [];
        }
        const nextPageStart = start + data.size;
        const nextPageResults = await this.fetchAllPagesInSpace(nextPageStart, limit);
        return data.results.concat(nextPageResults);
    }
    /**
     * Creates a Document instance from a ConfluencePage object.
     * @param page The ConfluencePage object to convert.
     * @returns A Document instance.
     */
    createDocumentFromPage(page) {
        // Convert the HTML content to plain text
        const plainTextContent = htmlToText(page.body.storage.value, {
            wordwrap: false,
            preserveNewlines: false,
        });
        // Remove empty lines
        const textWithoutEmptyLines = plainTextContent.replace(/^\s*[\r\n]/gm, "");
        // Generate the URL
        const pageUrl = `${this.baseUrl}/spaces/${this.spaceKey}/pages/${page.id}`;
        // Return a langchain document
        return new Document({
            pageContent: textWithoutEmptyLines,
            metadata: {
                id: page.id,
                status: page.status,
                title: page.title,
                type: page.type,
                url: pageUrl,
                version: page.version?.number,
                updated_by: page.version?.by?.displayName,
                updated_at: page.version?.when,
            },
        });
    }
}
