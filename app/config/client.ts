import { BuildConfig, getBuildConfig } from "./build";

export function getClientConfig() {
  if (typeof document !== "undefined") {
    // client side
    const configStr = queryMeta("config");
    if (!configStr) {
      throw new Error("Missing client configuration");
    }
    try {
      return JSON.parse(configStr) as BuildConfig;
    } catch (e) {
      throw new Error(`Invalid client configuration: ${e.message}`);
    }
  }

  if (typeof process !== "undefined") {
    // server side
    return getBuildConfig();
  }
}

function queryMeta(key: string, defaultValue?: string): string {
  let ret: string;
  if (document) {
    const meta = document.head.querySelector(
      `meta[name='${key}']`,
    ) as HTMLMetaElement;
    ret = meta?.content ?? "";
  } else {
    ret = defaultValue ?? "";
  }

  return ret;
}
