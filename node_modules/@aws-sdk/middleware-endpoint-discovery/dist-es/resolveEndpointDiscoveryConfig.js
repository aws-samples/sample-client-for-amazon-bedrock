import { EndpointCache } from "@aws-sdk/endpoint-cache";
export const resolveEndpointDiscoveryConfig = (input, { endpointDiscoveryCommandCtor }) => ({
    ...input,
    endpointDiscoveryCommandCtor,
    endpointCache: new EndpointCache(input.endpointCacheSize ?? 1000),
    endpointDiscoveryEnabled: input.endpointDiscoveryEnabled !== undefined
        ? () => Promise.resolve(input.endpointDiscoveryEnabled)
        : input.endpointDiscoveryEnabledProvider,
    isClientEndpointDiscoveryEnabled: input.endpointDiscoveryEnabled !== undefined,
});
