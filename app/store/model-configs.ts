import { LEGACY_MODEL_ALIASES, StoreKey, resolveModelName } from "../constant";
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
  defaultModel: "claude-sonnet-4.6", // matches DEFAULT_CONFIG.modelConfig.model
  currentConfigModel: "claude-sonnet-4.6",
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
    version: 2,
    migrate(persistedState, version) {
      const state = persistedState as any;
      if (version < 2) {
        // Built-in Claude 3 / 3.7 models reached end of life on Bedrock.
        state.defaultModel = resolveModelName(
          state.defaultModel ?? DEFAULT_MODEL_CONFIGS_STATE.defaultModel,
        );
        state.currentConfigModel = resolveModelName(
          state.currentConfigModel ?? state.defaultModel,
        );
        const configs = { ...(state.modelConfigs ?? {}) };
        for (const [oldName, newName] of Object.entries(LEGACY_MODEL_ALIASES)) {
          if (configs[oldName] && !configs[newName]) {
            configs[newName] = configs[oldName];
          }
          delete configs[oldName];
        }
        state.modelConfigs = configs;
      }
      return state;
    },
  },
);
