import _ from "lodash";
import { Portkey as _Portkey } from "portkey-ai";
import { GenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseLLM } from "@langchain/core/language_models/llms";
const readEnv = (env, default_val) => getEnvironmentVariable(env) ?? default_val;
export class PortkeySession {
    constructor(options = {}) {
        Object.defineProperty(this, "portkey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!options.apiKey) {
            /* eslint-disable no-param-reassign */
            options.apiKey = readEnv("PORTKEY_API_KEY");
        }
        if (!options.baseURL) {
            /* eslint-disable no-param-reassign */
            options.baseURL = readEnv("PORTKEY_BASE_URL", "https://api.portkey.ai");
        }
        this.portkey = new _Portkey({});
        this.portkey.llms = [{}];
        if (!options.apiKey) {
            throw new Error("Set Portkey ApiKey in PORTKEY_API_KEY env variable");
        }
        this.portkey = new _Portkey(options);
    }
}
const defaultPortkeySession = [];
/**
 * Get a session for the Portkey API. If one already exists with the same options,
 * it will be returned. Otherwise, a new session will be created.
 * @param options
 * @returns
 */
export function getPortkeySession(options = {}) {
    let session = defaultPortkeySession.find((session) => _.isEqual(session.options, options))?.session;
    if (!session) {
        session = new PortkeySession(options);
        defaultPortkeySession.push({ session, options });
    }
    return session;
}
/**
 * @example
 * ```typescript
 * const model = new Portkey({
 *   mode: "single",
 *   llms: [
 *     {
 *       provider: "openai",
 *       virtual_key: "open-ai-key-1234",
 *       model: "gpt-3.5-turbo-instruct",
 *       max_tokens: 2000,
 *     },
 *   ],
 * });
 *
 * // Stream the output of the model and process it
 * const res = await model.stream(
 *   "Question: Write a story about a king\nAnswer:"
 * );
 * for await (const i of res) {
 *   process.stdout.write(i);
 * }
 * ```
 */
export class Portkey extends BaseLLM {
    constructor(init) {
        super(init ?? {});
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "baseURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "mode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "llms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "session", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.apiKey = init?.apiKey;
        this.baseURL = init?.baseURL;
        this.mode = init?.mode;
        this.llms = init?.llms;
        this.session = getPortkeySession({
            apiKey: this.apiKey,
            baseURL: this.baseURL,
            llms: this.llms,
            mode: this.mode,
        });
    }
    _llmType() {
        return "portkey";
    }
    async _generate(prompts, options, _) {
        const choices = [];
        for (let i = 0; i < prompts.length; i += 1) {
            const response = await this.session.portkey.completions.create({
                prompt: prompts[i],
                ...options,
                stream: false,
            });
            choices.push(response.choices);
        }
        const generations = choices.map((promptChoices) => promptChoices.map((choice) => ({
            text: choice.text ?? "",
            generationInfo: {
                finishReason: choice.finish_reason,
                logprobs: choice.logprobs,
            },
        })));
        return {
            generations,
        };
    }
    async *_streamResponseChunks(input, options, runManager) {
        const response = await this.session.portkey.completions.create({
            prompt: input,
            ...options,
            stream: true,
        });
        for await (const data of response) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const chunk = new GenerationChunk({
                text: choice.text ?? "",
                generationInfo: {
                    finishReason: choice.finish_reason,
                },
            });
            yield chunk;
            void runManager?.handleLLMNewToken(chunk.text ?? "");
        }
        if (options.signal?.aborted) {
            throw new Error("AbortError");
        }
    }
}
