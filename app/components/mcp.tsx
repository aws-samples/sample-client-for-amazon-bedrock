import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";



import CloseIcon from "../icons/close.svg";
import ClearIcon from "../icons/clear.svg";
import EditIcon from "../icons/edit.svg";


import ConfigIcon from "../icons/config.svg";

import {
  List,
  ListItem,
  Switch,
} from "./ui-lib";

import { IconButton } from "./button";
import {
  useAccessStore,
} from "../store";

import { useSSEStore} from "../store/sse";

import Locale from "../locales";


import {
  Path,
  
} from "../constant";

import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { getClientConfig } from "../config/client";

import { MCPServerConfigModal } from "./mcp-server-config";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// 添加类型定义
interface MCPServerConfig {
  name: string;
  sseUrl: string;
  status: string;
  transport: string;
  client?: any; // 根据实际client类型调整
}

export function MCPSettings() {
  const navigate = useNavigate();

  const accessStore = useAccessStore();
  const configs = useSSEStore((state) => state.configs);
  const removeConfig = useSSEStore((state) => state.removeConfig);
  const addConfig = useSSEStore((state) => state.addConfig);
  const updateConfig = useSSEStore((state) => state.updateConfig);


 

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    if (clientConfig?.isApp) {
      // Force to set custom endpoint to true if it's app
      accessStore.update((state) => {
        state.useCustomConfig = true;
      });
    }
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MCPServerConfig | null>(null);

  const handleSaveConfig = (config: MCPServerConfig) => {
    if (editingConfig) {
      updateConfig(config);
    } else {
      addConfig(config);
    }
    setShowServerConfig(false);
    setEditingConfig(null);
  };

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
           MCP {Locale.Settings.Title} 
          </div>
          <div className="window-header-sub-title">
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button"></div>
          <div className="window-action-button"></div>
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <List>
        <ListItem
          title="Add MCP Server"
        >
          <div style={{ display: "flex" }}>
            <IconButton
              icon={<ConfigIcon />}
              text="Add MCP Server"
              onClick={() => setShowServerConfig(true)}
            />
            
          </div>
        </ListItem>
        </List>
        <List>
          {configs.map((config) => (
            <ListItem
              key={config.name}
              title={config.name || "SSE Store"}
              subTitle={[
                `Endpoint : ${config.sseUrl || ""}`,
                
              ]}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" , listStyle: "none"}}>
                <span>{config.status}</span>
                <Switch 
                  checked={config.status === "connected"}
                  onChange={async () => {
                    if (config.status === "connected") {
                      config.client?.close();
                      updateConfig({ ...config, status: "disconnected" });
                    } else {
                      try {
                        const transport = new SSEClientTransport(new URL(config.sseUrl));
                        transport.onmessage = (message: any) => {
                          console.log(message);
                        }
      
                        const client = new Client({
                          name: config.name ,
                          version: "1.0.0",
                        }, {
                          capabilities: {}
                        });
      
                        await client.connect(transport);
                        const tools = await client.listTools();
                        console.log(tools);
                        config.client = client;
                        updateConfig({ ...config, status: "connected" });
                        
                      } catch (error) {
                        console.error("Failed to connect to MCP server:", error);
                      }
                    
                      
                    }
                  }}
                />
              </div>
              <div style={{ display: "flex" }}>
                
                <IconButton 
                  icon={<EditIcon />} 
                  onClick={() => {
                    if(config){
                      setEditingConfig(config);
                      setShowServerConfig(true);
                    }
                    
                  }}
                />
                <IconButton 
                  icon={<ClearIcon />} 
                  onClick={() => {
                    config.client?.close();
                    removeConfig(config.name);
                  }} 
                />
              </div>
            </ListItem>
          ))}

        
        
        </List>
       

       
      </div>
      {showServerConfig && (
        <MCPServerConfigModal 
          isOpen={showServerConfig}
          onClose={() => {
            setShowServerConfig(false);
            setEditingConfig(null);
          }}
          config={editingConfig}
          action={editingConfig ? "edit" : "add"}
          onSave={handleSaveConfig}
        />
      )}
      
    </ErrorBoundary >
  );
}