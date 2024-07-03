export type HubUpdateOptions = {
    description?: string;
    isPublic?: boolean;
    tags?: string[];
};
export type HubPushOptions = {
    parentCommitHash?: string;
    newRepoIsPublic?: boolean;
    newRepoDescription?: string;
};
export type ClientConfiguration = {
    apiUrl?: string;
    apiKey?: string;
};
export declare class Client {
    apiKey?: string;
    apiUrl: string;
    constructor(config?: ClientConfiguration);
    get _hostUrl(): "http://localhost" | "https://beta.smith.langchain.com" | "https://dev.smith.langchain.com" | "https://smith.langchain.com";
    protected _getHeaders(method?: "GET" | "POST" | "PATCH"): {
        [key: string]: string;
    };
    getSettings(): Promise<any>;
    setTenantHandle(tenantHandle: string): Promise<any>;
    listRepos(options?: {
        limit?: number;
        offset?: number;
    }): Promise<any>;
    getRepo(repoFullName: string): Promise<any>;
    createRepo(repoHandle: string, options?: {
        description?: string;
        isPublic?: boolean;
    }): Promise<any>;
    listCommits(repoFullName: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any>;
    likeRepo(repoFullName: string): Promise<any>;
    unlikeRepo(repoFullName: string): Promise<any>;
    protected _getLatestCommitHash(repoFullName: string): Promise<string | undefined>;
    updateRepo(repoFullName: string, options?: HubUpdateOptions): Promise<any>;
    push(repoFullName: string, manifestJson: string, options?: HubPushOptions): Promise<string>;
    pull(ownerRepoCommit: string): Promise<string>;
}
