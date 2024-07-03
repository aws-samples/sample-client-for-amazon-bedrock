
/**
 * @packageDocumentation
 * @module mqtt5
 */

import * as mqtt from "mqtt";
import * as mqtt_shared from "../common/mqtt_shared";
import * as mqtt5 from "./mqtt5";
import * as utils from "../common/utils";
import { CrtError } from "./error";

export const MAXIMUM_VARIABLE_LENGTH_INTEGER : number= 268435455;
export const MAXIMUM_PACKET_SIZE : number = 5 + MAXIMUM_VARIABLE_LENGTH_INTEGER;
export const DEFAULT_RECEIVE_MAXIMUM : number = 65535;
export const DEFAULT_CONNECT_TIMEOUT_MS : number = 30000;
export const DEFAULT_MIN_RECONNECT_DELAY_MS : number = 1000;
export const DEFAULT_MAX_RECONNECT_DELAY_MS : number = 120000;
export const DEFAULT_MIN_CONNECTED_TIME_TO_RESET_RECONNECT_DELAY_MS : number = 30000;

/** @internal */
export function transform_mqtt_js_connack_to_crt_connack(mqtt_js_connack: mqtt.IConnackPacket) : mqtt5.ConnackPacket {
    if (mqtt_js_connack == null || mqtt_js_connack == undefined) {
        throw new CrtError("transform_mqtt_js_connack_to_crt_connack: mqtt_js_connack not defined");
    }

    let connack : mqtt5.ConnackPacket =  {
        type: mqtt5.PacketType.Connack,
        sessionPresent: mqtt_js_connack.sessionPresent,
        reasonCode : mqtt_js_connack.reasonCode ?? mqtt5.ConnectReasonCode.Success
    };

    utils.set_defined_property(connack, "sessionExpiryInterval", mqtt_js_connack.properties?.sessionExpiryInterval);
    utils.set_defined_property(connack, "receiveMaximum", mqtt_js_connack.properties?.receiveMaximum);
    utils.set_defined_property(connack, "maximumQos", mqtt_js_connack.properties?.maximumQoS);
    utils.set_defined_property(connack, "retainAvailable", mqtt_js_connack.properties?.retainAvailable);
    utils.set_defined_property(connack, "maximumPacketSize", mqtt_js_connack.properties?.maximumPacketSize);
    utils.set_defined_property(connack, "assignedClientIdentifier", mqtt_js_connack.properties?.assignedClientIdentifier);
    utils.set_defined_property(connack, "topicAliasMaximum", mqtt_js_connack.properties?.topicAliasMaximum);
    utils.set_defined_property(connack, "reasonString", mqtt_js_connack.properties?.reasonString);
    utils.set_defined_property(connack, "userProperties", transform_mqtt_js_user_properties_to_crt_user_properties(mqtt_js_connack.properties?.userProperties));
    utils.set_defined_property(connack, "wildcardSubscriptionsAvailable", mqtt_js_connack.properties?.wildcardSubscriptionAvailable);
    utils.set_defined_property(connack, "subscriptionIdentifiersAvailable", mqtt_js_connack.properties?.subscriptionIdentifiersAvailable);
    utils.set_defined_property(connack, "sharedSubscriptionsAvailable", mqtt_js_connack.properties?.sharedSubscriptionAvailable);
    utils.set_defined_property(connack, "serverKeepAlive", mqtt_js_connack.properties?.serverKeepAlive);
    utils.set_defined_property(connack, "responseInformation", mqtt_js_connack.properties?.responseInformation);
    utils.set_defined_property(connack, "serverReference", mqtt_js_connack.properties?.serverReference);

    return connack;
}

/** @internal */
export function create_negotiated_settings(config : mqtt5.Mqtt5ClientConfig, connack: mqtt5.ConnackPacket) : mqtt5.NegotiatedSettings {
    if (config == null || config == undefined) {
        throw new CrtError("create_negotiated_settings: config not defined");
    }
    if (connack == null || connack == undefined) {
        throw new CrtError("create_negotiated_settings: connack not defined");
    }

    return {
        maximumQos: Math.min(connack.maximumQos ?? mqtt5.QoS.ExactlyOnce, mqtt5.QoS.AtLeastOnce),
        sessionExpiryInterval: connack.sessionExpiryInterval ?? config.connectProperties?.sessionExpiryIntervalSeconds ?? 0,
        receiveMaximumFromServer: connack.receiveMaximum ?? DEFAULT_RECEIVE_MAXIMUM,
        maximumPacketSizeToServer: connack.maximumPacketSize ?? MAXIMUM_PACKET_SIZE,
        topicAliasMaximumToServer: Math.min(config.topicAliasingOptions?.outboundCacheMaxSize ?? 0, connack.topicAliasMaximum ?? 0),
        topicAliasMaximumToClient: config.topicAliasingOptions?.inboundCacheMaxSize ?? 0,
        serverKeepAlive: connack.serverKeepAlive ?? config.connectProperties?.keepAliveIntervalSeconds ?? mqtt_shared.DEFAULT_KEEP_ALIVE,
        retainAvailable: connack.retainAvailable ?? true,
        wildcardSubscriptionsAvailable: connack.wildcardSubscriptionsAvailable ?? true,
        subscriptionIdentifiersAvailable: connack.subscriptionIdentifiersAvailable ?? true,
        sharedSubscriptionsAvailable: connack.sharedSubscriptionsAvailable ?? true,
        rejoinedSession: connack.sessionPresent,
        clientId: connack.assignedClientIdentifier ?? config.connectProperties?.clientId ?? ""
    };
}

/** @internal */
function create_mqtt_js_will_from_crt_config(connectProperties? : mqtt5.ConnectPacket) : any {
    if (!connectProperties || !connectProperties.will) {
        return undefined;
    }

    let crtWill : mqtt5.PublishPacket = connectProperties.will;

    let hasWillProperties : boolean = false;
    let willProperties : any = {};
    hasWillProperties = utils.set_defined_property(willProperties, "willDelayInterval", connectProperties.willDelayIntervalSeconds) || hasWillProperties;
    if (crtWill.payloadFormat !== undefined) {
        hasWillProperties = utils.set_defined_property(willProperties, "payloadFormatIndicator", crtWill.payloadFormat == mqtt5.PayloadFormatIndicator.Utf8) || hasWillProperties;
    }
    hasWillProperties = utils.set_defined_property(willProperties, "messageExpiryInterval", crtWill.messageExpiryIntervalSeconds) || hasWillProperties;
    hasWillProperties = utils.set_defined_property(willProperties, "contentType", crtWill.contentType) || hasWillProperties;
    hasWillProperties = utils.set_defined_property(willProperties, "responseTopic", crtWill.responseTopic) || hasWillProperties;
    hasWillProperties = utils.set_defined_property(willProperties, "correlationData", crtWill.correlationData) || hasWillProperties;
    hasWillProperties = utils.set_defined_property(willProperties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(crtWill.userProperties)) || hasWillProperties;

    let will : any = {
        topic: crtWill.topicName,
        payload: crtWill.payload ?? "",
        qos: crtWill.qos,
        retain: crtWill.retain ?? false
    };

    if (hasWillProperties) {
        will["properties"] = willProperties;
    }

    return will;
}

/** @internal */
export function getOrderedReconnectDelayBounds(configMin?: number, configMax?: number) : [number, number] {
    const minDelay : number = Math.max(1, configMin ?? DEFAULT_MIN_RECONNECT_DELAY_MS);
    const maxDelay : number = Math.max(1, configMax ?? DEFAULT_MAX_RECONNECT_DELAY_MS);
    if (minDelay > maxDelay) {
        return [maxDelay, minDelay];
    } else {
        return [minDelay, maxDelay];
    }
}

/** @internal */
function should_mqtt_js_use_clean_start(session_behavior? : mqtt5.ClientSessionBehavior) : boolean {
    return session_behavior !== mqtt5.ClientSessionBehavior.RejoinPostSuccess && session_behavior !== mqtt5.ClientSessionBehavior.RejoinAlways;
}

/** @internal */
export function compute_mqtt_js_reconnect_delay_from_crt_max_delay(maxReconnectDelayMs : number) : number {
    /*
     * This is an attempt to guarantee that the mqtt-js will never try to reconnect on its own and instead always
     * be controlled by our reconnection scheduler logic.
     */
    return maxReconnectDelayMs * 2 + 60000;
}

function validate_required_uint16(propertyName : string, value: number) {
    if (value < 0 || value > 65535) {
        throw new CrtError(`Invalid value for property ${propertyName}: ` + value);
    }
}

function validate_optional_uint16(propertyName : string, value?: number) {
    if (value !== undefined) {
        validate_required_uint16(propertyName, value);
    }
}

function validate_required_uint32(propertyName : string, value: number) {
    if (value < 0 || value >= 4294967296) {
        throw new CrtError(`Invalid value for property ${propertyName}: ` + value);
    }
}

function validate_optional_uint32(propertyName : string, value?: number) {
    if (value !== undefined) {
        validate_required_uint32(propertyName, value);
    }
}

function validate_required_nonnegative_uint32(propertyName : string, value: number) {
    if (value <= 0 || value >= 4294967296) {
        throw new CrtError(`Invalid value for property ${propertyName}: ` + value);
    }
}

function validate_optional_nonnegative_uint32(propertyName : string, value?: number) {
    if (value !== undefined) {
        validate_required_nonnegative_uint32(propertyName, value);
    }
}

function validate_mqtt5_client_config(crtConfig : mqtt5.Mqtt5ClientConfig) {
    if (crtConfig == null || crtConfig == undefined) {
        throw new CrtError("validate_mqtt5_client_config: crtConfig not defined");
    }
    validate_required_uint16("keepAliveIntervalSeconds", crtConfig.connectProperties?.keepAliveIntervalSeconds ?? 0);
    validate_optional_uint32("sessionExpiryIntervalSeconds", crtConfig.connectProperties?.sessionExpiryIntervalSeconds);
    validate_optional_uint16("receiveMaximum", crtConfig.connectProperties?.receiveMaximum);
    validate_optional_nonnegative_uint32("maximumPacketSizeBytes", crtConfig.connectProperties?.maximumPacketSizeBytes);
    validate_optional_uint32("willDelayIntervalSeconds", crtConfig.connectProperties?.willDelayIntervalSeconds);
}

/** @internal */
export function create_mqtt_js_client_config_from_crt_client_config(crtConfig : mqtt5.Mqtt5ClientConfig) : mqtt.IClientOptions {

    validate_mqtt5_client_config(crtConfig);

    let [_, maxDelay] = getOrderedReconnectDelayBounds(crtConfig.minReconnectDelayMs, crtConfig.maxReconnectDelayMs);

    maxDelay = compute_mqtt_js_reconnect_delay_from_crt_max_delay(maxDelay);

    let mqttJsClientConfig : mqtt.IClientOptions = {
        protocolVersion: 5,
        keepalive: crtConfig.connectProperties?.keepAliveIntervalSeconds ?? mqtt_shared.DEFAULT_KEEP_ALIVE,
        connectTimeout: crtConfig.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
        clean: should_mqtt_js_use_clean_start(crtConfig.sessionBehavior),
        reconnectPeriod: maxDelay,
        // @ts-ignore
        autoUseTopicAlias : false,
        // @ts-ignore
        autoAssignTopicAlias : false,
        queueQoSZero : false,
        transformWsUrl: undefined, /* TODO */
        resubscribe : false
    };

    let topic_aliasing_options = crtConfig.topicAliasingOptions;
    if (topic_aliasing_options) {
        switch (topic_aliasing_options.outboundBehavior ?? mqtt5.OutboundTopicAliasBehaviorType.Default) {
            case mqtt5.OutboundTopicAliasBehaviorType.LRU:
                // @ts-ignore
                mqttJsClientConfig.autoUseTopicAlias = true;
                // @ts-ignore
                mqttJsClientConfig.autoAssignTopicAlias = true;
                break;

            case mqtt5.OutboundTopicAliasBehaviorType.Manual:
                // @ts-ignore
                mqttJsClientConfig.autoUseTopicAlias = true;
                break;

            default:
                break;
        }
    }

    /*
     * If you leave clientId undefined, mqtt-js will make up some weird thing for you, but the intent is that it
     * should pass the empty client id so that the server assigns you one.
     */
    utils.set_defined_property(mqttJsClientConfig, "clientId", crtConfig.connectProperties?.clientId ?? "");
    utils.set_defined_property(mqttJsClientConfig, "username", crtConfig.connectProperties?.username);
    utils.set_defined_property(mqttJsClientConfig, "password", crtConfig.connectProperties?.password);
    utils.set_defined_property(mqttJsClientConfig, "will", create_mqtt_js_will_from_crt_config(crtConfig.connectProperties));

    let hasProperties : boolean = false;
    let properties: any = {};
    hasProperties = utils.set_defined_property(properties, "sessionExpiryInterval", crtConfig.connectProperties?.sessionExpiryIntervalSeconds) || hasProperties;
    hasProperties = utils.set_defined_property(properties, "receiveMaximum", crtConfig.connectProperties?.receiveMaximum) || hasProperties;
    hasProperties = utils.set_defined_property(properties, "maximumPacketSize", crtConfig.connectProperties?.maximumPacketSizeBytes) || hasProperties;
    hasProperties = utils.set_defined_property(properties, "requestResponseInformation", crtConfig.connectProperties?.requestResponseInformation) || hasProperties;
    hasProperties = utils.set_defined_property(properties, "requestProblemInformation", crtConfig.connectProperties?.requestProblemInformation) || hasProperties;
    hasProperties = utils.set_defined_property(properties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(crtConfig.connectProperties?.userProperties)) || hasProperties;

    if (hasProperties) {
        mqttJsClientConfig["properties"] = properties;
    }

    return mqttJsClientConfig;
}

/** @internal */
export function transform_crt_user_properties_to_mqtt_js_user_properties(userProperties?: mqtt5.UserProperty[]) : mqtt.UserProperties | undefined {
    if (!userProperties) {
        return undefined;
    }

    /*
     * More restricted version of mqtt.UserProperties so that we can have type-checking but don't need to handle
     * the non-array case.
     */
    let mqttJsProperties : {[key : string] : string[] } = {};

    for (const property of userProperties) {
        const key : string = property.name;
        if (!(key in mqttJsProperties)) {
            mqttJsProperties[key] = [];
        }
        mqttJsProperties[key].push(property.value);
    }

    return mqttJsProperties;
}

/** @internal */
export function transform_mqtt_js_user_properties_to_crt_user_properties(userProperties?: mqtt.UserProperties) : mqtt5.UserProperty[] | undefined {
    if (!userProperties) {
        return undefined;
    }

    let crtProperties : mqtt5.UserProperty[] | undefined = undefined;

    for (const [propName, propValue] of Object.entries(userProperties)) {

        let values : string[] = (typeof propValue === 'string') ? [propValue] : propValue;
        for (const valueIter of values) {
            let propertyEntry = {name : propName, value : valueIter};
            if (!crtProperties) {
                crtProperties = [propertyEntry];
            } else {
                crtProperties.push(propertyEntry);
            }
        }
    }

    return crtProperties;
}

function validate_crt_disconnect(disconnect: mqtt5.DisconnectPacket) {
    if (disconnect == null || disconnect == undefined) {
        throw new CrtError("validate_crt_disconnect: disconnect not defined");
    }
    validate_optional_uint32("sessionExpiryIntervalSeconds", disconnect.sessionExpiryIntervalSeconds);
}

/** @internal */
export function transform_crt_disconnect_to_mqtt_js_disconnect(disconnect: mqtt5.DisconnectPacket) : mqtt.IDisconnectPacket {

    validate_crt_disconnect(disconnect);

    let properties = {};
    let propertiesValid : boolean = false;

    propertiesValid = utils.set_defined_property(properties, "sessionExpiryInterval", disconnect.sessionExpiryIntervalSeconds) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "reasonString", disconnect.reasonString) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(disconnect.userProperties)) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "serverReference", disconnect.serverReference) || propertiesValid;

    let mqttJsDisconnect : mqtt.IDisconnectPacket = {
        cmd: 'disconnect',
        reasonCode : disconnect.reasonCode
    };

    if (propertiesValid) {
        mqttJsDisconnect["properties"] = properties;
    }

    return mqttJsDisconnect;
}

/** @internal **/
export function transform_mqtt_js_disconnect_to_crt_disconnect(disconnect: mqtt.IDisconnectPacket) : mqtt5.DisconnectPacket {

    if (disconnect == null || disconnect == undefined) {
        throw new CrtError("transform_mqtt_js_disconnect_to_crt_disconnect: disconnect not defined");
    }

    let crtDisconnect : mqtt5.DisconnectPacket = {
        type: mqtt5.PacketType.Disconnect,
        reasonCode : disconnect.reasonCode ?? mqtt5.DisconnectReasonCode.NormalDisconnection
    };

    utils.set_defined_property(crtDisconnect, "sessionExpiryIntervalSeconds", disconnect.properties?.sessionExpiryInterval);
    utils.set_defined_property(crtDisconnect, "reasonString", disconnect.properties?.reasonString);
    utils.set_defined_property(crtDisconnect, "userProperties", transform_mqtt_js_user_properties_to_crt_user_properties(disconnect.properties?.userProperties));
    utils.set_defined_property(crtDisconnect, "serverReference", disconnect.properties?.serverReference);

    return crtDisconnect;
}

function validate_crt_subscribe(subscribe: mqtt5.SubscribePacket) {
    if (subscribe == null || subscribe == undefined) {
        throw new CrtError("validate_crt_subscribe: subscribe not defined");
    }
    validate_optional_uint32("subscriptionIdentifier", subscribe.subscriptionIdentifier);
}

/** @internal **/
export function transform_crt_subscribe_to_mqtt_js_subscription_map(subscribe: mqtt5.SubscribePacket) : mqtt.ISubscriptionMap {

    validate_crt_subscribe(subscribe);

    let subscriptionMap : mqtt.ISubscriptionMap = {};

    for (const subscription of subscribe.subscriptions) {
        let mqttJsSub = {
            qos: subscription.qos,
            nl : subscription.noLocal ?? false,
            rap: subscription.retainAsPublished ?? false,
            rh: subscription.retainHandlingType ?? mqtt5.RetainHandlingType.SendOnSubscribe
        };

        subscriptionMap[subscription.topicFilter] = mqttJsSub;
    }

    return subscriptionMap;
}

/** @internal **/
export function transform_crt_subscribe_to_mqtt_js_subscribe_options(subscribe: mqtt5.SubscribePacket) : mqtt.IClientSubscribeOptions {

    let properties = {};
    let propertiesValid : boolean = false;

    if (subscribe == null || subscribe == undefined) {
        throw new CrtError("transform_crt_subscribe_to_mqtt_js_subscribe_options: subscribe not defined");
    }

    propertiesValid = utils.set_defined_property(properties, "subscriptionIdentifier", subscribe.subscriptionIdentifier) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(subscribe.userProperties)) || propertiesValid;

    let options : mqtt.IClientSubscribeOptions = {
        qos: 0
    }

    if (propertiesValid) {
        options["properties"] = properties;
    }

    return options;
}

/** @internal **/
export function transform_mqtt_js_subscription_grants_to_crt_suback(subscriptionsGranted: mqtt.ISubscriptionGrant[]) : mqtt5.SubackPacket {

    if (subscriptionsGranted == null || subscriptionsGranted == undefined) {
        throw new CrtError("transform_mqtt_js_subscription_grants_to_crt_suback: subscriptionsGranted not defined");
    }

    let crtSuback : mqtt5.SubackPacket = {
        type: mqtt5.PacketType.Suback,
        reasonCodes : subscriptionsGranted.map((subscription: mqtt.ISubscriptionGrant, index: number, array : mqtt.ISubscriptionGrant[]) : mqtt5.SubackReasonCode => { return subscription.qos; })
    }

    /*
     * TODO: mqtt-js does not expose the suback packet to subscribe's completion callback, so we cannot extract
     * reasonString and userProperties atm.
     *
     * Revisit if this changes.
     */


    return crtSuback;
}

function validate_crt_publish(publish: mqtt5.PublishPacket) {
    if (publish == null || publish == undefined) {
        throw new CrtError("validate_crt_publish: publish not defined");
    }
    validate_optional_uint32("messageExpiryIntervalSeconds", publish.messageExpiryIntervalSeconds);
}

/** @internal */
export function transform_crt_publish_to_mqtt_js_publish_options(publish: mqtt5.PublishPacket) : mqtt.IClientPublishOptions {

    validate_crt_publish(publish);

    let properties = {};
    let propertiesValid : boolean = false;

    if (publish.payloadFormat !== undefined) {
        propertiesValid = utils.set_defined_property(properties, "payloadFormatIndicator", publish.payloadFormat == mqtt5.PayloadFormatIndicator.Utf8) || propertiesValid;
    }
    propertiesValid = utils.set_defined_property(properties, "messageExpiryInterval", publish.messageExpiryIntervalSeconds) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "responseTopic", publish.responseTopic) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "correlationData", publish.correlationData) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(publish.userProperties)) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "contentType", publish.contentType) || propertiesValid;
    propertiesValid = utils.set_defined_property(properties, "topicAlias", publish.topicAlias) || propertiesValid;

    let mqttJsPublish : mqtt.IClientPublishOptions = {
        qos: publish.qos,
        retain: publish.retain ?? false,
    };

    if (propertiesValid) {
        mqttJsPublish["properties"] = properties;
    }

    return mqttJsPublish;
}

/** @internal **/
export function transform_mqtt_js_publish_to_crt_publish(publish: mqtt.IPublishPacket) : mqtt5.PublishPacket {

    if (publish == null || publish == undefined) {
        throw new CrtError("transform_mqtt_js_publish_to_crt_publish: publish not defined");
    }

    let crtPublish : mqtt5.PublishPacket = {
        type: mqtt5.PacketType.Publish,
        qos: publish.qos,
        retain: publish.retain,
        topicName: publish.topic,
        payload: publish.payload
    };

    if (publish.properties) {
        if (publish.properties.payloadFormatIndicator !== undefined) {
            utils.set_defined_property(crtPublish, "payloadFormat", publish.properties.payloadFormatIndicator ? mqtt5.PayloadFormatIndicator.Utf8 : mqtt5.PayloadFormatIndicator.Bytes);
        }
        utils.set_defined_property(crtPublish, "messageExpiryIntervalSeconds", publish.properties?.messageExpiryInterval);
        utils.set_defined_property(crtPublish, "responseTopic", publish.properties?.responseTopic);
        utils.set_defined_property(crtPublish, "correlationData", publish.properties?.correlationData);
        utils.set_defined_property(crtPublish, "userProperties", transform_mqtt_js_user_properties_to_crt_user_properties(publish.properties?.userProperties));
        utils.set_defined_property(crtPublish, "contentType", publish.properties?.contentType);

        let subIds : number | number[] | undefined = publish.properties?.subscriptionIdentifier;
        let subIdsType : string = typeof subIds;
        if (subIds) {
            if (subIdsType == 'number') {
                crtPublish["subscriptionIdentifiers"] = [subIds];
            } else if (Array.isArray(subIds)) {
                crtPublish["subscriptionIdentifiers"] = subIds;
            }
        }
    }

    return crtPublish;
}

/** @internal **/
export function transform_mqtt_js_puback_to_crt_puback(puback: mqtt.IPubackPacket) : mqtt5.PubackPacket {

    if (puback == null || puback == undefined) {
        throw new CrtError("transform_mqtt_js_puback_to_crt_puback: puback not defined");
    }

    let crtPuback : mqtt5.PubackPacket = {
        type: mqtt5.PacketType.Puback,
        reasonCode: puback.reasonCode ?? mqtt5.PubackReasonCode.Success,
    };

    if (puback.properties) {
        utils.set_defined_property(crtPuback, "reasonString", puback.properties?.reasonString);
        utils.set_defined_property(crtPuback, "userProperties", transform_mqtt_js_user_properties_to_crt_user_properties(puback.properties?.userProperties));
    }

    return crtPuback;
}

/** @internal **/
export function transform_crt_unsubscribe_to_mqtt_js_unsubscribe_options(unsubscribe: mqtt5.UnsubscribePacket) : Object {

    if (unsubscribe == null || unsubscribe == undefined) {
        throw new CrtError("transform_crt_unsubscribe_to_mqtt_js_unsubscribe_options: unsubscribe not defined");
    }

    let properties = {};
    let propertiesValid : boolean = false;

    propertiesValid = utils.set_defined_property(properties, "userProperties", transform_crt_user_properties_to_mqtt_js_user_properties(unsubscribe.userProperties));

    let options : any = {};

    if (propertiesValid) {
        options["properties"] = properties;
    }

    return options;
}

/** @internal **/
export function transform_mqtt_js_unsuback_to_crt_unsuback(packet: mqtt.IUnsubackPacket) : mqtt5.UnsubackPacket {

    if (packet == null || packet == undefined) {
        throw new CrtError("transform_mqtt_js_unsuback_to_crt_unsuback: packet not defined");
    }

    let reasonCodes : number | number[] | undefined = packet.reasonCode;

    let codes : number[];
    if (Array.isArray(reasonCodes)) {
        codes = reasonCodes;
    } else if (typeof reasonCodes == 'number') {
        codes = [reasonCodes];
    } else {
        codes = [];
    }

    let crtUnsuback : mqtt5.UnsubackPacket = {
        type: mqtt5.PacketType.Unsuback,
        reasonCodes : codes
    }

    if (packet.properties) {
        utils.set_defined_property(crtUnsuback, "reasonString", packet.properties?.reasonString);
        utils.set_defined_property(crtUnsuback, "userProperties", transform_mqtt_js_user_properties_to_crt_user_properties(packet.properties?.userProperties));
    }

    return crtUnsuback;
}
