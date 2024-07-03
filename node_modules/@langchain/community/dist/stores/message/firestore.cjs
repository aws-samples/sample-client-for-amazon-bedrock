"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreChatMessageHistory = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
/**
 * Class for managing chat message history using Google's Firestore as a
 * storage backend. Extends the BaseListChatMessageHistory class.
 * @example
 * ```typescript
 * const chatHistory = new FirestoreChatMessageHistory({
 *   collectionName: "langchain",
 *   sessionId: "lc-example",
 *   userId: "a@example.com",
 *   config: { projectId: "your-project-id" },
 * });
 *
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI(),
 *   memory: new BufferMemory({ chatHistory }),
 * });
 *
 * const response = await chain.invoke({
 *   input: "What did I just say my name was?",
 * });
 * console.log({ response });
 * ```
 */
class FirestoreChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
    constructor({ collectionName, collections, docs, sessionId, userId, appIdx = 0, config, }) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "firestore"]
        });
        Object.defineProperty(this, "collections", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "docs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "appIdx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "firestoreClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "document", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (collectionName && collections) {
            throw new Error("Can not pass in collectionName and collections. Please use collections only.");
        }
        if (!collectionName && !collections) {
            throw new Error("Must pass in a list of collections. Fields `collectionName` and `collections` are both undefined.");
        }
        if (collections || docs) {
            // This checks that the 'collections' and 'docs' arrays have the same length,
            // which means each collection has a corresponding document name. The only exception allowed is
            // when there is exactly one collection provided and 'docs' is not defined. In this case, it is
            // assumed that the 'sessionId' will be used as the document name for that single collection.
            if (!(collections?.length === docs?.length ||
                (collections?.length === 1 && !docs))) {
                throw new Error("Collections and docs options must have the same length, or collections must have a length of 1 if docs is not defined.");
            }
        }
        this.collections = collections || [collectionName];
        this.docs = docs || [sessionId];
        this.sessionId = sessionId;
        this.userId = userId;
        this.document = null;
        this.appIdx = appIdx;
        if (config)
            this.config = config;
        try {
            this.ensureFirestore();
        }
        catch (error) {
            throw new Error(`Unknown response type`);
        }
    }
    ensureFirestore() {
        let app;
        // Check if the app is already initialized else get appIdx
        if (!(0, app_1.getApps)().length)
            app = (0, app_1.initializeApp)(this.config);
        else
            app = (0, app_1.getApps)()[this.appIdx];
        this.firestoreClient = (0, firestore_1.getFirestore)(app);
        this.document = this.collections.reduce((acc, collection, index) => acc.collection(collection).doc(this.docs[index]), this.firestoreClient);
    }
    /**
     * Method to retrieve all messages from the Firestore collection
     * associated with the current session. Returns an array of BaseMessage
     * objects.
     * @returns Array of stored messages
     */
    async getMessages() {
        if (!this.document) {
            throw new Error("Document not initialized");
        }
        const querySnapshot = await this.document
            .collection("messages")
            .orderBy("createdAt", "asc")
            .get()
            .catch((err) => {
            throw new Error(`Unknown response type: ${err.toString()}`);
        });
        const response = [];
        querySnapshot.forEach((doc) => {
            const { type, data } = doc.data();
            response.push({ type, data });
        });
        return (0, messages_1.mapStoredMessagesToChatMessages)(response);
    }
    /**
     * Method to add a new message to the Firestore collection. The message is
     * passed as a BaseMessage object.
     * @param message The message to be added as a BaseMessage object.
     */
    async addMessage(message) {
        const messages = (0, messages_1.mapChatMessagesToStoredMessages)([message]);
        await this.upsertMessage(messages[0]);
    }
    async upsertMessage(message) {
        if (!this.document) {
            throw new Error("Document not initialized");
        }
        await this.document.set({
            id: this.sessionId,
            user_id: this.userId,
        }, { merge: true });
        await this.document
            .collection("messages")
            .add({
            type: message.type,
            data: message.data,
            createdBy: this.userId,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        })
            .catch((err) => {
            throw new Error(`Unknown response type: ${err.toString()}`);
        });
    }
    /**
     * Method to delete all messages from the Firestore collection associated
     * with the current session.
     */
    async clear() {
        if (!this.document) {
            throw new Error("Document not initialized");
        }
        await this.document
            .collection("messages")
            .get()
            .then((querySnapshot) => {
            querySnapshot.docs.forEach((snapshot) => {
                snapshot.ref.delete().catch((err) => {
                    throw new Error(`Unknown response type: ${err.toString()}`);
                });
            });
        })
            .catch((err) => {
            throw new Error(`Unknown response type: ${err.toString()}`);
        });
        await this.document.delete().catch((err) => {
            throw new Error(`Unknown response type: ${err.toString()}`);
        });
    }
}
exports.FirestoreChatMessageHistory = FirestoreChatMessageHistory;
