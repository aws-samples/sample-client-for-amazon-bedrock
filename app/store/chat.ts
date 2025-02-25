import { trimTopic, getMessageTextContent } from "../utils";

import {
  get as idb_get,
  set as idb_set,
  setMany as idb_setMany,
  del as idb_del,
  values as idb_values,
  clear as idb_clear,
  createStore as idb_createStore,
  set
} from 'idb-keyval' // can use anything: IndexedDB, Ionic Storage, etc.
import { createJSONStorage, StateStorage } from 'zustand/middleware'

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { createEmptyMask, Mask } from "./mask";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  ModelProvider,
  StoreKey,
  SUMMARIZE_MODEL,
  GEMINI_SUMMARIZE_MODEL,
} from "../constant";
import { ClientApi, RequestMessage, MultimodalContent, AttachmentDocument } from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { estimateTokenLength } from "../utils/token";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  metrics?: object;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

function getSummarizeModel(currentModel: string) {
  // if it is using gpt-* models, force to use 3.5 to summarize
  if (currentModel.startsWith("gpt")) {
    return SUMMARIZE_MODEL;
  }
  if (currentModel.startsWith("gemini-pro")) {
    return GEMINI_SUMMARIZE_MODEL;
  }
  return currentModel;
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toLocaleString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  lastAction: '',
  currentSessionIndex: 0,
};
const CURRENT_STORAGE_VERSION = 4.0

import { indexedDB as fakeIndexedDB } from "fake-indexeddb";

const createIDBStorage = () => {
  console.log("Creating IDBStorage")
  if (typeof indexedDB === "undefined") {
    global.indexedDB = fakeIndexedDB;
  }
  const idbChatSessionStore = idb_createStore('brclient-chat-store', 'sessions-store');
  const idbChatStorage: StateStorage = {
    getItem: async (name: string): Promise<any> => {
      console.log("get for key:", name)
      const stateInfoStr = localStorage.getItem("session-status")
      const stateInfo = stateInfoStr ? JSON.parse(stateInfoStr) : { currentSessionIndex: 0, version: CURRENT_STORAGE_VERSION, lastUpdateTime: 0 }

      if (name === StoreKey.Chat) { // get all state
        let sessions = await idb_values(idbChatSessionStore)
        const { currentSessionIndex, lastUpdateTime, version } = stateInfo

        const stateInLocal = localStorage.getItem(StoreKey.Chat) || ''
        if (stateInLocal && stateInLocal.length > 0) {

          // 删除 localStorage 中的记录，再将记录保存成比的key用于备份
          // 需要先删除，再保存，不然可能会出现保存文件大小超出 quota 的错误
          localStorage.removeItem(StoreKey.Chat)
          localStorage.setItem(StoreKey.Chat + '_bak', stateInLocal)

          const stateInHistory = JSON.parse(stateInLocal)
          const sessionsHistory: ChatSession[] = stateInHistory.state.sessions

          const migrateSessions: ChatSession[] = []
          sessionsHistory.map(itemOld => {
            if (!sessions.find(item => item.id == itemOld.id)) {
              migrateSessions.push(itemOld);
            }
          })
          if (migrateSessions.length > 0) {
            // update to IDB
            const entries: [string, ChatSession][] = migrateSessions.map(item => [item.id, item])
            await idb_setMany(entries, idbChatSessionStore)
            sessions = sessions.concat(migrateSessions)
          }
        }
        if (sessions.length == 0) { // 如果IDB和local-storage中均没有记录时，创建empty session
          sessions = [createEmptySession()]
        }
        const result = { state: { sessions, currentSessionIndex, lastUpdateTime }, version }
        console.log('result:', result)
        return result

      } else {
        const result = (await idb_get(name, idbChatSessionStore)) || null
        console.log('result:', result)
        return result
      }
    },
    setItem: async (name: string, value: any): Promise<void> => {
      const theState = value.state
      const { currentSessionIndex, lastAction, sessions } = theState

      // "clearSessions",
      // "selectSession",
      // "moveSession",
      // "newSession",
      // "importSession",
      // "nextSession",
      // "deleteSession",
      // "currentSession",
      // "updateMessage",
      // "resetSession",
      // "summarizeSession",
      // "updateStat",
      // "updateCurrentSession",
      // "clearAllData"

      if (lastAction == 'clearSessions') {
        idb_clear(idbChatSessionStore)
      } else if (lastAction == 'deleteSession') {
        // need to get deleted session from IndexedDB sessions, and delete from idb
        const sessionIdSet = new Set(sessions.map((item: any) => item.id));
        const sessionsInDB = await idb_values(idbChatSessionStore)

        const deletedSession = sessionsInDB.find((item: any) => !sessionIdSet.has(item.id))
        await idb_del(deletedSession.id, idbChatSessionStore)

      } else if (['restoreSession', 'importSessions'].indexOf(lastAction) >= 0) {
        // need to get deleted session from state sessions, and save to idb
        const sessionsInDB = await idb_values(idbChatSessionStore)
        const sessionIdSet = new Set(sessionsInDB.map(item => item.id));

        const sessionsToSave: ChatSession[] = []
        sessions.map((item: ChatSession) => {
          if (!(item.id in sessionIdSet)) {
            sessionsToSave.push(item)
          }
        })
        const entries: [string, ChatSession][] = sessionsToSave.map(item => [item.id, item])
        await idb_setMany(entries, idbChatSessionStore)

      } else if (['updateCurrentSession', 'importSession'].indexOf(lastAction) >= 0) { // update currentSession
        const currSession = sessions[currentSessionIndex]
        if (currSession) {
          await idb_set(currSession.id, currSession, idbChatSessionStore)
        }
      } else if ('updateCurrentSessionStream' == lastAction) {
        // getting response in stream, not update into IDB
        return
      }
      const lastUpdateTime = Date.now()
      localStorage.setItem("session-status", JSON.stringify({ currentSessionIndex, version: CURRENT_STORAGE_VERSION, lastUpdateTime }))
    },
    removeItem: async (name: string): Promise<void> => {
      console.log("remove for key:", name)
      await idb_del(name, idbChatSessionStore)
    },
  }

  const persistStorage = {
    getItem: (name: string) => {
      var _a;
      const parse = (str2: any) => {
        if (str2 === null) {
          return null;
        }
        return str2;
      };
      const str = (_a = idbChatStorage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name: string, newValue: any) => idbChatStorage.setItem(name, newValue),
    removeItem: (name: string) => idbChatStorage.removeItem(name)
  };
  return persistStorage;
}


export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      clearSessions() {
        set(() => ({
          lastAction: 'clearSessions',
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          lastAction: 'selectSession',
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            lastAction: 'moveSession',
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(mask?: Mask) {
        const session = createEmptySession();

        if (mask) {
          const config = useAppConfig.getState();
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...mask.modelConfig,
            },
          };
          session.topic = mask.name;
        }

        set((state) => ({
          lastAction: 'newSession',
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },

      importSession(session: any) {

        // init new session
        const newsession = createEmptySession();

        for (const message of session.messages) {
          let newMessage: ChatMessage = {
            id: message.id,
            role: message.role,
            content: message.content,
            date: message.date || '',
            model: message.model,
          };
          newsession.messages.push(newMessage);
        }
        newsession.lastUpdate = Date.now();

        set((state) => ({
          lastAction: 'importSession',
          currentSessionIndex: 0,
          sessions: [newsession].concat(state.sessions),
        }));

        get().summarizeSession();
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice(); // get a copy of the sessions array
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = 0;
          sessions.push(createEmptySession());
        }

        // for undo delete action
        const restoreState = {
          lastAction: 'restoreSession',
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          lastAction: 'deleteSession',
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
        );
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index, lastAction: 'updateCurrentSessionIndex', }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      async onUserInput(
        content: string,
        attachImages: string[],
        attachFile?: AttachmentDocument
      ) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        const userContent = fillTemplateWith(content, modelConfig);
        console.log("[User Input] after template: ", userContent);

        let mContent: string | MultimodalContent[] = userContent;


        if (attachImages && attachImages.length > 0) {
          mContent = [
            {
              type: "text",
              text: userContent,
            },
          ];
          mContent = mContent.concat(
            attachImages.map((url) => {
              return {
                type: "image_url",
                image_url: {
                  url: url,
                },
              };
            }),
          );
        }


        if (attachFile) {
          console.log(`have attachFile ${attachFile.name}`,)
          mContent = [
            {
              type: "text",
              text: userContent,
            },
          ];
          mContent = mContent.concat([
            {
              type: "doc",
              doc: attachFile,
            }]);
        }

        const loadFilelist = async (file: string) => {
          try {
            const response = await fetch(`/api/documents/list?file=${file}`);
            const contents = await response.json();
            return contents;
          } catch (error) {
            console.error("Error uploading file:", error);
          } finally {
            // cleanup
          }
        };

        // if (attachFile && attachFile !== "") {
        //   mContent = [
        //     {
        //       type: "text",
        //       text: userContent,
        //     },
        //   ];
        //   mContent = mContent.concat([
        //     { type: "text", text: JSON.stringify({ context: attachFile }) },
        //   ]);
        // }

        let userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
        });

        // get recent messages
        const recentMessages = get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });


        var api: ClientApi = new ClientApi(ModelProvider.Claude);
        // var api: ClientApi;
        // if (modelConfig.model.startsWith("claude")) {
        //   api = new ClientApi(ModelProvider.Claude);
        // } else {
        //   if (modelConfig.model.startsWith("gemini")) {
        //     api = new ClientApi(ModelProvider.GeminiPro);
        //   } else {
        //     api = new ClientApi(ModelProvider.GPT);
        //   }
        // }

        // make request
        api.llm.chat({
          messages: sendMessages,
          config: { ...modelConfig, stream: true },
          onUpdate(message) {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            // Need to update state to update UI
            get().updateCurrentSessionStream((session) => {
              session.messages = session.messages.concat();
            });
          },
          onFinish(message, metrics) {
            // console.log("[Chat response finished]: ", message);
            botMessage.streaming = false;
            if (message) {
              botMessage.content = message;
              get().onNewMessage(botMessage);
            }
            if (metrics) {
              botMessage.metrics = metrics;
            }
            // 已经在 get().onNewMessage() 中更新了 CurrentSession
            // get().updateCurrentSession((session) => {
            //   session.messages = session.messages.concat();
            // });
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onError(error) {
            const isAborted = error.message.includes("aborted");
            botMessage.content +=
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
            botMessage.streaming = false;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        return {
          role: "system",
          content:
            session.memoryPrompt.length > 0
              ? Locale.Store.Prompt.History(session.memoryPrompt)
              : "",
          date: "",
        } as ChatMessage;
      },

      getMessagesWithMemory() {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          session.mask.modelConfig.model.startsWith("gpt-");

        var systemPrompts: ChatMessage[] = [];
        systemPrompts = shouldInjectSystemPrompts
          ? [
            createMessage({
              role: "system",
              content: fillTemplateWith("", {
                ...modelConfig,
                template: DEFAULT_SYSTEM_TEMPLATE,
              }),
            }),
          ]
          : [];
        if (shouldInjectSystemPrompts) {
          console.log(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }

        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts = shouldSendLongTermMemory
          ? [get().getMemoryPrompt()]
          : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(getMessageTextContent(msg));
          reversedRecentMessages.push(msg);
        }

        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession() {
        const config = useAppConfig.getState();
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        var api: ClientApi = new ClientApi(ModelProvider.Claude);
        // var api: ClientApi;
        // if (modelConfig.model.startsWith("gemini")) {
        //   api = new ClientApi(ModelProvider.GeminiPro);
        // } else if (modelConfig.model.startsWith("claude")) {
        //   api = new ClientApi(ModelProvider.Claude);
        // } else {
        //   api = new ClientApi(ModelProvider.GPT);
        // }

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          config.enableAutoGenerateTitle &&
          session.topic === DEFAULT_TOPIC &&
          countMessages(messages) >= SUMMARIZE_MIN_LEN
        ) {
          const topicMessages = messages.concat(
            createMessage({
              role: "user",
              content: Locale.Store.Prompt.Topic,
            }),
          );
          api.llm.chat({
            messages: topicMessages,
            config: {
              model: getSummarizeModel(session.mask.modelConfig.model),
            },
            onFinish(message) {
              get().updateCurrentSession(
                (session) =>
                (session.topic =
                  message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
              );
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > modelConfig?.max_tokens ?? 4000) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }

        // add memory prompt
        toBeSummarizedMsgs.unshift(get().getMemoryPrompt());

        const lastSummarizeIndex = session.messages.length;

        console.log(
          "[Chat History] ",
          toBeSummarizedMsgs,
          historyMsgLength,
          modelConfig.compressMessageLengthThreshold,
        );

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...modelConfig,
              stream: true,
              model: getSummarizeModel(session.mask.modelConfig.model),
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message) {
              console.log("[Memory] ", message);
              get().updateCurrentSession((session) => {
                session.lastSummarizeIndex = lastSummarizeIndex;
                session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
              });
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }
      },

      updateStat(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },
      updateCurrentSessionStream(updater: (session: ChatSession) => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions, lastAction: 'updateCurrentSessionStream' }));
      },
      updateCurrentSession(updater: (session: ChatSession) => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        // will update storage here
        set(() => ({ sessions, lastAction: 'updateCurrentSession' }));
      },

      clearAllData() {
        localStorage.clear();
        location.reload();
        set(() => ({
          lastAction: 'clearSessions',
          currentSessionIndex: 0,
          sessions: [],
        }));
      },
    };
    return methods;
  },
  {
    name: StoreKey.Chat,
    version: CURRENT_STORAGE_VERSION,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      return newState as any;
    },
    storage: createIDBStorage(),
  },
);