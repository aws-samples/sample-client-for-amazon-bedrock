import { BaseChatIflytekXinghuo } from "./common.js";
import { WebSocketStreamOptions } from "../../utils/iflytek_websocket_stream.js";
/**
 * @example
 * ```typescript
 * const model = new ChatIflytekXinghuo();
 * const response = await model.invoke([new HumanMessage("Nice to meet you!")]);
 * console.log(response);
 * ```
 */
export declare class ChatIflytekXinghuo extends BaseChatIflytekXinghuo {
    openWebSocketStream<WebSocketStream>(options: WebSocketStreamOptions): Promise<WebSocketStream>;
}
