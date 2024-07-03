import { GoogleAuth, GoogleAuthOptions } from "google-auth-library";
import { GoogleAbstractedClient, GoogleAbstractedClientOps } from "../types/googlevertexai-types.js";
export declare class GAuthClient implements GoogleAbstractedClient {
    gauth: GoogleAuth;
    constructor(options?: GoogleAuthOptions);
    getProjectId(): Promise<string>;
    request(opts: GoogleAbstractedClientOps): Promise<unknown>;
}
