import { Ignore } from "ignore";
import { Document } from "@langchain/core/documents";
import { AsyncCaller, AsyncCallerParams } from "@langchain/core/utils/async_caller";
import { BaseDocumentLoader } from "../base.js";
import { UnknownHandling } from "../fs/directory.js";
/**
 * An interface that represents a file in a GitHub repository. It has
 * properties for the file name, path, SHA, size, URLs, type, and links.
 */
export interface GithubFile {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    _links: {
        self: string;
        git: string;
        html: string;
    };
}
/**
 * An interface that represents the parameters for the GithubRepoLoader
 * class. It extends the AsyncCallerParams interface and adds additional
 * properties specific to the GitHub repository loader.
 */
export interface GithubRepoLoaderParams extends AsyncCallerParams {
    /**
     * The base URL of the GitHub instance.
     * To be used when you are not targeting github.com, e.g. a GitHub Enterprise instance.
     */
    baseUrl?: string;
    /**
     * The API endpoint URL of the GitHub instance.
     * To be used when you are not targeting github.com, e.g. a GitHub Enterprise instance.
     */
    apiUrl?: string;
    branch?: string;
    recursive?: boolean;
    /**
     * Set to true to recursively process submodules. Is only effective, when recursive=true.
     */
    processSubmodules?: boolean;
    unknown?: UnknownHandling;
    accessToken?: string;
    ignoreFiles?: (string | RegExp)[];
    ignorePaths?: string[];
    verbose?: boolean;
    /**
     * The maximum number of concurrent calls that can be made. Defaults to 2.
     */
    maxConcurrency?: number;
    /**
     * The maximum number of retries that can be made for a single call,
     * with an exponential backoff between each attempt. Defaults to 2.
     */
    maxRetries?: number;
}
/**
 * A class that extends the BaseDocumentLoader and implements the
 * GithubRepoLoaderParams interface. It represents a document loader for
 * loading files from a GitHub repository.
 */
export declare class GithubRepoLoader extends BaseDocumentLoader implements GithubRepoLoaderParams {
    baseUrl: string;
    apiUrl: string;
    private readonly owner;
    private readonly repo;
    private readonly initialPath;
    private headers;
    branch: string;
    recursive: boolean;
    processSubmodules: boolean;
    unknown: UnknownHandling;
    accessToken?: string;
    ignoreFiles: (string | RegExp)[];
    ignore?: Ignore;
    verbose?: boolean;
    maxConcurrency?: number;
    maxRetries?: number;
    protected caller: AsyncCaller;
    ignorePaths?: string[];
    private submoduleInfos;
    constructor(githubUrl: string, { accessToken, baseUrl, apiUrl, branch, recursive, processSubmodules, unknown, ignoreFiles, ignorePaths, verbose, maxConcurrency, maxRetries, ...rest }?: GithubRepoLoaderParams);
    /**
     * Extracts the owner, repository, and path from a GitHub URL.
     * @param url The GitHub URL to extract information from.
     * @returns An object containing the owner, repository, and path extracted from the GitHub URL.
     */
    private extractOwnerAndRepoAndPath;
    /**
     * Fetches the files from the GitHub repository and creates Document
     * instances for each file. It also handles error handling based on the
     * unknown handling option.
     * @returns A promise that resolves to an array of Document instances.
     */
    load(): Promise<Document[]>;
    /**
     * Asynchronously streams documents from the entire GitHub repository.
     * It is suitable for situations where processing large repositories in a memory-efficient manner is required.
     * @yields Yields a Promise that resolves to a Document object for each file or submodule content found in the repository.
     */
    loadAsStream(): AsyncGenerator<Document, void, undefined>;
    /**
     * Loads the information about Git submodules from the repository, if available.
     */
    private getSubmoduleInfo;
    /**
     * Parses the given content of a .gitmodules file. Furthermore, queries the current SHA ref of all submodules.
     * Returns the submodule information as array.
     * @param gitmodulesContent the content of a .gitmodules file
     */
    private parseGitmodules;
    /**
     * Loads the documents of the given submodule. Uses the same parameters as for the current repository.
     * External submodules, i.e. submodules pointing to another GitHub instance, are ignored.
     * @param submoduleInfo the info about the submodule to be loaded
     */
    private loadSubmodule;
    /**
     * Asynchronously processes and streams the contents of a specified submodule in the GitHub repository.
     * @param submoduleInfo the info about the submodule to be loaded
     * @yields Yields a Promise that resolves to a Document object for each file found in the submodule.
     */
    private loadSubmoduleAsStream;
    /**
     * Determines whether a file or directory should be ignored based on its
     * path and type.
     * @param path The path of the file or directory.
     * @param fileType The type of the file or directory.
     * @returns A boolean indicating whether the file or directory should be ignored.
     */
    protected shouldIgnore(path: string, fileType: string): boolean;
    /**
     * Takes the file info and wrap it in a promise that will resolve to the file content and metadata
     * @param file
     * @returns
     */
    private fetchFileContentWrapper;
    /**
     * Maps a list of files / directories to a list of promises that will fetch the file / directory contents
     */
    private getCurrentDirectoryFilePromises;
    /**
     * Begins the process of fetching the contents of the repository
     */
    private processRepo;
    /**
     * Asynchronously processes the contents of the entire GitHub repository,
     * streaming each file as a Document object.
     * @param path The path of the directory to process.
     * @yields Yields a Promise that resolves to a Document object for each file found in the repository.
     */
    private processRepoAsStream;
    /**
     * Fetches the contents of a directory and maps the file / directory paths
     * to promises that will fetch the file / directory contents.
     * @param path The path of the directory to process.
     * @returns A promise that resolves to an array of promises that will fetch the file / directory contents.
     */
    private processDirectory;
    /**
     * Asynchronously processes the contents of a given directory in the GitHub repository,
     * streaming each file as a Document object.
     * @param path The path of the directory to process.
     * @yields Yields a Promise that resolves to a Document object for each file in the directory.
     */
    private processDirectoryAsStream;
    /**
     * Fetches the files from a GitHub repository.
     * If the path denotes a single file, the resulting array contains only one element.
     * @param path The path of the repository to fetch the files from.
     * @returns A promise that resolves to an array of GithubFile instances.
     */
    private fetchRepoFiles;
    /**
     * Fetches the content of a file from a GitHub repository.
     * @param file The file to fetch the content from.
     * @returns A promise that resolves to the content of the file.
     */
    private fetchFileContent;
    /**
     * Handles errors based on the unknown handling option.
     * @param message The error message.
     * @returns void
     */
    private handleError;
    /**
     * Logs the given message to the console, if parameter 'verbose' is set to true.
     * @param message the message to be logged.
     */
    private log;
}
