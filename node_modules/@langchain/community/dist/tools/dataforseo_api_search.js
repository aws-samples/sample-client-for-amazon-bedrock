import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Tool } from "@langchain/core/tools";
/**
 * @class DataForSeoAPISearch
 * @extends {Tool}
 * @description Represents a wrapper class to work with DataForSEO SERP API.
 */
export class DataForSeoAPISearch extends Tool {
    static lc_name() {
        return "DataForSeoAPISearch";
    }
    /**
     * @constructor
     * @param {DataForSeoApiConfig} config
     * @description Sets up the class, throws an error if the API login/password isn't provided.
     */
    constructor(config = {}) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "dataforseo-api-wrapper"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A robust Google Search API provided by DataForSeo. This tool is handy when you need information about trending topics or current events."
        });
        Object.defineProperty(this, "apiLogin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiPassword", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * @property defaultParams
         * @type {Record<string, string | number | boolean>}
         * @description These are the default parameters to be used when making an API request.
         */
        Object.defineProperty(this, "defaultParams", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                location_name: "United States",
                language_code: "en",
                depth: 10,
                se_name: "google",
                se_type: "organic",
            }
        });
        Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "jsonResultTypes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "jsonResultFields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "useJsonOutput", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        const apiLogin = config.apiLogin ?? getEnvironmentVariable("DATAFORSEO_LOGIN");
        const apiPassword = config.apiPassword ?? getEnvironmentVariable("DATAFORSEO_PASSWORD");
        const params = config.params ?? {};
        if (!apiLogin || !apiPassword) {
            throw new Error("DataForSEO login or password not set. You can set it as DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in your .env file, or pass it to DataForSeoAPISearch.");
        }
        this.params = { ...this.defaultParams, ...params };
        this.apiLogin = apiLogin;
        this.apiPassword = apiPassword;
        this.jsonResultTypes = config.jsonResultTypes;
        this.jsonResultFields = config.jsonResultFields;
        this.useJsonOutput = config.useJsonOutput ?? false;
        this.topCount = config.topCount;
    }
    /**
     * @method _call
     * @param {string} keyword
     * @returns {Promise<string>}
     * @description Initiates a call to the API and processes the response.
     */
    async _call(keyword) {
        return this.useJsonOutput
            ? JSON.stringify(await this.results(keyword))
            : this.processResponse(await this.getResponseJson(keyword));
    }
    /**
     * @method results
     * @param {string} keyword
     * @returns {Promise<Array<any>>}
     * @description Fetches the results from the API for the given keyword.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async results(keyword) {
        const res = await this.getResponseJson(keyword);
        return this.filterResults(res, this.jsonResultTypes);
    }
    /**
     * @method prepareRequest
     * @param {string} keyword
     * @returns {{url: string; headers: HeadersInit; data: BodyInit}}
     * @description Prepares the request details for the API call.
     */
    prepareRequest(keyword) {
        if (this.apiLogin === undefined || this.apiPassword === undefined) {
            throw new Error("api_login or api_password is not provided");
        }
        const credentials = Buffer.from(`${this.apiLogin}:${this.apiPassword}`, "utf-8").toString("base64");
        const headers = {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
        };
        const params = { ...this.params };
        params.keyword ??= keyword;
        const data = [params];
        return {
            url: `https://api.dataforseo.com/v3/serp/${params.se_name}/${params.se_type}/live/advanced`,
            headers,
            data: JSON.stringify(data),
        };
    }
    /**
     * @method getResponseJson
     * @param {string} keyword
     * @returns {Promise<ApiResponse>}
     * @description Executes a POST request to the provided URL and returns a parsed JSON response.
     */
    async getResponseJson(keyword) {
        const requestDetails = this.prepareRequest(keyword);
        const response = await fetch(requestDetails.url, {
            method: "POST",
            headers: requestDetails.headers,
            body: requestDetails.data,
        });
        if (!response.ok) {
            throw new Error(`Got ${response.status} error from DataForSEO: ${response.statusText}`);
        }
        const result = await response.json();
        return this.checkResponse(result);
    }
    /**
     * @method checkResponse
     * @param {ApiResponse} response
     * @returns {ApiResponse}
     * @description Checks the response status code.
     */
    checkResponse(response) {
        if (response.status_code !== 20000) {
            throw new Error(`Got error from DataForSEO SERP API: ${response.status_message}`);
        }
        for (const task of response.tasks) {
            if (task.status_code !== 20000) {
                throw new Error(`Got error from DataForSEO SERP API: ${task.status_message}`);
            }
        }
        return response;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * @method filterResults
     * @param {ApiResponse} res
     * @param {Array<string> | undefined} types
     * @returns {Array<any>}
     * @description Filters the results based on the specified result types.
     */
    filterResults(res, types) {
        const output = [];
        for (const task of res.tasks || []) {
            for (const result of task.result || []) {
                for (const item of result.items || []) {
                    if (types === undefined ||
                        types.length === 0 ||
                        types.includes(item.type)) {
                        const newItem = this.cleanupUnnecessaryItems(item);
                        if (Object.keys(newItem).length !== 0) {
                            output.push(newItem);
                        }
                    }
                    if (this.topCount !== undefined && output.length >= this.topCount) {
                        break;
                    }
                }
            }
        }
        return output;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable no-param-reassign */
    /**
     * @method cleanupUnnecessaryItems
     * @param {any} d
     * @description Removes unnecessary items from the response.
     */
    cleanupUnnecessaryItems(d) {
        if (Array.isArray(d)) {
            return d.map((item) => this.cleanupUnnecessaryItems(item));
        }
        const toRemove = ["xpath", "position", "rectangle"];
        if (typeof d === "object" && d !== null) {
            return Object.keys(d).reduce((newObj, key) => {
                if ((this.jsonResultFields === undefined ||
                    this.jsonResultFields.includes(key)) &&
                    !toRemove.includes(key)) {
                    if (typeof d[key] === "object" && d[key] !== null) {
                        newObj[key] = this.cleanupUnnecessaryItems(d[key]);
                    }
                    else {
                        newObj[key] = d[key];
                    }
                }
                return newObj;
            }, {});
        }
        return d;
    }
    /**
     * @method processResponse
     * @param {ApiResponse} res
     * @returns {string}
     * @description Processes the response to extract meaningful data.
     */
    processResponse(res) {
        let returnValue = "No good search result found";
        for (const task of res.tasks || []) {
            for (const result of task.result || []) {
                const { item_types } = result;
                const items = result.items || [];
                if (item_types.includes("answer_box")) {
                    returnValue = items.find((item) => item.type === "answer_box").text;
                }
                else if (item_types.includes("knowledge_graph")) {
                    returnValue = items.find((item) => item.type === "knowledge_graph").description;
                }
                else if (item_types.includes("featured_snippet")) {
                    returnValue = items.find((item) => item.type === "featured_snippet").description;
                }
                else if (item_types.includes("shopping")) {
                    returnValue = items.find((item) => item.type === "shopping").price;
                }
                else if (item_types.includes("organic")) {
                    returnValue = items.find((item) => item.type === "organic").description;
                }
                if (returnValue) {
                    break;
                }
            }
        }
        return returnValue;
    }
}
