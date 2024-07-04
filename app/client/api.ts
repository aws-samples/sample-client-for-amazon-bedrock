import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  Azure,
  ModelProvider,
  ServiceProvider,
} from "../constant";
import { ChatMessage, ModelType, useAccessStore, useChatStore } from "../store";
import { ChatGPTApi } from "./platforms/openai";
import { GeminiProApi } from "./platforms/google";
import { ClaudeApi } from "./platforms/aws";
import { BRProxyApi } from "./platforms/brproxy";
export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface AttachmentDocument {
  name:string;
  format:string;
  size?:number;
  source:{"bytes":Uint8Array};
}
export interface MultimodalContent {
  type: "text" | "image_url"|"doc";
  text?: string;
  image_url?: {
    url: string;
  };
  doc?: AttachmentDocument
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, metrics?: object) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  available: boolean;
  modelId?: string;
  multiple?: boolean;
  anthropic_version?: string;
  displayName: string;
  provider: LLMModelProvider;
}

export interface LLMModelProvider {
  id?: string;
  providerName?: string;
  providerType?: string;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}

type ProviderName = "aws" | "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.Claude) {
    const accessStore = useAccessStore.getState();
    console.log("provider is:" + provider);
    if (provider == ModelProvider.AWS && accessStore.useBRProxy === "True") {
      this.llm = new BRProxyApi();
      return;
    }
    if (provider === ModelProvider.Claude) {
      if (accessStore.useBRProxy === "True") {
        this.llm = new BRProxyApi();
        return;
      }
      this.llm = new ClaudeApi();
      return;
    }
    // if (provider === ModelProvider.GeminiPro) {
    //   this.llm = new GeminiProApi();
    //   return;
    // }
    // this.llm = new ChatGPTApi();
    this.llm = new ClaudeApi();
  }

  config() { }

  prompts() { }

  masks() { }

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [BRClient]: A chatbot client forked from https://github.com/Yidadaa/ChatGPT-Next-Web",
        },
      ]);


    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export function getHeaders() {
  const accessStore = useAccessStore.getState();
  const mask = useChatStore.getState().currentSession().mask;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Session-Id": mask.id,
  };
  const modelConfig = useChatStore.getState().currentSession().mask.modelConfig;
  const isGoogle = modelConfig.model.startsWith("gemini");
  const isAzure = accessStore.provider === ServiceProvider.Azure;
  const authHeader = isAzure ? "api-key" : "Authorization";
  const apiKey = isGoogle
    ? accessStore.googleApiKey
    : isAzure
      ? accessStore.azureApiKey
      : accessStore.openaiApiKey;
  const clientConfig = getClientConfig();
  const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  // when using google api in app, not set auth header
  if (!(isGoogle && clientConfig?.isApp)) {
    // use user's api key first
    if (validString(apiKey)) {
      headers[authHeader] = makeBearer(apiKey);
    } else if (
      accessStore.enabledAccessControl() &&
      validString(accessStore.accessCode)
    ) {
      headers[authHeader] = makeBearer(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
      );
    }
  }

  return headers;
}
