import {
  ModalConfigValidator, ModelConfig, useAppConfig, useAccessStore,
} from "../store";
import { getServerSideConfig } from "../config/server";
import { useEffect, useState, useRef } from "react";
import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
// import { useAllModels } from "../utils/hooks";
import { IconButton } from "./button";
import ResetIcon from "../icons/reload.svg";
import UploadIcon from "../icons/upload.svg";
import { LLMModel } from "../client/api";
import { DEFAULT_MODELS } from "@/app/constant";

// 每个模型的特定配置定义
const MODEL_SPECIFIC_CONFIGS = {
  "claude-3.7-sonnet": {
    hasReasoning: true,
  },
};

// 默认配置
const DEFAULT_MODEL_CONFIG = {
  hasReasoning: false,
};

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const appConfig = useAppConfig();
  const accessStore = useAccessStore();

  const { provider, useBRProxy, BRProxyUrl, openaiApiKey } = accessStore;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取当前模型的特定配置
  const getModelConfig = (modelName: string) => {
    // 查找完全匹配
    if (MODEL_SPECIFIC_CONFIGS[modelName as keyof typeof MODEL_SPECIFIC_CONFIGS]) {
      return {
        ...DEFAULT_MODEL_CONFIG,
        ...MODEL_SPECIFIC_CONFIGS[modelName as keyof typeof MODEL_SPECIFIC_CONFIGS]
      };
    }
    
    // 查找部分匹配
    for (const key in MODEL_SPECIFIC_CONFIGS) {
      if (modelName.includes(key)) {
        return {
          ...DEFAULT_MODEL_CONFIG,
          ...MODEL_SPECIFIC_CONFIGS[key as keyof typeof MODEL_SPECIFIC_CONFIGS]
        };
      }
    }
    
    // 没有匹配，返回默认配置
    return { ...DEFAULT_MODEL_CONFIG };
  };
  
  const [modelSpecificConfig, setModelSpecificConfig] = useState(getModelConfig(props.modelConfig.model));
  
  // 当模型变化时更新特定配置
  useEffect(() => {
    setModelSpecificConfig(getModelConfig(props.modelConfig.model));
  }, [props.modelConfig.model]);

  useEffect(() => {
    const storedModels: LLMModel[] = appConfig.models;
    if (
      !storedModels ||
      storedModels.length === 0 ||
      !storedModels[0].displayName
    ) {
      appConfig.update(
        (config) => (config.models = DEFAULT_MODELS as any as LLMModel[]),
      );
    }
  });

  // Handle file selection and loading
  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("[JSON Config Debug] Starting to load file:", file.name, "Size:", file.size, "bytes");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        console.log("[JSON Config Debug] File content length:", content.length);
        console.log("[JSON Config Debug] Raw file content:", content.substring(0, 500) + (content.length > 500 ? "..." : ""));

        const remote_models = JSON.parse(content);
        console.log("[JSON Config Debug] Parsed JSON successfully. Number of models:", Array.isArray(remote_models) ? remote_models.length : "Not an array");
        console.log("[JSON Config Debug] Parsed models structure:", remote_models);

        // Check if models have support_streaming field
        if (Array.isArray(remote_models)) {
          remote_models.forEach((model, index) => {
            console.log(`[JSON Config Debug] Model ${index}:`, {
              name: model.name,
              displayName: model.displayName,
              support_streaming: model.support_streaming,
              available: model.available,
              provider: model.provider
            });
          });
        }

        // Get current config before update
        const currentConfig = appConfig;
        console.log("[JSON Config Debug] Current config models before update:", currentConfig.models.length);

        appConfig.update(
          (config) => {
            console.log("[JSON Config Debug] Updating config.models...");
            config.models = remote_models as any as LLMModel[];
            console.log("[JSON Config Debug] Config updated. New models count:", config.models.length);

            // Check if current model exists in new models and update its support_streaming
            const currentModelName = config.modelConfig.model;
            const currentModelInNewList = remote_models.find((m: any) => m.name === currentModelName);

            if (currentModelInNewList && currentModelInNewList.support_streaming !== undefined) {
              console.log("[JSON Config Debug] Updating global modelConfig.support_streaming for current model:", currentModelName);
              console.log("[JSON Config Debug] Old support_streaming:", config.modelConfig.support_streaming);
              console.log("[JSON Config Debug] New support_streaming:", currentModelInNewList.support_streaming);

              config.modelConfig.support_streaming = currentModelInNewList.support_streaming;

              console.log("[JSON Config Debug] Global modelConfig updated:", {
                model: config.modelConfig.model,
                support_streaming: config.modelConfig.support_streaming
              });
            } else {
              console.log("[JSON Config Debug] Current model not found in new list or no support_streaming defined");
            }
          }
        );

        // Verify the update
        setTimeout(() => {
          const updatedConfig = appConfig;
          console.log("[JSON Config Debug] Verification - Updated config models:", updatedConfig.models.length);
          updatedConfig.models.forEach((model, index) => {
            console.log(`[JSON Config Debug] Verification - Model ${index}:`, {
              name: model.name,
              displayName: model.displayName,
              support_streaming: (model as any).support_streaming,
              available: model.available
            });
          });
        }, 100);

        console.log("[JSON Config Debug] Models loaded from file successfully");
      } catch (error) {
        console.error("[JSON Config Debug] Error parsing JSON file:", error);
        alert("Error: Invalid JSON file format");
      }
    };

    reader.onerror = (error) => {
      console.error("[JSON Config Debug] FileReader error:", error);
    };

    reader.readAsText(file);

    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <ListItem title={Locale.Settings.Model}>
        <div className="password-input-container">
          <Select
            value={props.modelConfig.model}
            onChange={(e) => {
              const newModelName = e.currentTarget.value;
              console.log("[Model Selection Debug] Model changed to:", newModelName);

              // Find the selected model in the available models
              const selectedModel = appConfig.models.find(m => m.name === newModelName);
              console.log("[Model Selection Debug] Selected model object:", selectedModel);
              console.log("[Model Selection Debug] Selected model support_streaming:", (selectedModel as any)?.support_streaming);

              props.updateConfig(
                (config) => {
                  console.log("[Model Selection Debug] Before update - config.model:", config.model);
                  console.log("[Model Selection Debug] Before update - config.support_streaming:", config.support_streaming);
                  config.model = ModalConfigValidator.model(newModelName);

                  // Auto-update support_streaming based on model definition
                  if (selectedModel && (selectedModel as any).support_streaming !== undefined) {
                    const newStreamingValue = (selectedModel as any).support_streaming;
                    console.log("[Model Selection Debug] Auto-updating support_streaming from model definition:", newStreamingValue);
                    config.support_streaming = newStreamingValue;
                  }

                  console.log("[Model Selection Debug] After update - config.model:", config.model);
                  console.log("[Model Selection Debug] After update - config.support_streaming:", config.support_streaming);
                }
              );
              // 更新模型特定配置
              setModelSpecificConfig(getModelConfig(newModelName));
            }}
          >
            {appConfig.models
              .filter((v) => v.available)
              .map((v, i) => (
                <option value={v.name} key={i}>
                  {v.displayName || v.name}({v.provider?.providerName})
                </option>
              ))}
          </Select>


          <IconButton
            onClick={async () => {
              try {
                const http_headers: any = {
                };
                let model_url = "https://www.agentnumber47.com/bedrock/bedrock-models.json";
                if (provider === "AWS" && useBRProxy === "True") {
                  http_headers["Authorization"] = `Bearer ${openaiApiKey}`;
                  model_url = BRProxyUrl + "/user/model/list-for-brclient?f=";
                }

                const response = await fetch(
                  model_url + "?f=" + new Date().getTime().toString(),
                  {
                    method: 'GET',
                    headers: http_headers,
                  },
                );
                let remote_models = await response.json();
                if (provider === "AWS" && useBRProxy === "True") {
                  remote_models = remote_models.data;
                }
                appConfig.update(
                  (config) =>
                    (config.models = remote_models as any as LLMModel[]),
                );
              } catch (e) {
                console.error(e);
              }
            }}
            icon={<ResetIcon />}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileLoad}
            accept=".json"
            style={{ display: 'none' }}
          />

          <IconButton
            onClick={() => {
              fileInputRef.current?.click();
            }}
            icon={<UploadIcon />}
            title="Load models from local JSON file"
          />

        </div>
      </ListItem>
      <ListItem
        title={Locale.Settings.Temperature.Title}
        subTitle={Locale.Settings.Temperature.SubTitle}
      >
        <InputRange
          value={props.modelConfig.temperature?.toFixed(1)}
          min="0"
          max="1" // lets limit it to 0-1
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
              (config.temperature = ModalConfigValidator.temperature(
                e.currentTarget.valueAsNumber,
              )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.TopP.Title}
        subTitle={Locale.Settings.TopP.SubTitle}
      >
        <InputRange
          value={(props.modelConfig.top_p ?? 1).toFixed(1)}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
              (config.top_p = ModalConfigValidator.top_p(
                e.currentTarget.valueAsNumber,
              )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.MaxTokens.Title}
        subTitle={Locale.Settings.MaxTokens.SubTitle}
      >
        <input
          type="number"
          min={1024}
          max={512000}
          value={props.modelConfig.max_tokens}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
              (config.max_tokens = ModalConfigValidator.max_tokens(
                e.currentTarget.valueAsNumber,
              )),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.InjectSystemPrompts.Title}
        subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
      >
        <input
          type="checkbox"
          checked={props.modelConfig.enableInjectSystemPrompts}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
              (config.enableInjectSystemPrompts =
                e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>

      <ListItem
        title="Support Streaming"
        subTitle="Enable streaming responses for real-time output"
      >
        <input
          type="checkbox"
          checked={props.modelConfig.support_streaming ?? false}
          onChange={(e) => {
            const newValue = e.currentTarget.checked;
            console.log("[Support Streaming Debug] Checkbox changed to:", newValue);
            console.log("[Support Streaming Debug] Current model:", props.modelConfig.model);

            props.updateConfig(
              (config) => {
                console.log("[Support Streaming Debug] Before update:", config.support_streaming);
                config.support_streaming = newValue;
                console.log("[Support Streaming Debug] After update:", config.support_streaming);
              }
            );
          }}
        ></input>
      </ListItem>

      <ListItem
        title={Locale.Settings.InputTemplate.Title}
        subTitle={Locale.Settings.InputTemplate.SubTitle}
      >
        <input
          type="text"
          value={props.modelConfig.template}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.template = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>

      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
              (config.compressMessageLengthThreshold =
                e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {/* 添加 Reasoning Config 配置项 */}
      {modelSpecificConfig.hasReasoning && (
        <>
          <ListItem
            title={Locale.Settings.Reasoning.Title}
            subTitle={Locale.Settings.Reasoning.SubTitle}
          >
            <Select
              value={props.modelConfig.reasoning_config?.type || "disabled"}
              onChange={(e) => {
                const type = e.currentTarget.value as "enabled" | "disabled";
                props.updateConfig((config) => {
                  // 确保 reasoning_config 存在
                  if (!config.reasoning_config) {
                    config.reasoning_config = {
                      type,
                      budget_tokens: Math.min(1024, config.max_tokens - 1)
                    };
                  } else {
                    config.reasoning_config.type = type;
                  }
                });
              }}
            >
              <option value="enabled">{Locale.Settings.Reasoning.Type.Enabled}</option>
              <option value="disabled">{Locale.Settings.Reasoning.Type.Disabled}</option>
            </Select>
          </ListItem>

          {props.modelConfig.reasoning_config?.type === "enabled" && (
            <ListItem
              title={Locale.Settings.ReasoningBudget.Title}
              subTitle={Locale.Settings.ReasoningBudget.SubTitle}
            >
              <input
                type="number"
                min={1024}
                max={props.modelConfig.max_tokens - 1}
                value={props.modelConfig.reasoning_config?.budget_tokens || 1024}
                onChange={(e) => {
                  const value = parseInt(e.currentTarget.value);
                  const safeValue = Math.max(1024, Math.min(value, props.modelConfig.max_tokens - 1));
                  
                  props.updateConfig((config) => {
                    if (config.reasoning_config) {
                      config.reasoning_config.budget_tokens = safeValue;
                    }
                  });
                }}
              />
            </ListItem>
          )}
        </>
      )}
    </>
  );
}
