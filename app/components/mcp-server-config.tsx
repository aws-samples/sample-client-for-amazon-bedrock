import { useState } from "react";
import { Modal, ListItem, PasswordInput } from "./ui-lib";
import styles from "./settings.module.scss";
import { IconButton } from "./button";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useSSEStore,MCPServerConfig } from "../store/sse";


interface MCPServerConfigProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (config: MCPServerConfig) => void;
  config?: MCPServerConfig|null;
  action: "add" | "edit";
}



export function MCPServerConfigModal({ onClose, config,action }: MCPServerConfigProps) {
  const [configState, setConfigState] = useState<MCPServerConfig>(() => {
    if (config) {
      return { ...config };
    }
    return {
      name: "",
      transport: "sse",
      sseUrl: "http://localhost:3001/sse",
      authToken: "",
      status: "disconnected",
    };
  });

  const configs = useSSEStore((state) => state.configs)
  const addConfig = useSSEStore((state) => state.addConfig);
  const updateConfig = useSSEStore((state) => state.updateConfig);



  return (
    <div className="modal-mask">

      <Modal
        title={config ? "Edit MCP Server" : "Add MCP Server"}

        onClose={onClose}
        
      >
        <div className={styles["config-item"]}>
          <ListItem title="" subTitle="Transport">
            <select
              value={configState.transport}
              onChange={(e) => setConfigState({ ...configState, transport: e.target.value })}
              className={styles["select-input"]}
            >
              {/* <option value="stdio">stdio</option> */}
              <option value="sse">sse</option>
            </select>
          </ListItem>
        </div>
        <div className={styles["config-item"]}>
          <ListItem title="" subTitle="Server Name">
            <input
              type="text"
              disabled={action === "edit"}
              value={configState.name}
              onChange={(e) => setConfigState({ ...configState, name: e.currentTarget.value })}
              placeholder="Enter server name"
            />
          </ListItem>
        </div>
        
       
        {configState.transport === "sse" && (
          <div className={styles["mcp-server-config"]}>
            <ListItem title="" subTitle="SSE MCP Server URL">
              <input
                type="text"
                value={configState.sseUrl}
                onChange={(e) => setConfigState({ ...configState, sseUrl: e.currentTarget.value })}
              ></input>
            </ListItem>
            <ListItem title="" subTitle="SSE MCP Server Auth Token">
              <PasswordInput
                value={configState.authToken}
                onChange={(e) => {
                  setConfigState({ ...configState, authToken: e.currentTarget.value });
                }}
              ></PasswordInput>

            </ListItem>
          </div>
        )}
        <div className={styles["config-item"]}>
          <ListItem title="" subTitle="">


            <IconButton
              text="Test MCP Server"
              onClick={async () => {
                try {
                  const transport = new SSEClientTransport(new URL(configState.sseUrl));
                  transport.onmessage = (message: any) => {
                    console.log(message);
                  }

                  const client = new Client({
                    name: configState.name || "example-client",
                    version: "1.0.0",
                  }, {
                    capabilities: {}
                  });

                  await client.connect(transport);
                  const tools = await client.listTools();
                  console.log(tools);
                  configState.client = client;
                  configState.status = "connected";
                  if (action === "edit") {
                    updateConfig(configState);
                  } else {
                    addConfig(configState);
                  }
                  configs.map((config) => {
                    console.log(config.name,config.status)
                  })
                  onClose();

                  
                } catch (error) {
                  console.error("Failed to connect to MCP server:", error);
                }
              }}
              type="primary"
            />

          </ListItem>
        </div>

      </Modal>
    </div>
  );
} 