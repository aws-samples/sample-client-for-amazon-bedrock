import { ClientConfiguration, HubPushOptions } from "langchainhub";
import { Runnable } from "@langchain/core/runnables";
/**
 * Push a prompt to the hub.
 * If the specified repo doesn't already exist, it will be created.
 * @param repoFullName The full name of the repo.
 * @param runnable The prompt to push.
 * @param options
 * @returns The URL of the newly pushed prompt in the hub.
 */
export declare function push(repoFullName: string, runnable: Runnable, options?: HubPushOptions & ClientConfiguration): Promise<string>;
/**
 * Pull a prompt from the hub.
 * @param ownerRepoCommit The name of the repo containing the prompt, as well as an optional commit hash separated by a slash.
 * @param options
 * @returns
 */
export declare function pull<T extends Runnable>(ownerRepoCommit: string, options?: ClientConfiguration): Promise<T>;
