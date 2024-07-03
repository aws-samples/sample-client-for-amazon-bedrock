/**
 * Module for utilities related to websocket connection establishment
 *
 * @packageDocumentation
 * @module ws
 * @mergeTarget
 */
import { MqttConnectionConfig } from "./mqtt";
import * as mqtt5 from "./mqtt5";
import { WebsocketOptionsBase } from "../common/auth";
/**
 * Options for websocket based connections in browser
 *
 * @category MQTT
 */
export interface WebsocketOptions extends WebsocketOptionsBase {
    /** Additional headers to add */
    headers?: {
        [index: string]: string;
    };
    /** Websocket protocol, used during Upgrade */
    protocol?: string;
}
/** @internal */
export declare function create_websocket_url(config: MqttConnectionConfig): string;
/** @internal */
export declare function create_websocket_stream(config: MqttConnectionConfig): any;
/** @internal */
export declare function create_mqtt5_websocket_url(config: mqtt5.Mqtt5ClientConfig): string;
/** @internal */
export declare function create_mqtt5_websocket_stream(config: mqtt5.Mqtt5ClientConfig): any;
