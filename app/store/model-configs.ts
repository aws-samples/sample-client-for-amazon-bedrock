import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";

export interface ModelSpecificConfig {
  region?: string; // empty string means use system region
}

export interface ModelConfigsState {
  modelConfigs: Record<string, ModelSpecificConfig>; // key: model name
  defaultModel: string; // the default model for new chats
  currentConfigModel: string; // currently displayed model in config panel
  
  getModelConfig: (modelName: string) => ModelSpecificConfig;
  updateModelConfig: (modelName: string, config: Partial<ModelSpecificConfig>) => void;
  setDefaultModel: (modelName: string) => void;
  setCurrentConfigModel: (modelName: string) => void;
  getEffectiveRegion: (modelName: string, systemRegion: string) => string;
}

const DEFAULT_MODEL_CONFIGS_STATE = {
  modelConfigs: {} as Record<string, ModelSpecificConfig>,
  defaultModel: "claude-3-sonnet", // matches DEFAULT_CONFIG.modelConfig.model
  currentConfigModel: "claude-3-sonnet",
};

export const useModelConfigsStore = createPersistStore(
  { ...DEFAULT_MODEL_CONFIGS_STATE },
  (set, get) => ({
    getModelConfig(modelName: string): ModelSpecificConfig {
      const state = get();
      return state.modelConfigs[modelName] || {};
    },

    updateModelConfig(modelName: string, config: Partial<ModelSpecificConfig>) {
      set((state) => ({
        modelConfigs: {
          ...state.modelConfigs,
          [modelName]: {
            ...state.modelConfigs[modelName],
            ...config,
          },
        },
      }));
    },

    setDefaultModel(modelName: string) {
      const currentState = get();
      // Only update if the model is actually different
      if (currentState.defaultModel !== modelName) {
        set(() => ({
          defaultModel: modelName,
        }));
      }
    },

    setCurrentConfigModel(modelName: string) {
      set(() => ({
        currentConfigModel: modelName,
      }));
    },

    getEffectiveRegion(modelName: string, systemRegion: string): string {
      const state = get();
      const modelConfig = state.modelConfigs[modelName];
      const modelSpecificRegion = modelConfig?.region;
      
      // Priority: model-specific > system > default
      return modelSpecificRegion || systemRegion || "us-west-2";
    },
  }),
  {
    name: StoreKey.ModelConfigs,
    version: 1,
  },
);
