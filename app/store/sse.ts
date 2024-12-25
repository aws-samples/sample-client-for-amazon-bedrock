import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface MCPServerConfig {
  name: string;
  transport: string;
  sseUrl: string;
  authToken?: string;
  client?: Client;
  status: string;
}

interface SSEState {
  configs: MCPServerConfig[];
  addConfig: (config: MCPServerConfig) => void;
  removeConfig: (name: string) => void;
  updateConfig: (config: MCPServerConfig) => void;
}

export const useSSEStore = create<SSEState>()(
  persist(
    (set) => ({
      configs: [],
      addConfig: (config) => 
        set((state) => ({
          configs: [...state.configs, config]
        })),
      removeConfig: (name: string) => 
        set((state) => ({
          configs: state.configs.filter((c) => c.name !== name)
        })),
      updateConfig: (config: MCPServerConfig) => 
        set((state) => ({
          configs: state.configs.map((c) => {
            if (c.name === config.name) {
              // 如果当前状态是connected，关闭连接
              if (c.status === 'connected' && c.client) {
                c.client.close();
              }
             
              // 创建新的配置对象，移除client字段
             
            }
            const { client, ...configWithoutClient } = config;
            console.log("configWithoutClient", client)
            return configWithoutClient;
          })
        })),
    }),
    {
      name: 'sse-storage',
      partialize: (state) => ({
        configs: state.configs.map(({ client, ...config }) => config)
      })
    }
  )
); 
