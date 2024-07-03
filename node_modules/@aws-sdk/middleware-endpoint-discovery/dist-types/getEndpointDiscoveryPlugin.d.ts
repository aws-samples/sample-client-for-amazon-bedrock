import { BuildHandlerOptions, HttpHandlerOptions, MiddlewareStack, Pluggable } from "@smithy/types";
import { EndpointDiscoveryResolvedConfig, PreviouslyResolved } from "./resolveEndpointDiscoveryConfig";
export declare const endpointDiscoveryMiddlewareOptions: BuildHandlerOptions;
export interface EndpointDiscoveryMiddlewareConfig {
    isDiscoveredEndpointRequired: boolean;
    clientStack: MiddlewareStack<any, any>;
    options?: HttpHandlerOptions;
    identifiers?: Record<string, string>;
}
export declare const getEndpointDiscoveryPlugin: (pluginConfig: EndpointDiscoveryResolvedConfig & PreviouslyResolved, middlewareConfig: EndpointDiscoveryMiddlewareConfig) => Pluggable<any, any>;
/**
 * @deprecated Use getEndpointDiscoveryPlugin
 */
export declare const getEndpointDiscoveryRequiredPlugin: (pluginConfig: EndpointDiscoveryResolvedConfig & PreviouslyResolved, middlewareConfig: Omit<EndpointDiscoveryMiddlewareConfig, "isDiscoveredEndpointRequired">) => Pluggable<any, any>;
/**
 * @deprecated Use getEndpointDiscoveryPlugin
 */
export declare const getEndpointDiscoveryOptionalPlugin: (pluginConfig: EndpointDiscoveryResolvedConfig & PreviouslyResolved, middlewareConfig: Omit<EndpointDiscoveryMiddlewareConfig, "isDiscoveredEndpointRequired">) => Pluggable<any, any>;
