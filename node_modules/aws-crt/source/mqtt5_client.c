/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "mqtt5_client.h"
#include "http_connection.h"
#include "http_message.h"
#include "io.h"

#include <aws/http/proxy.h>
#include <aws/io/socket.h>
#include <aws/io/tls_channel_handler.h>
#include <aws/mqtt/v5/mqtt5_client.h>
#include <aws/mqtt/v5/mqtt5_packet_storage.h>
#include <aws/mqtt/v5/mqtt5_types.h>

/* object key names for referencing mqtt5-related properties on napi objects */
static const char *AWS_NAPI_KEY_NAME = "name";
static const char *AWS_NAPI_KEY_VALUE = "value";
static const char *AWS_NAPI_KEY_USER_PROPERTIES = "userProperties";
static const char *AWS_NAPI_KEY_SESSION_PRESENT = "sessionPresent";
static const char *AWS_NAPI_KEY_REASON_CODE = "reasonCode";
static const char *AWS_NAPI_KEY_REASON_CODES = "reasonCodes";
static const char *AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL = "sessionExpiryInterval";
static const char *AWS_NAPI_KEY_RECEIVE_MAXIMUM = "receiveMaximum";
static const char *AWS_NAPI_KEY_MAXIMUM_QOS = "maximumQos";
static const char *AWS_NAPI_KEY_RETAIN_AVAILABLE = "retainAvailable";
static const char *AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE = "maximumPacketSize";
static const char *AWS_NAPI_KEY_ASSIGNED_CLIENT_IDENTIFIER = "assignedClientIdentifier";
static const char *AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM = "topicAliasMaximum";
static const char *AWS_NAPI_KEY_REASON_STRING = "reasonString";
static const char *AWS_NAPI_KEY_WILDCARD_SUBSCRIPTIONS_AVAILABLE = "wildcardSubscriptionsAvailable";
static const char *AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIERS_AVAILABLE = "subscriptionIdentifiersAvailable";
static const char *AWS_NAPI_KEY_SHARED_SUBSCRIPTIONS_AVAILABLE = "sharedSubscriptionsAvailable";
static const char *AWS_NAPI_KEY_SERVER_KEEP_ALIVE = "serverKeepAlive";
static const char *AWS_NAPI_KEY_RESPONSE_INFORMATION = "responseInformation";
static const char *AWS_NAPI_KEY_SERVER_REFERENCE = "serverReference";
static const char *AWS_NAPI_KEY_RECEIVE_MAXIMUM_FROM_SERVER = "receiveMaximumFromServer";
static const char *AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE_TO_SERVER = "maximumPacketSizeToServer";
static const char *AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM_TO_SERVER = "topicAliasMaximumToServer";
static const char *AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM_TO_CLIENT = "topicAliasMaximumToClient";
static const char *AWS_NAPI_KEY_REJOINED_SESSION = "rejoinedSession";
static const char *AWS_NAPI_KEY_CLIENT_ID = "clientId";
static const char *AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS = "sessionExpiryIntervalSeconds";
static const char *AWS_NAPI_KEY_TOPIC_NAME = "topicName";
static const char *AWS_NAPI_KEY_PAYLOAD = "payload";
static const char *AWS_NAPI_KEY_QOS = "qos";
static const char *AWS_NAPI_KEY_RETAIN = "retain";
static const char *AWS_NAPI_KEY_PAYLOAD_FORMAT = "payloadFormat";
static const char *AWS_NAPI_KEY_MESSAGE_EXPIRY_INTERVAL_SECONDS = "messageExpiryIntervalSeconds";
static const char *AWS_NAPI_KEY_TOPIC_ALIAS = "topicAlias";
static const char *AWS_NAPI_KEY_RESPONSE_TOPIC = "responseTopic";
static const char *AWS_NAPI_KEY_CORRELATION_DATA = "correlationData";
static const char *AWS_NAPI_KEY_CONTENT_TYPE = "contentType";
static const char *AWS_NAPI_KEY_KEEP_ALIVE_INTERVAL_SECONDS = "keepAliveIntervalSeconds";
static const char *AWS_NAPI_KEY_USERNAME = "username";
static const char *AWS_NAPI_KEY_PASSWORD = "password";
static const char *AWS_NAPI_KEY_REQUEST_RESPONSE_INFORMATION = "requestResponseInformation";
static const char *AWS_NAPI_KEY_REQUEST_PROBLEM_INFORMATION = "requestProblemInformation";
static const char *AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE_BYTES = "maximumPacketSizeBytes";
static const char *AWS_NAPI_KEY_WILL_DELAY_INTERVAL_SECONDS = "willDelayIntervalSeconds";
static const char *AWS_NAPI_KEY_WILL = "will";
static const char *AWS_NAPI_KEY_HOST_NAME = "hostName";
static const char *AWS_NAPI_KEY_PORT = "port";
static const char *AWS_NAPI_KEY_SESSION_BEHAVIOR = "sessionBehavior";
static const char *AWS_NAPI_KEY_EXTENDED_VALIDATION_AND_FLOW_CONTROL_OPTIONS =
    "extendedValidationAndFlowControlOptions";
static const char *AWS_NAPI_KEY_OFFLINE_QUEUE_BEHAVIOR = "offlineQueueBehavior";
static const char *AWS_NAPI_KEY_RETRY_JITTER_MODE = "retryJitterMode";
static const char *AWS_NAPI_KEY_MIN_RECONNECT_DELAY_MS = "minReconnectDelayMs";
static const char *AWS_NAPI_KEY_MAX_RECONNECT_DELAY_MS = "maxReconnectDelayMs";
static const char *AWS_NAPI_KEY_MIN_CONNECTED_TIME_TO_RESET_RECONNECT_DELAY_MS =
    "minConnectedTimeToResetReconnectDelayMs";
static const char *AWS_NAPI_KEY_PING_TIMEOUT_MS = "pingTimeoutMs";
static const char *AWS_NAPI_KEY_CONNACK_TIMEOUT_MS = "connackTimeoutMs";
static const char *AWS_NAPI_KEY_ACK_TIMEOUT_SECONDS = "ackTimeoutSeconds";
static const char *AWS_NAPI_KEY_CONNECT_PROPERTIES = "connectProperties";
static const char *AWS_NAPI_KEY_WEBSOCKET_HANDSHAKE_TRANSFORM = "websocketHandshakeTransform";
static const char *AWS_NAPI_KEY_SUBSCRIPTIONS = "subscriptions";
static const char *AWS_NAPI_KEY_TOPIC_FILTER = "topicFilter";
static const char *AWS_NAPI_KEY_TOPIC_FILTERS = "topicFilters";
static const char *AWS_NAPI_KEY_NO_LOCAL = "noLocal";
static const char *AWS_NAPI_KEY_RETAIN_AS_PUBLISHED = "retainAsPublished";
static const char *AWS_NAPI_KEY_RETAIN_HANDLING_TYPE = "retainHandlingType";
static const char *AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIER = "subscriptionIdentifier";
static const char *AWS_NAPI_KEY_SUSBCRIPTION_IDENTIFIERS = "subscriptionIdentifiers";
static const char *AWS_NAPI_KEY_INCOMPLETE_OPERATION_COUNT = "incompleteOperationCount";
static const char *AWS_NAPI_KEY_INCOMPLETE_OPERATION_SIZE = "incompleteOperationSize";
static const char *AWS_NAPI_KEY_UNACKED_OPERATION_COUNT = "unackedOperationCount";
static const char *AWS_NAPI_KEY_UNACKED_OPERATION_SIZE = "unackedOperationSize";
static const char *AWS_NAPI_KEY_TYPE = "type";
static const char *AWS_NAPI_KEY_TOPIC_ALIASING_OPTIONS = "topicAliasingOptions";
static const char *AWS_NAPI_KEY_OUTBOUND_BEHAVIOR = "outboundBehavior";
static const char *AWS_NAPI_KEY_OUTBOUND_CACHE_MAX_SIZE = "outboundCacheMaxSize";
static const char *AWS_NAPI_KEY_INBOUND_BEHAVIOR = "inboundBehavior";
static const char *AWS_NAPI_KEY_INBOUND_CACHE_MAX_SIZE = "inboundCacheMaxSize";

/*
 * Binding object that outlives the associated napi wrapper object.  When that object finalizes, then it's a signal
 * to this object to destroy the client (and itself, afterwards).
 */
struct aws_mqtt5_client_binding {
    struct aws_allocator *allocator;

    /*
     * We ref count the binding itself because there are anomalous situations where the binding must outlive even
     * the native client.  In particular, if we have a native client being destroyed it may emit lifecycle events
     * or completion callbacks for submitted operations as it does so.  Those events get marshalled across to the
     * node/libuv thread and in the time it takes to do so, the native client may have completed destruction.  But
     * we still need the binding when we're processing those events/callbacks in the libuv thread so the binding
     * must not simply destroy itself as soon as the native client has destroyed itself.
     *
     * We handle this by having all operations/events inc/dec this ref count as well as the base of one from
     * creating the client.  In this way, the binding will only destroy itself when the native client is completely
     * gone and all callbacks and events have been successfully emitted to node.
     */
    struct aws_ref_count ref_count;

    struct aws_mqtt5_client *client;

    struct aws_tls_connection_options tls_connection_options;

    /*
     * Single count ref to the JS mqtt 5 client object.
     */
    napi_ref node_mqtt5_client_ref;

    /*
     * Single count ref to the node external managed by the client.
     */
    napi_ref node_client_external_ref;

    napi_threadsafe_function on_stopped;
    napi_threadsafe_function on_attempting_connect;
    napi_threadsafe_function on_connection_success;
    napi_threadsafe_function on_connection_failure;
    napi_threadsafe_function on_disconnection;
    napi_threadsafe_function on_message_received;

    napi_threadsafe_function transform_websocket;
};

static void s_aws_mqtt5_client_binding_destroy(struct aws_mqtt5_client_binding *binding) {
    if (binding == NULL) {
        return;
    }

    aws_tls_connection_options_clean_up(&binding->tls_connection_options);

    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_stopped);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_attempting_connect);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_connection_success);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_connection_failure);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_disconnection);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_message_received);
    AWS_CLEAN_THREADSAFE_FUNCTION(binding, transform_websocket);

    aws_mem_release(binding->allocator, binding);
}

static void s_aws_mqtt5_client_binding_on_zero(void *object) {
    s_aws_mqtt5_client_binding_destroy(object);
}

static struct aws_mqtt5_client_binding *s_aws_mqtt5_client_binding_acquire(struct aws_mqtt5_client_binding *binding) {
    if (binding == NULL) {
        return NULL;
    }

    aws_ref_count_acquire(&binding->ref_count);
    return binding;
}

static struct aws_mqtt5_client_binding *s_aws_mqtt5_client_binding_release(struct aws_mqtt5_client_binding *binding) {
    if (binding != NULL) {
        aws_ref_count_release(&binding->ref_count);
    }

    return NULL;
}

static void s_aws_mqtt5_client_binding_on_client_terminate(void *user_data) {
    struct aws_mqtt5_client_binding *binding = user_data;

    s_aws_mqtt5_client_binding_release(binding);
}

/*
 * Invoked when the node mqtt5 client is garbage collected or if fails construction partway through
 */
static void s_aws_mqtt5_client_extern_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)finalize_hint;
    (void)env;

    struct aws_mqtt5_client_binding *binding = finalize_data;

    AWS_LOGF_INFO(
        AWS_LS_NODEJS_CRT_GENERAL,
        "id=%p s_aws_mqtt5_client_extern_finalize - mqtt5_client node wrapper is being finalized",
        (void *)binding->client);

    if (binding->client != NULL) {
        /* if client is not null, then this is a successfully constructed client which should shutdown normally */
        aws_mqtt5_client_release(binding->client);
        binding->client = NULL;
    } else {
        /*
         * no client, this must be a creation attempt that failed partway through and we should directly clean up the
         * binding
         */
        s_aws_mqtt5_client_binding_on_client_terminate(binding);
    }
}

struct on_message_received_user_data {
    struct aws_allocator *allocator;
    struct aws_mqtt5_client_binding *binding;
    struct aws_mqtt5_packet_publish_storage publish_storage;

    struct aws_byte_buf *payload;
    struct aws_byte_buf *correlation_data;
};

static void s_on_message_received_user_data_destroy(struct on_message_received_user_data *user_data) {
    if (user_data == NULL) {
        return;
    }

    user_data->binding = s_aws_mqtt5_client_binding_release(user_data->binding);
    aws_mqtt5_packet_publish_storage_clean_up(&user_data->publish_storage);

    if (user_data->payload != NULL) {
        aws_byte_buf_clean_up(user_data->payload);
        aws_mem_release(user_data->allocator, user_data->payload);
    }

    if (user_data->correlation_data != NULL) {
        aws_byte_buf_clean_up(user_data->correlation_data);
        aws_mem_release(user_data->allocator, user_data->correlation_data);
    }

    aws_mem_release(user_data->allocator, user_data);
}

static struct on_message_received_user_data *s_on_message_received_user_data_new(
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_publish_view *publish_packet) {

    struct on_message_received_user_data *user_data =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct on_message_received_user_data));
    user_data->allocator = binding->allocator;

    /*
     * Binary data needs to be separately pinned and tracked so that it can be individually finalized.  In order to not
     * make even more redundant copies of it, we do some hacky nonsense to "split" it out of the storage into separate
     * buffers.  We can then "take" the buffer pointers when we're calling into node and manage them separately.
     */
    struct aws_mqtt5_packet_publish_view publish_copy = *publish_packet;

    user_data->payload = aws_mem_calloc(binding->allocator, 1, sizeof(struct aws_byte_buf));
    if (aws_byte_buf_init_copy_from_cursor(user_data->payload, binding->allocator, publish_copy.payload)) {
        goto error;
    }
    AWS_ZERO_STRUCT(publish_copy.payload);

    if (publish_copy.correlation_data != NULL) {
        user_data->correlation_data = aws_mem_calloc(binding->allocator, 1, sizeof(struct aws_byte_buf));
        if (aws_byte_buf_init_copy_from_cursor(
                user_data->correlation_data, binding->allocator, *publish_copy.correlation_data)) {
            goto error;
        }
        publish_copy.correlation_data = NULL;
    }

    /*
     * We've saved off correlation data and payload separately and erased them from the packet copy.  Now we can make
     * a persistent copy of the packet without copying the binary data twice.
     */
    if (aws_mqtt5_packet_publish_storage_init(&user_data->publish_storage, user_data->allocator, &publish_copy)) {
        goto error;
    }
    user_data->binding = s_aws_mqtt5_client_binding_acquire(binding);

    return user_data;

error:

    s_on_message_received_user_data_destroy(user_data);

    return NULL;
}

static void s_on_publish_received(const struct aws_mqtt5_packet_publish_view *publish_packet, void *user_data) {
    struct aws_mqtt5_client_binding *binding = user_data;

    if (!binding->on_message_received) {
        return;
    }

    struct on_message_received_user_data *message_received_ud =
        s_on_message_received_user_data_new(binding, publish_packet);
    if (message_received_ud == NULL) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_message_received, message_received_ud));
}

struct on_simple_event_user_data {
    struct aws_allocator *allocator;
    struct aws_mqtt5_client_binding *binding;
};

static void s_on_simple_event_user_data_destroy(struct on_simple_event_user_data *user_data) {
    if (user_data == NULL) {
        return;
    }

    user_data->binding = s_aws_mqtt5_client_binding_release(user_data->binding);

    aws_mem_release(user_data->allocator, user_data);
}

static struct on_simple_event_user_data *s_on_simple_event_user_data_new(struct aws_mqtt5_client_binding *binding) {

    struct on_simple_event_user_data *user_data =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct on_simple_event_user_data));
    user_data->allocator = binding->allocator;
    user_data->binding = s_aws_mqtt5_client_binding_acquire(binding);

    return user_data;
}

static void s_on_stopped(struct aws_mqtt5_client_binding *binding) {
    if (!binding->on_stopped) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(
        NULL, aws_napi_queue_threadsafe_function(binding->on_stopped, s_on_simple_event_user_data_new(binding)));
}

static void s_on_attempting_connect(struct aws_mqtt5_client_binding *binding) {
    if (!binding->on_attempting_connect) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(
        NULL,
        aws_napi_queue_threadsafe_function(binding->on_attempting_connect, s_on_simple_event_user_data_new(binding)));
}

/* unions callback data needed for connection succes and failure as a convenience */
struct on_connection_result_user_data {
    struct aws_allocator *allocator;
    struct aws_mqtt5_client_binding *binding;
    struct aws_mqtt5_packet_connack_storage connack_storage;
    bool is_connack_valid;
    int error_code;
    struct aws_mqtt5_negotiated_settings settings;
};

static void s_on_connection_result_user_data_destroy(struct on_connection_result_user_data *connection_result_ud) {
    if (connection_result_ud == NULL) {
        return;
    }

    connection_result_ud->binding = s_aws_mqtt5_client_binding_release(connection_result_ud->binding);

    aws_mqtt5_packet_connack_storage_clean_up(&connection_result_ud->connack_storage);
    aws_mqtt5_negotiated_settings_clean_up(&connection_result_ud->settings);

    aws_mem_release(connection_result_ud->allocator, connection_result_ud);
}

static struct on_connection_result_user_data *s_on_connection_result_user_data_new(
    struct aws_allocator *allocator,
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_connack_view *connack,
    const struct aws_mqtt5_negotiated_settings *settings,
    int error_code) {

    struct on_connection_result_user_data *connection_result_ud =
        aws_mem_calloc(allocator, 1, sizeof(struct on_connection_result_user_data));

    connection_result_ud->allocator = allocator;
    connection_result_ud->error_code = error_code;
    connection_result_ud->binding = s_aws_mqtt5_client_binding_acquire(binding);

    if (connack != NULL) {
        if (aws_mqtt5_packet_connack_storage_init(&connection_result_ud->connack_storage, allocator, connack)) {
            goto error;
        }
        connection_result_ud->is_connack_valid = true;
    }

    if (settings != NULL) {
        if (aws_mqtt5_negotiated_settings_copy(settings, &connection_result_ud->settings)) {
            goto error;
        }
    }

    return connection_result_ud;

error:

    s_on_connection_result_user_data_destroy(connection_result_ud);

    return NULL;
}

static void s_on_connection_success(
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_connack_view *connack,
    const struct aws_mqtt5_negotiated_settings *settings) {

    if (!binding->on_connection_success) {
        return;
    }

    struct on_connection_result_user_data *connection_result_ud =
        s_on_connection_result_user_data_new(binding->allocator, binding, connack, settings, AWS_ERROR_SUCCESS);
    if (connection_result_ud == NULL) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_success, connection_result_ud));
}

static void s_on_connection_failure(
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_connack_view *connack,
    int error_code) {
    if (!binding->on_connection_failure) {
        return;
    }

    struct on_connection_result_user_data *connection_result_ud =
        s_on_connection_result_user_data_new(binding->allocator, binding, connack, NULL, error_code);
    if (connection_result_ud == NULL) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_connection_failure, connection_result_ud));
}

struct on_disconnection_user_data {
    struct aws_allocator *allocator;
    struct aws_mqtt5_client_binding *binding;
    struct aws_mqtt5_packet_disconnect_storage disconnect_storage;
    bool is_disconnect_valid;
    int error_code;
};

static void s_on_disconnection_user_data_destroy(struct on_disconnection_user_data *disconnection_ud) {
    if (disconnection_ud == NULL) {
        return;
    }

    disconnection_ud->binding = s_aws_mqtt5_client_binding_release(disconnection_ud->binding);

    aws_mqtt5_packet_disconnect_storage_clean_up(&disconnection_ud->disconnect_storage);

    aws_mem_release(disconnection_ud->allocator, disconnection_ud);
}

static struct on_disconnection_user_data *s_on_disconnection_user_data_new(
    struct aws_allocator *allocator,
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_disconnect_view *disconnect,
    int error_code) {
    struct on_disconnection_user_data *disconnection_ud =
        aws_mem_calloc(allocator, 1, sizeof(struct on_disconnection_user_data));

    disconnection_ud->allocator = allocator;
    disconnection_ud->error_code = error_code;
    disconnection_ud->binding = s_aws_mqtt5_client_binding_acquire(binding);

    if (disconnect != NULL) {
        if (aws_mqtt5_packet_disconnect_storage_init(&disconnection_ud->disconnect_storage, allocator, disconnect)) {
            goto error;
        }
        disconnection_ud->is_disconnect_valid = true;
    }

    return disconnection_ud;

error:

    s_on_disconnection_user_data_destroy(disconnection_ud);

    return NULL;
}

static void s_on_disconnection(
    struct aws_mqtt5_client_binding *binding,
    const struct aws_mqtt5_packet_disconnect_view *disconnect,
    int error_code) {
    if (!binding->on_disconnection) {
        return;
    }

    struct on_disconnection_user_data *disconnection_ud =
        s_on_disconnection_user_data_new(binding->allocator, binding, disconnect, error_code);
    if (disconnection_ud == NULL) {
        return;
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_disconnection, disconnection_ud));
}

static void s_lifecycle_event_callback(const struct aws_mqtt5_client_lifecycle_event *event) {
    struct aws_mqtt5_client_binding *binding = event->user_data;

    switch (event->event_type) {
        case AWS_MQTT5_CLET_STOPPED:
            s_on_stopped(binding);
            break;

        case AWS_MQTT5_CLET_ATTEMPTING_CONNECT:
            s_on_attempting_connect(binding);
            break;

        case AWS_MQTT5_CLET_CONNECTION_SUCCESS:
            s_on_connection_success(binding, event->connack_data, event->settings);
            break;

        case AWS_MQTT5_CLET_CONNECTION_FAILURE:
            s_on_connection_failure(binding, event->connack_data, event->error_code);
            break;

        case AWS_MQTT5_CLET_DISCONNECTION:
            s_on_disconnection(binding, event->disconnect_data, event->error_code);
            break;

        default:
            break;
    }
}

typedef void(napi_threadsafe_function_type)(napi_env env, napi_value function, void *context, void *user_data);

/* in-node/libuv-thread function to trigger the emission of a STOPPED client lifecycle event */
static void s_napi_on_stopped(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_simple_event_user_data *simple_ud = user_data;
    struct aws_mqtt5_client_binding *binding = simple_ud->binding;

    if (env) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_stopped_call - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env, aws_napi_dispatch_threadsafe_function(env, binding->on_stopped, NULL, function, num_params, params));
    }

done:

    s_on_simple_event_user_data_destroy(simple_ud);
}

/* in-node/libuv-thread function to trigger the emission of an ATTEMPTING_CONNECT client lifecycle event */
static void s_napi_on_attempting_connect(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_simple_event_user_data *simple_ud = user_data;
    struct aws_mqtt5_client_binding *binding = simple_ud->binding;

    if (env) {
        napi_value params[1];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_attempting_connect_call - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_attempting_connect, NULL, function, num_params, params));
    }

done:

    s_on_simple_event_user_data_destroy(simple_ud);
}

/* utility function to attach native-specified user properties to a napi object as an array of user property objects */
static int s_attach_object_property_user_properties(
    napi_value napi_packet,
    napi_env env,
    size_t user_property_count,
    const struct aws_mqtt5_user_property *user_properties) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value user_property_array = NULL;
    AWS_NAPI_CALL(env, napi_create_array_with_length(env, user_property_count, &user_property_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    for (size_t i = 0; i < user_property_count; ++i) {
        const struct aws_mqtt5_user_property *property = &user_properties[i];

        napi_value user_property_value = NULL;
        AWS_NAPI_CALL(env, napi_create_object(env, &user_property_value), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        if (aws_napi_attach_object_property_string(user_property_value, env, AWS_NAPI_KEY_NAME, property->name) ||
            aws_napi_attach_object_property_string(user_property_value, env, AWS_NAPI_KEY_VALUE, property->value)) {
            return AWS_OP_ERR;
        }

        AWS_NAPI_CALL(env, napi_set_element(env, user_property_array, (uint32_t)i, user_property_value), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });
    }

    AWS_NAPI_CALL(env, napi_set_named_property(env, napi_packet, AWS_NAPI_KEY_USER_PROPERTIES, user_property_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    return AWS_OP_SUCCESS;
}

/* Builds a napi object that represents a CONNACK packet, matching the AwsMqtt5PacketConnack interface */
static int s_create_napi_connack_packet(
    napi_env env,
    const struct on_connection_result_user_data *connection_result_ud,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    if (!connection_result_ud->is_connack_valid) {
        AWS_NAPI_CALL(
            env, napi_get_null(env, packet_out), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });
        return AWS_OP_SUCCESS;
    }

    napi_value packet = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &packet), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    const struct aws_mqtt5_packet_connack_view *connack_view = &connection_result_ud->connack_storage.storage_view;

    if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_CONNACK)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            packet, env, AWS_NAPI_KEY_SESSION_PRESENT, connack_view->session_present)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            packet, env, AWS_NAPI_KEY_REASON_CODE, (uint32_t)connack_view->reason_code)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u32(
            packet, env, AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL, connack_view->session_expiry_interval)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u16(
            packet, env, AWS_NAPI_KEY_RECEIVE_MAXIMUM, connack_view->receive_maximum)) {
        return AWS_OP_ERR;
    }

    if (connack_view->maximum_qos != NULL) {
        uint32_t maximum_qos = *connack_view->maximum_qos;
        if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_MAXIMUM_QOS, maximum_qos)) {
            return AWS_OP_ERR;
        }
    }

    if (aws_napi_attach_object_property_optional_boolean(
            packet, env, AWS_NAPI_KEY_RETAIN_AVAILABLE, connack_view->retain_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u32(
            packet, env, AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE, connack_view->maximum_packet_size)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_ASSIGNED_CLIENT_IDENTIFIER, connack_view->assigned_client_identifier)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u16(
            packet, env, AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM, connack_view->topic_alias_maximum)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_REASON_STRING, connack_view->reason_string)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            packet, env, connack_view->user_property_count, connack_view->user_properties)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_boolean(
            packet,
            env,
            AWS_NAPI_KEY_WILDCARD_SUBSCRIPTIONS_AVAILABLE,
            connack_view->wildcard_subscriptions_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_boolean(
            packet,
            env,
            AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIERS_AVAILABLE,
            connack_view->subscription_identifiers_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_boolean(
            packet, env, AWS_NAPI_KEY_SHARED_SUBSCRIPTIONS_AVAILABLE, connack_view->shared_subscriptions_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u16(
            packet, env, AWS_NAPI_KEY_SERVER_KEEP_ALIVE, connack_view->server_keep_alive)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_RESPONSE_INFORMATION, connack_view->response_information)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_SERVER_REFERENCE, connack_view->server_reference)) {
        return AWS_OP_ERR;
    }

    *packet_out = packet;

    return AWS_OP_SUCCESS;
}

/* Builds a napi object that represents connection negotiated settings, using the Mqtt5NegotiatedSettings interface */
static int s_create_napi_negotiated_settings(
    napi_env env,
    const struct aws_mqtt5_negotiated_settings *settings,
    napi_value *value_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_settings = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_settings), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    uint32_t maximum_qos = settings->maximum_qos;
    if (aws_napi_attach_object_property_u32(napi_settings, env, AWS_NAPI_KEY_MAXIMUM_QOS, maximum_qos)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_settings, env, AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL, settings->session_expiry_interval)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_settings,
            env,
            AWS_NAPI_KEY_RECEIVE_MAXIMUM_FROM_SERVER,
            (uint32_t)settings->receive_maximum_from_server)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_settings, env, AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE_TO_SERVER, settings->maximum_packet_size_to_server)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u16(
            napi_settings, env, AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM_TO_SERVER, settings->topic_alias_maximum_to_server)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u16(
            napi_settings, env, AWS_NAPI_KEY_TOPIC_ALIAS_MAXIMUM_TO_CLIENT, settings->topic_alias_maximum_to_client)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(
            napi_settings, env, AWS_NAPI_KEY_SERVER_KEEP_ALIVE, (uint32_t)settings->server_keep_alive)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            napi_settings, env, AWS_NAPI_KEY_RETAIN_AVAILABLE, settings->retain_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            napi_settings,
            env,
            AWS_NAPI_KEY_WILDCARD_SUBSCRIPTIONS_AVAILABLE,
            settings->wildcard_subscriptions_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            napi_settings,
            env,
            AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIERS_AVAILABLE,
            settings->subscription_identifiers_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            napi_settings,
            env,
            AWS_NAPI_KEY_SHARED_SUBSCRIPTIONS_AVAILABLE,
            settings->shared_subscriptions_available)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(
            napi_settings, env, AWS_NAPI_KEY_REJOINED_SESSION, settings->rejoined_session)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_string(
            napi_settings, env, AWS_NAPI_KEY_CLIENT_ID, aws_byte_cursor_from_buf(&settings->client_id_storage))) {
        return AWS_OP_ERR;
    }

    *value_out = napi_settings;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the emission of a CONNECTION_SUCCESS client lifecycle event */
static void s_napi_on_connection_success(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_connection_result_user_data *connection_result_ud = user_data;
    struct aws_mqtt5_client_binding *binding = connection_result_ud->binding;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_connection_success_call - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        if (s_create_napi_connack_packet(env, connection_result_ud, &params[1])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_connection_success_call - failed to create connack object",
                (void *)binding->client);
            goto done;
        }

        if (s_create_napi_negotiated_settings(env, &connection_result_ud->settings, &params[2])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_connection_success_call - failed to create negotiated settings object",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_connection_success, NULL, function, num_params, params));
    }

done:

    s_on_connection_result_user_data_destroy(connection_result_ud);
}

/* in-node/libuv-thread function to trigger the emission of a CONNECTION_FAILURE client lifecycle event */
static void s_napi_on_connection_failure(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_connection_result_user_data *connection_result_ud = user_data;
    struct aws_mqtt5_client_binding *binding = connection_result_ud->binding;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_connection_failure_call - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, connection_result_ud->error_code, &params[1]), { goto done; });

        if (s_create_napi_connack_packet(env, connection_result_ud, &params[2])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_connection_failure_call - failed to create connack object",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_connection_failure, NULL, function, num_params, params));
    }

done:

    s_on_connection_result_user_data_destroy(connection_result_ud);
}

/* Builds a napi object that represents DISCONNECT packet, using the AwsMqtt5PacketDisconnect interface */
static int s_create_napi_disconnect_packet(
    napi_env env,
    const struct on_disconnection_user_data *disconnection_ud,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    if (!disconnection_ud->is_disconnect_valid) {
        AWS_NAPI_CALL(
            env, napi_get_null(env, packet_out), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });
        return AWS_OP_SUCCESS;
    }

    napi_value packet = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &packet), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_DISCONNECT)) {
        return AWS_OP_ERR;
    }

    const struct aws_mqtt5_packet_disconnect_view *disconnect_view = &disconnection_ud->disconnect_storage.storage_view;

    if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_REASON_CODE, disconnect_view->reason_code)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u32(
            packet,
            env,
            AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS,
            disconnect_view->session_expiry_interval_seconds)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_REASON_STRING, disconnect_view->reason_string)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            packet, env, disconnect_view->user_property_count, disconnect_view->user_properties)) {
        return AWS_OP_ERR;
    }

    *packet_out = packet;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the emission of a DISCONNECTION client lifecycle event */
static void s_napi_on_disconnection(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_disconnection_user_data *disconnection_ud = user_data;
    struct aws_mqtt5_client_binding *binding = disconnection_ud->binding;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_disconnection_call - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, disconnection_ud->error_code, &params[1]), { goto done; });

        if (s_create_napi_disconnect_packet(env, disconnection_ud, &params[2])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_on_disconnection_call - failed to create disconnect object",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(env, binding->on_disconnection, NULL, function, num_params, params));
    }

done:

    s_on_disconnection_user_data_destroy(disconnection_ud);
}

static int s_create_napi_publish_packet(
    napi_env env,
    struct on_message_received_user_data *message_received_ud,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    const struct aws_mqtt5_packet_publish_view *publish_view = &message_received_ud->publish_storage.storage_view;

    napi_value packet = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &packet), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_PUBLISH)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_string(packet, env, AWS_NAPI_KEY_TOPIC_NAME, publish_view->topic)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_binary_as_finalizable_external(
            packet, env, AWS_NAPI_KEY_PAYLOAD, message_received_ud->payload)) {
        return AWS_OP_ERR;
    }
    message_received_ud->payload = NULL;

    if (aws_napi_attach_object_property_u32(packet, env, AWS_NAPI_KEY_QOS, (uint32_t)publish_view->qos)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_boolean(packet, env, AWS_NAPI_KEY_RETAIN, publish_view->retain)) {
        return AWS_OP_ERR;
    }

    if (publish_view->payload_format != NULL) {
        if (aws_napi_attach_object_property_u32(
                packet, env, AWS_NAPI_KEY_PAYLOAD_FORMAT, (uint32_t)(*publish_view->payload_format))) {
            return AWS_OP_ERR;
        }
    }

    if (aws_napi_attach_object_property_optional_u32(
            packet, env, AWS_NAPI_KEY_MESSAGE_EXPIRY_INTERVAL_SECONDS, publish_view->message_expiry_interval_seconds)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_u16(
            packet, env, AWS_NAPI_KEY_TOPIC_ALIAS, publish_view->topic_alias)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_RESPONSE_TOPIC, publish_view->response_topic)) {
        return AWS_OP_ERR;
    }

    if (message_received_ud->correlation_data != NULL) {
        if (aws_napi_attach_object_property_binary_as_finalizable_external(
                packet, env, AWS_NAPI_KEY_CORRELATION_DATA, message_received_ud->correlation_data)) {
            return AWS_OP_ERR;
        }
        message_received_ud->correlation_data = NULL;
    }

    if (publish_view->subscription_identifier_count > 0) {
        napi_value subscription_identifier_array = NULL;
        AWS_NAPI_CALL(
            env,
            napi_create_array_with_length(
                env, publish_view->subscription_identifier_count, &subscription_identifier_array),
            { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

        for (size_t i = 0; i < publish_view->subscription_identifier_count; ++i) {
            uint32_t subscription_identifier = publish_view->subscription_identifiers[i];

            napi_value napi_subscription_identifier = NULL;
            AWS_NAPI_CALL(env, napi_create_uint32(env, subscription_identifier, &napi_subscription_identifier), {
                return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
            });

            AWS_NAPI_CALL(
                env, napi_set_element(env, subscription_identifier_array, (uint32_t)i, napi_subscription_identifier), {
                    return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
                });
        }

        AWS_NAPI_CALL(
            env,
            napi_set_named_property(env, packet, AWS_NAPI_KEY_SUSBCRIPTION_IDENTIFIERS, subscription_identifier_array),
            { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });
    }

    if (aws_napi_attach_object_property_optional_string(
            packet, env, AWS_NAPI_KEY_CONTENT_TYPE, publish_view->content_type)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            packet, env, publish_view->user_property_count, publish_view->user_properties)) {
        return AWS_OP_ERR;
    }

    *packet_out = packet;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the emission of a PUBLISH packet on the messageReceived event */
static void s_napi_on_message_received(napi_env env, napi_value function, void *context, void *user_data) {
    (void)context;

    struct on_message_received_user_data *on_message_received_ud = user_data;
    struct aws_mqtt5_client_binding *binding = on_message_received_ud->binding;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->node_mqtt5_client_ref, &params[0]) != napi_ok || params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_napi_on_message_received - mqtt5_client node wrapper no longer resolvable",
                (void *)binding->client);
            goto done;
        }

        if (s_create_napi_publish_packet(env, on_message_received_ud, &params[1])) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_napi_on_message_received - failed to create publish object",
                (void *)binding->client);
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_message_received, NULL, function, num_params, params));
    }

done:

    s_on_message_received_user_data_destroy(on_message_received_ud);
}

/*
 * Persistent storage for user properties.
 */
struct aws_napi_mqtt5_user_property_storage {
    struct aws_array_list user_properties;
    struct aws_byte_buf user_property_storage;
};

/* Extract a set of user properties from a Napi object. */
static int s_aws_mqtt5_user_properties_extract_from_js_object(
    struct aws_mqtt5_client_binding *binding,
    struct aws_napi_mqtt5_user_property_storage *user_properties_storage,
    napi_env env,
    napi_value node_container,
    size_t *user_property_count_out,
    const struct aws_mqtt5_user_property **user_properties_out) {

    napi_value node_user_properties = NULL;
    enum aws_napi_get_named_property_result gpr = aws_napi_get_named_property(
        env, node_container, AWS_NAPI_KEY_USER_PROPERTIES, napi_object, &node_user_properties);
    if (gpr != AWS_NGNPR_VALID_VALUE) {
        return (gpr == AWS_NGNPR_NO_VALUE) ? AWS_OP_SUCCESS : AWS_OP_ERR;
    }

    if (aws_napi_is_null_or_undefined(env, node_user_properties)) {
        return AWS_OP_SUCCESS;
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();

    /* len of js array */
    uint32_t user_property_count = 0;
    AWS_NAPI_CALL(env, napi_get_array_length(env, node_user_properties, &user_property_count), {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_mqtt5_user_properties_extract_from_js_object - user properties is not an array",
            (void *)binding->client);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    });

    /* compute storage size */
    size_t total_property_length = 0;
    for (uint32_t i = 0; i < user_property_count; ++i) {
        napi_value array_element;
        AWS_NAPI_CALL(env, napi_get_element(env, node_user_properties, i, &array_element), {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_aws_mqtt5_user_properties_extract_from_js_object - user properties is not indexable",
                (void *)binding->client);
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        struct aws_byte_buf name_buf;
        AWS_ZERO_STRUCT(name_buf);
        struct aws_byte_buf value_buf;
        AWS_ZERO_STRUCT(value_buf);

        enum aws_napi_get_named_property_result name_gpr =
            aws_napi_get_named_property_as_bytebuf(env, array_element, AWS_NAPI_KEY_NAME, napi_string, &name_buf);
        enum aws_napi_get_named_property_result value_gpr =
            aws_napi_get_named_property_as_bytebuf(env, array_element, AWS_NAPI_KEY_VALUE, napi_string, &value_buf);

        total_property_length += name_buf.len + value_buf.len;

        aws_byte_buf_clean_up(&name_buf);
        aws_byte_buf_clean_up(&value_buf);

        if (name_gpr != AWS_NGNPR_VALID_VALUE || value_gpr != AWS_NGNPR_VALID_VALUE) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_aws_mqtt5_user_properties_extract_from_js_object - malformed property name/value pair",
                (void *)binding->client);
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        }
    }

    /* allocate space */
    if (aws_array_list_init_dynamic(
            &user_properties_storage->user_properties,
            allocator,
            user_property_count,
            sizeof(struct aws_mqtt5_user_property))) {
        return AWS_OP_ERR;
    }

    if (aws_byte_buf_init(&user_properties_storage->user_property_storage, allocator, total_property_length)) {
        return AWS_OP_ERR;
    }

    /* persist each property */
    for (uint32_t i = 0; i < user_property_count; ++i) {
        napi_value array_element;
        AWS_NAPI_CALL(env, napi_get_element(env, node_user_properties, i, &array_element), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        struct aws_byte_buf name_buf;
        AWS_ZERO_STRUCT(name_buf);
        struct aws_byte_buf value_buf;
        AWS_ZERO_STRUCT(value_buf);

        aws_napi_get_named_property_as_bytebuf(env, array_element, AWS_NAPI_KEY_NAME, napi_string, &name_buf);
        aws_napi_get_named_property_as_bytebuf(env, array_element, AWS_NAPI_KEY_VALUE, napi_string, &value_buf);

        struct aws_mqtt5_user_property user_property;
        AWS_ZERO_STRUCT(user_property);

        user_property.name = aws_byte_cursor_from_buf(&name_buf);
        user_property.value = aws_byte_cursor_from_buf(&value_buf);

        bool success =
            aws_byte_buf_append_and_update(&user_properties_storage->user_property_storage, &user_property.name) ==
                AWS_OP_SUCCESS &&
            aws_byte_buf_append_and_update(&user_properties_storage->user_property_storage, &user_property.value) ==
                AWS_OP_SUCCESS;

        aws_byte_buf_clean_up(&name_buf);
        aws_byte_buf_clean_up(&value_buf);

        if (!success) {
            return AWS_OP_ERR;
        }

        aws_array_list_push_back(&user_properties_storage->user_properties, &user_property);
    }

    *user_property_count_out = user_property_count;
    *user_properties_out = user_properties_storage->user_properties.data;

    return AWS_OP_SUCCESS;
}

static void s_aws_mqtt5_user_properties_clean_up(struct aws_napi_mqtt5_user_property_storage *user_properties_storage) {
    aws_array_list_clean_up(&user_properties_storage->user_properties);
    aws_byte_buf_clean_up(&user_properties_storage->user_property_storage);
}

/*
 * Persistent storage for a publish packet.
 */
struct aws_napi_mqtt5_publish_storage {
    struct aws_byte_buf topic;
    struct aws_byte_buf payload;

    enum aws_mqtt5_payload_format_indicator payload_format;
    uint32_t message_expiry_interval_seconds;
    uint16_t topic_alias;

    struct aws_byte_buf response_topic;
    struct aws_byte_cursor response_topic_cursor;

    struct aws_byte_buf correlation_data;
    struct aws_byte_cursor correlation_data_cursor;

    struct aws_byte_buf content_type;
    struct aws_byte_cursor content_type_cursor;

    struct aws_napi_mqtt5_user_property_storage user_properties;
};

static void s_aws_napi_mqtt5_publish_storage_clean_up(struct aws_napi_mqtt5_publish_storage *storage) {
    aws_byte_buf_clean_up(&storage->topic);
    aws_byte_buf_clean_up(&storage->payload);
    aws_byte_buf_clean_up(&storage->response_topic);
    aws_byte_buf_clean_up(&storage->correlation_data);
    aws_byte_buf_clean_up(&storage->content_type);

    s_aws_mqtt5_user_properties_clean_up(&storage->user_properties);
}

static void s_log_get_property_error(
    void *context,
    const char *function_name,
    const char *message,
    const char *property_name) {
    AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "id=%p %s - %s: %s", context, function_name, message, property_name);
}

#define PARSE_REQUIRED_NAPI_PROPERTY(property_name, function_name, call_expression, success_block)                     \
    {                                                                                                                  \
        enum aws_napi_get_named_property_result gpr = call_expression;                                                 \
        if (gpr == AWS_NGNPR_VALID_VALUE) {                                                                            \
            success_block;                                                                                             \
        } else if (gpr == AWS_NGNPR_INVALID_VALUE) {                                                                   \
            s_log_get_property_error(                                                                                  \
                (void *)binding->client, function_name, "invalid value for property", property_name);                  \
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                        \
        } else {                                                                                                       \
            s_log_get_property_error(                                                                                  \
                (void *)binding->client, function_name, "failed to extract required property", property_name);         \
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                        \
        }                                                                                                              \
    }

#define PARSE_OPTIONAL_NAPI_PROPERTY(property_name, function_name, call_expression, success_block)                     \
    {                                                                                                                  \
        enum aws_napi_get_named_property_result gpr = call_expression;                                                 \
        if (gpr == AWS_NGNPR_VALID_VALUE) {                                                                            \
            success_block;                                                                                             \
        } else if (gpr == AWS_NGNPR_INVALID_VALUE) {                                                                   \
            s_log_get_property_error(                                                                                  \
                (void *)binding->client, function_name, "invalid value for property", property_name);                  \
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);                                                        \
        }                                                                                                              \
    }

/* Extract a PUBLISH packet view from a Napi object (AwsMqtt5PacketPublish) and persist its data in storage. */
static int s_init_publish_options_from_napi(
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_publish_config,
    struct aws_mqtt5_packet_publish_view *publish_options,
    struct aws_napi_mqtt5_publish_storage *publish_storage) {

    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_TOPIC_NAME,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_publish_config, AWS_NAPI_KEY_TOPIC_NAME, napi_string, &publish_storage->topic),
        { publish_options->topic = aws_byte_cursor_from_buf(&publish_storage->topic); });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_PAYLOAD,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_publish_config, AWS_NAPI_KEY_PAYLOAD, napi_undefined, &publish_storage->payload),
        { publish_options->payload = aws_byte_cursor_from_buf(&publish_storage->payload); });

    uint32_t qos = 0;
    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_QOS,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_uint32(env, node_publish_config, AWS_NAPI_KEY_QOS, &qos),
        { publish_options->qos = qos; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RETAIN,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_boolean(env, node_publish_config, AWS_NAPI_KEY_RETAIN, &publish_options->retain),
        {});

    uint32_t payload_format = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_PAYLOAD_FORMAT,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_uint32(env, node_publish_config, AWS_NAPI_KEY_PAYLOAD_FORMAT, &payload_format),
        {
            publish_storage->payload_format = payload_format;
            publish_options->payload_format = &publish_storage->payload_format;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_MESSAGE_EXPIRY_INTERVAL_SECONDS,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env,
            node_publish_config,
            AWS_NAPI_KEY_MESSAGE_EXPIRY_INTERVAL_SECONDS,
            &publish_storage->message_expiry_interval_seconds),
        { publish_options->message_expiry_interval_seconds = &publish_storage->message_expiry_interval_seconds; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_TOPIC_ALIAS,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_uint16(
            env, node_publish_config, AWS_NAPI_KEY_TOPIC_ALIAS, &publish_storage->topic_alias),
        { publish_options->topic_alias = &publish_storage->topic_alias; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RESPONSE_TOPIC,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_publish_config, AWS_NAPI_KEY_RESPONSE_TOPIC, napi_string, &publish_storage->response_topic),
        {
            publish_storage->response_topic_cursor = aws_byte_cursor_from_buf(&publish_storage->response_topic);
            publish_options->response_topic = &publish_storage->response_topic_cursor;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_CORRELATION_DATA,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env,
            node_publish_config,
            AWS_NAPI_KEY_CORRELATION_DATA,
            napi_undefined,
            &publish_storage->correlation_data),
        {
            publish_storage->correlation_data_cursor = aws_byte_cursor_from_buf(&publish_storage->correlation_data);
            publish_options->correlation_data = &publish_storage->correlation_data_cursor;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_CONTENT_TYPE,
        "s_init_publish_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_publish_config, AWS_NAPI_KEY_CONTENT_TYPE, napi_string, &publish_storage->content_type),
        {
            publish_storage->content_type_cursor = aws_byte_cursor_from_buf(&publish_storage->content_type);
            publish_options->content_type = &publish_storage->content_type_cursor;
        });

    if (s_aws_mqtt5_user_properties_extract_from_js_object(
            binding,
            &publish_storage->user_properties,
            env,
            node_publish_config,
            &publish_options->user_property_count,
            &publish_options->user_properties)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_init_publish_options_from_napi - failed to extract userProperties",
            (void *)binding->client);
        return AWS_OP_ERR;
    }

    return AWS_OP_SUCCESS;
}

/* Persistent storage for a CONNECT packet. */
struct aws_napi_mqtt5_connect_storage {
    struct aws_byte_buf client_id;
    struct aws_byte_cursor client_id_cursor;

    struct aws_byte_buf username;
    struct aws_byte_cursor username_cursor;

    struct aws_byte_buf password;
    struct aws_byte_cursor password_cursor;

    uint32_t session_expiry_interval_seconds;
    uint8_t request_response_information;
    uint8_t request_problem_information;
    uint16_t receive_maximum;
    uint32_t maximum_packet_size_bytes;
    uint32_t will_delay_interval_seconds;

    struct aws_napi_mqtt5_publish_storage will_storage;

    struct aws_napi_mqtt5_user_property_storage user_properties;
};

static void s_aws_napi_mqtt5_connect_storage_clean_up(struct aws_napi_mqtt5_connect_storage *storage) {
    aws_byte_buf_clean_up(&storage->client_id);
    aws_byte_buf_clean_up(&storage->username);
    aws_byte_buf_clean_up(&storage->password);

    s_aws_napi_mqtt5_publish_storage_clean_up(&storage->will_storage);

    s_aws_mqtt5_user_properties_clean_up(&storage->user_properties);
}

/* Extract a CONNECT packet view from a Napi object (AwsMqtt5PacketConnect) and persist its data in storage. */
static int s_init_connect_options_from_napi(
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_connect_config,
    struct aws_mqtt5_packet_connect_view *connect_options,
    struct aws_mqtt5_packet_publish_view *will_options,
    struct aws_napi_mqtt5_connect_storage *connect_storage) {

    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_KEEP_ALIVE_INTERVAL_SECONDS,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_uint16(
            env,
            node_connect_config,
            AWS_NAPI_KEY_KEEP_ALIVE_INTERVAL_SECONDS,
            &connect_options->keep_alive_interval_seconds),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_CLIENT_ID,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_connect_config, AWS_NAPI_KEY_CLIENT_ID, napi_string, &connect_storage->client_id),
        { connect_options->client_id = aws_byte_cursor_from_buf(&connect_storage->client_id); });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_USERNAME,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_connect_config, AWS_NAPI_KEY_USERNAME, napi_string, &connect_storage->username),
        {
            connect_storage->username_cursor = aws_byte_cursor_from_buf(&connect_storage->username);
            connect_options->username = &connect_storage->username_cursor;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_PASSWORD,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_bytebuf(
            env, node_connect_config, AWS_NAPI_KEY_PASSWORD, napi_undefined, &connect_storage->password),
        {
            connect_storage->password_cursor = aws_byte_cursor_from_buf(&connect_storage->password);
            connect_options->password = &connect_storage->password_cursor;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env,
            node_connect_config,
            AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS,
            &connect_storage->session_expiry_interval_seconds),
        { connect_options->session_expiry_interval_seconds = &connect_storage->session_expiry_interval_seconds; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_REQUEST_RESPONSE_INFORMATION,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_boolean_as_uint8(
            env,
            node_connect_config,
            AWS_NAPI_KEY_REQUEST_RESPONSE_INFORMATION,
            &connect_storage->request_response_information),
        { connect_options->request_response_information = &connect_storage->request_response_information; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_REQUEST_PROBLEM_INFORMATION,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_boolean_as_uint8(
            env,
            node_connect_config,
            AWS_NAPI_KEY_REQUEST_PROBLEM_INFORMATION,
            &connect_storage->request_problem_information),
        { connect_options->request_problem_information = &connect_storage->request_problem_information; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RECEIVE_MAXIMUM,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_uint16(
            env, node_connect_config, AWS_NAPI_KEY_RECEIVE_MAXIMUM, &connect_storage->receive_maximum),
        { connect_options->receive_maximum = &connect_storage->receive_maximum; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE_BYTES,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env,
            node_connect_config,
            AWS_NAPI_KEY_MAXIMUM_PACKET_SIZE_BYTES,
            &connect_storage->maximum_packet_size_bytes),
        { connect_options->maximum_packet_size_bytes = &connect_storage->maximum_packet_size_bytes; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_WILL_DELAY_INTERVAL_SECONDS,
        "s_init_connect_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env,
            node_connect_config,
            AWS_NAPI_KEY_WILL_DELAY_INTERVAL_SECONDS,
            &connect_storage->will_delay_interval_seconds),
        { connect_options->will_delay_interval_seconds = &connect_storage->will_delay_interval_seconds; });

    napi_value napi_will = NULL;
    if (AWS_NGNPR_VALID_VALUE ==
        aws_napi_get_named_property(env, node_connect_config, AWS_NAPI_KEY_WILL, napi_object, &napi_will)) {
        if (!aws_napi_is_null_or_undefined(env, napi_will)) {
            if (s_init_publish_options_from_napi(
                    binding, env, napi_will, will_options, &connect_storage->will_storage)) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "s_init_connect_options_from_napi - failed to destructure will properties");
                return AWS_OP_ERR;
            }

            connect_options->will = will_options;
        }
    }

    if (s_aws_mqtt5_user_properties_extract_from_js_object(
            binding,
            &connect_storage->user_properties,
            env,
            node_connect_config,
            &connect_options->user_property_count,
            &connect_options->user_properties)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL, "s_init_connect_options_from_napi - failed to extract userProperties");
        return AWS_OP_ERR;
    }

    return AWS_OP_SUCCESS;
}

/* Extract topic aliasing configuration from a node object */
static int s_init_topic_aliasing_options_from_napi(
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_topic_aliasing_config,
    struct aws_mqtt5_client_topic_alias_options *topic_aliasing_options) {

    uint32_t outbound_behavior = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_OUTBOUND_BEHAVIOR,
        "s_init_topic_aliasing_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env, node_topic_aliasing_config, AWS_NAPI_KEY_OUTBOUND_BEHAVIOR, (uint32_t *)&outbound_behavior),
        {
            topic_aliasing_options->outbound_topic_alias_behavior =
                (enum aws_mqtt5_client_outbound_topic_alias_behavior_type)outbound_behavior;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_OUTBOUND_CACHE_MAX_SIZE,
        "s_init_topic_aliasing_options_from_napi",
        aws_napi_get_named_property_as_uint16(
            env,
            node_topic_aliasing_config,
            AWS_NAPI_KEY_OUTBOUND_CACHE_MAX_SIZE,
            &topic_aliasing_options->outbound_alias_cache_max_size),
        {});

    uint32_t inbound_behavior = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_INBOUND_BEHAVIOR,
        "s_init_topic_aliasing_options_from_napi",
        aws_napi_get_named_property_as_uint32(
            env, node_topic_aliasing_config, AWS_NAPI_KEY_INBOUND_BEHAVIOR, (uint32_t *)&inbound_behavior),
        {
            topic_aliasing_options->inbound_topic_alias_behavior =
                (enum aws_mqtt5_client_inbound_topic_alias_behavior_type)inbound_behavior;
        });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_INBOUND_CACHE_MAX_SIZE,
        "s_init_topic_aliasing_options_from_napi",
        aws_napi_get_named_property_as_uint16(
            env,
            node_topic_aliasing_config,
            AWS_NAPI_KEY_INBOUND_CACHE_MAX_SIZE,
            &topic_aliasing_options->inbound_alias_cache_size),
        {});

    return AWS_OP_SUCCESS;
}

/*
 * Persistent storage for mqtt5 client options
 */
struct aws_napi_mqtt5_client_creation_storage {
    struct aws_byte_buf host_name;

    struct aws_napi_mqtt5_connect_storage connect_storage;
};

static void s_aws_napi_mqtt5_client_creation_storage_clean_up(struct aws_napi_mqtt5_client_creation_storage *storage) {
    aws_byte_buf_clean_up(&storage->host_name);

    s_aws_napi_mqtt5_connect_storage_clean_up(&storage->connect_storage);
}

/* persistent storage for all the data necessary to transform the websocket handshake */
struct mqtt5_transform_websocket_args {
    struct aws_allocator *allocator;
    struct aws_mqtt5_client_binding *binding;

    struct aws_http_message *request;

    aws_mqtt5_transform_websocket_handshake_complete_fn *complete_fn;
    void *complete_ctx;
};

static void s_mqtt5_transform_websocket_args_destroy(struct mqtt5_transform_websocket_args *args) {
    if (args == NULL) {
        return;
    }

    args->binding = s_aws_mqtt5_client_binding_release(args->binding);

    aws_mem_release(args->allocator, args);
}

/* invoked from node once the JS handshake transform callback has completed */
static napi_value s_napi_mqtt5_transform_websocket_complete(napi_env env, napi_callback_info cb_info) {

    struct mqtt5_transform_websocket_args *args = NULL;
    int error_code = AWS_ERROR_SUCCESS;

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, cb_info, &num_args, node_args, NULL, (void **)&args), {
        napi_throw_error(env, NULL, "mqtt5_transform_websocket_complete - Failed to retrieve callback information");
        goto cleanup;
    });
    if (num_args > 1) {
        napi_throw_error(env, NULL, "mqtt5_transform_websocket_complete - needs exactly 0 or 1 arguments");
        goto cleanup;
    }

    napi_value node_error_code = *arg++;
    /* If the user didn't provide an error_code, the napi_value will be undefined, so we can ignore it */
    if (!aws_napi_is_null_or_undefined(env, node_error_code)) {
        AWS_NAPI_CALL(env, napi_get_value_int32(env, node_error_code, &error_code), {
            napi_throw_type_error(
                env, NULL, "mqtt5_transform_websocket_complete - error_code must be a number or undefined");
            goto cleanup;
        });
    }

    args->complete_fn(args->request, error_code, args->complete_ctx);

cleanup:

    s_mqtt5_transform_websocket_args_destroy(args);

    return NULL;
}

/* in-node/libuv-thread function to trigger websocket handshake transform callback */
static void s_napi_mqtt5_transform_websocket(
    napi_env env,
    napi_value transform_websocket,
    void *context,
    void *user_data) {

    (void)context;
    struct mqtt5_transform_websocket_args *args = user_data;

    if (env) {
        napi_value params[2];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        AWS_NAPI_ENSURE(env, aws_napi_http_message_wrap(env, args->request, &params[0]));
        AWS_NAPI_ENSURE(
            env,
            napi_create_function(
                env,
                "mqtt5_transform_websocket_complete",
                NAPI_AUTO_LENGTH,
                &s_napi_mqtt5_transform_websocket_complete,
                args,
                &params[1]));

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, args->binding->transform_websocket, NULL, transform_websocket, num_params, params));
    } else {
        args->complete_fn(args->request, AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV, args->complete_ctx);

        s_mqtt5_transform_websocket_args_destroy(args);
    }
}

static void s_mqtt5_transform_websocket(
    struct aws_http_message *request,
    void *user_data,
    aws_mqtt5_transform_websocket_handshake_complete_fn *complete_fn,
    void *complete_ctx) {

    struct aws_mqtt5_client_binding *binding = user_data;

    struct mqtt5_transform_websocket_args *args =
        aws_mem_calloc(binding->allocator, 1, sizeof(struct mqtt5_transform_websocket_args));

    args->binding = s_aws_mqtt5_client_binding_acquire(binding);
    args->allocator = binding->allocator;
    args->request = request;
    args->complete_fn = complete_fn;
    args->complete_ctx = complete_ctx;

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->transform_websocket, args));
}

/* Extracts all mqtt5 client configuration from a napi Mqtt5ClientConfig object */
static int s_init_client_configuration_from_js_client_configuration(
    napi_env env,
    napi_value node_client_config,
    struct aws_mqtt5_client_binding *binding,
    struct aws_mqtt5_client_options *client_options,
    struct aws_mqtt5_packet_connect_view *connect_options,
    struct aws_mqtt5_packet_publish_view *will_options,
    struct aws_mqtt5_client_topic_alias_options *topic_aliasing_options,
    struct aws_napi_mqtt5_client_creation_storage *options_storage) {

    /* required config parameters */
    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_HOST_NAME,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_bytebuf(
            env, node_client_config, AWS_NAPI_KEY_HOST_NAME, napi_string, &options_storage->host_name),
        { client_options->host_name = aws_byte_cursor_from_buf(&options_storage->host_name); });

    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_PORT,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(env, node_client_config, AWS_NAPI_KEY_PORT, &client_options->port),
        {});

    /* optional config parameters */
    uint32_t session_behavior = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_SESSION_BEHAVIOR,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_SESSION_BEHAVIOR, (uint32_t *)&session_behavior),
        { client_options->session_behavior = (enum aws_mqtt5_client_session_behavior_type)session_behavior; });

    uint32_t extended_validation_and_flow_control_behavior = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_EXTENDED_VALIDATION_AND_FLOW_CONTROL_OPTIONS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env,
            node_client_config,
            AWS_NAPI_KEY_EXTENDED_VALIDATION_AND_FLOW_CONTROL_OPTIONS,
            (uint32_t *)&extended_validation_and_flow_control_behavior),
        {
            client_options->extended_validation_and_flow_control_options =
                (enum aws_mqtt5_extended_validation_and_flow_control_options)
                    extended_validation_and_flow_control_behavior;
        });

    uint32_t offline_queue_behavior = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_OFFLINE_QUEUE_BEHAVIOR,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_OFFLINE_QUEUE_BEHAVIOR, (uint32_t *)&offline_queue_behavior),
        {
            client_options->offline_queue_behavior =
                (enum aws_mqtt5_client_operation_queue_behavior_type)offline_queue_behavior;
        });

    uint32_t retry_jitter_mode = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RETRY_JITTER_MODE,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_RETRY_JITTER_MODE, (uint32_t *)&retry_jitter_mode),
        { client_options->retry_jitter_mode = (enum aws_exponential_backoff_jitter_mode)retry_jitter_mode; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_MIN_RECONNECT_DELAY_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint64(
            env, node_client_config, AWS_NAPI_KEY_MIN_RECONNECT_DELAY_MS, &client_options->min_reconnect_delay_ms),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_MAX_RECONNECT_DELAY_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint64(
            env, node_client_config, AWS_NAPI_KEY_MAX_RECONNECT_DELAY_MS, &client_options->max_reconnect_delay_ms),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_MIN_CONNECTED_TIME_TO_RESET_RECONNECT_DELAY_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint64(
            env,
            node_client_config,
            AWS_NAPI_KEY_MIN_CONNECTED_TIME_TO_RESET_RECONNECT_DELAY_MS,
            &client_options->min_connected_time_to_reset_reconnect_delay_ms),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_PING_TIMEOUT_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_PING_TIMEOUT_MS, &client_options->ping_timeout_ms),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_CONNACK_TIMEOUT_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_CONNACK_TIMEOUT_MS, &client_options->connack_timeout_ms),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_CONNACK_TIMEOUT_MS,
        "s_init_client_configuration_from_js_client_configuration",
        aws_napi_get_named_property_as_uint32(
            env, node_client_config, AWS_NAPI_KEY_ACK_TIMEOUT_SECONDS, &client_options->ack_timeout_seconds),
        {});

    napi_value napi_value_connect = NULL;
    if (AWS_NGNPR_VALID_VALUE ==
        aws_napi_get_named_property(
            env, node_client_config, AWS_NAPI_KEY_CONNECT_PROPERTIES, napi_object, &napi_value_connect)) {
        if (s_init_connect_options_from_napi(
                binding, env, napi_value_connect, connect_options, will_options, &options_storage->connect_storage)) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_init_client_configuration_from_js_client_configuration - failed to destructure connect properties");
            return AWS_OP_ERR;
        }
    }

    napi_value napi_value_topic_aliasing_options = NULL;
    if (AWS_NGNPR_VALID_VALUE == aws_napi_get_named_property(
                                     env,
                                     node_client_config,
                                     AWS_NAPI_KEY_TOPIC_ALIASING_OPTIONS,
                                     napi_object,
                                     &napi_value_topic_aliasing_options)) {
        if (s_init_topic_aliasing_options_from_napi(
                binding, env, napi_value_topic_aliasing_options, topic_aliasing_options)) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_init_client_configuration_from_js_client_configuration - failed to destructure topic aliasing "
                "properties");
            return AWS_OP_ERR;
        }

        client_options->topic_aliasing_options = topic_aliasing_options;
    }

    napi_value node_transform_websocket = NULL;
    if (AWS_NGNPR_VALID_VALUE == aws_napi_get_named_property(
                                     env,
                                     node_client_config,
                                     AWS_NAPI_KEY_WEBSOCKET_HANDSHAKE_TRANSFORM,
                                     napi_function,
                                     &node_transform_websocket)) {
        if (!aws_napi_is_null_or_undefined(env, node_transform_websocket)) {
            AWS_NAPI_CALL(
                env,
                aws_napi_create_threadsafe_function(
                    env,
                    node_transform_websocket,
                    "aws_mqtt5_client_transform_websocket",
                    s_napi_mqtt5_transform_websocket,
                    binding,
                    &binding->transform_websocket),
                { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

            client_options->websocket_handshake_transform = s_mqtt5_transform_websocket;
            client_options->websocket_handshake_transform_user_data = binding;
        }
    }

    return AWS_OP_SUCCESS;
}

static int s_init_event_handler_threadsafe_function(
    napi_env env,
    napi_value node_event_handler,
    const char *threadsafe_name,
    napi_threadsafe_function_call_js callback_function,
    napi_threadsafe_function *function_out) {

    AWS_FATAL_ASSERT(function_out != NULL && *function_out == NULL);

    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env, node_event_handler, threadsafe_name, callback_function, NULL, function_out),
        { return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT); });

    return AWS_OP_SUCCESS;
}

/*
 * Shared configuration defaults.  These are required parameters at the C level, but we make them optional and give
 * them sensible defaults at the binding level.
 */
static const uint16_t s_default_mqtt_keep_alive_interval_seconds = 1200;

static void s_init_default_mqtt5_client_options(
    struct aws_mqtt5_client_options *client_options,
    struct aws_mqtt5_packet_connect_view *connect_options) {

    connect_options->keep_alive_interval_seconds = s_default_mqtt_keep_alive_interval_seconds;
    client_options->connect_options = connect_options;
}

napi_value aws_napi_mqtt5_client_new(napi_env env, napi_callback_info info) {

    napi_value node_args[12];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "mqtt5_client_new - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - needs exactly 12 arguments");
        return NULL;
    }

    napi_value napi_client_wrapper = NULL;
    napi_value node_external = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    struct aws_mqtt5_client_binding *binding = aws_mem_calloc(allocator, 1, sizeof(struct aws_mqtt5_client_binding));
    binding->allocator = allocator;
    aws_ref_count_init(&binding->ref_count, binding, s_aws_mqtt5_client_binding_on_zero);

    AWS_NAPI_CALL(env, napi_create_external(env, binding, s_aws_mqtt5_client_extern_finalize, NULL, &node_external), {
        aws_mem_release(allocator, binding);
        napi_throw_error(env, NULL, "mqtt5_client_new - Failed to create n-api external");
        goto cleanup;
    });

    struct aws_mqtt5_client_options client_options;
    AWS_ZERO_STRUCT(client_options);

    struct aws_mqtt5_packet_connect_view connect_options;
    AWS_ZERO_STRUCT(connect_options);

    struct aws_mqtt5_packet_publish_view will_options;
    AWS_ZERO_STRUCT(will_options);

    struct aws_mqtt5_client_topic_alias_options topic_aliasing_options;
    AWS_ZERO_STRUCT(topic_aliasing_options);

    struct aws_napi_mqtt5_client_creation_storage options_storage;
    AWS_ZERO_STRUCT(options_storage);

    s_init_default_mqtt5_client_options(&client_options, &connect_options);

    /* Arg #1: the mqtt5 client */
    napi_value node_client = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_client)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - Required client parameter is null");
        goto cleanup;
    }

    AWS_NAPI_CALL(env, napi_create_reference(env, node_client, 1, &binding->node_mqtt5_client_ref), {
        napi_throw_error(env, NULL, "mqtt5_client_new - Failed to create reference to node mqtt5 client");
        goto cleanup;
    });

    /* Arg #2: the mqtt5 client config object */
    napi_value node_client_config = *arg++;
    if (aws_napi_is_null_or_undefined(env, node_client_config)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - Required configuration parameter is null");
        goto cleanup;
    }

    if (s_init_client_configuration_from_js_client_configuration(
            env,
            node_client_config,
            binding,
            &client_options,
            &connect_options,
            &will_options,
            &topic_aliasing_options,
            &options_storage)) {
        napi_throw_error(
            env,
            NULL,
            "mqtt5_client_new - failed to initialize native client configuration from js client configuration");
        goto cleanup;
    }

    /* Arg #3: on stopped event */
    napi_value on_stopped_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_stopped_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_stopped event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env, on_stopped_event_handler, "aws_mqtt5_client_on_stopped", s_napi_on_stopped, &binding->on_stopped)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_stopped event handler");
        goto cleanup;
    }

    /* Arg #4: on attempting connect event */
    napi_value on_attempting_connect_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_attempting_connect_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_attempting_connect event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env,
            on_attempting_connect_event_handler,
            "aws_mqtt5_client_on_attempting_connect",
            s_napi_on_attempting_connect,
            &binding->on_attempting_connect)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_attempting_connect event handler");
        goto cleanup;
    }

    /* Arg #5: on connection success event */
    napi_value on_connection_success_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_connection_success_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_connection_success event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env,
            on_connection_success_event_handler,
            "aws_mqtt5_client_on_connection_success",
            s_napi_on_connection_success,
            &binding->on_connection_success)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_connection_success event handler");
        goto cleanup;
    }

    /* Arg #6: on connection failure event */
    napi_value on_connection_failure_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_connection_failure_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_connection_failure event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env,
            on_connection_failure_event_handler,
            "aws_mqtt5_client_on_connection_failure",
            s_napi_on_connection_failure,
            &binding->on_connection_failure)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_connection_failure event handler");
        goto cleanup;
    }

    /* Arg #7: on disconnection event */
    napi_value on_disconnection_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_disconnection_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_disconnection event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env,
            on_disconnection_event_handler,
            "aws_mqtt5_client_on_disconnection",
            s_napi_on_disconnection,
            &binding->on_disconnection)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_disconnection event handler");
        goto cleanup;
    }

    /* Arg #8: on message received event */
    napi_value on_message_received_event_handler = *arg++;
    if (aws_napi_is_null_or_undefined(env, on_message_received_event_handler)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - required on_message_received event handler is null");
        goto cleanup;
    }

    if (s_init_event_handler_threadsafe_function(
            env,
            on_message_received_event_handler,
            "aws_mqtt5_client_on_message_received",
            s_napi_on_message_received,
            &binding->on_message_received)) {
        napi_throw_error(env, NULL, "mqtt5_client_new - failed to initialize on_message_received event handler");
        goto cleanup;
    }

    /* Arg #9: client bootstrap */
    napi_value node_client_bootstrap = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_client_bootstrap)) {
        struct client_bootstrap_binding *client_bootstrap_binding = NULL;
        napi_get_value_external(env, node_client_bootstrap, (void **)&client_bootstrap_binding);

        client_options.bootstrap = aws_napi_get_client_bootstrap(client_bootstrap_binding);
    }

    if (client_options.bootstrap == NULL) {
        client_options.bootstrap = aws_napi_get_default_client_bootstrap();
    }

    /* Arg #10: socket options */
    napi_value node_socket_options = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_socket_options)) {
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_socket_options, (void **)&client_options.socket_options), {
            napi_throw_error(env, NULL, "mqtt5_client_new - Unable to extract socket_options from external");
            goto cleanup;
        });
    }

    /* Arg #11: tls options */
    napi_value node_tls = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_tls)) {
        struct aws_tls_ctx *tls_ctx;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_tls, (void **)&tls_ctx), {
            napi_throw_error(env, NULL, "mqtt5_client_new - Failed to extract tls_ctx from external");
            goto cleanup;
        });

        aws_tls_connection_options_init_from_ctx(&binding->tls_connection_options, tls_ctx);

        client_options.tls_options = &binding->tls_connection_options;
    }

    /* Arg #12: http proxy options */
    napi_value node_proxy_options = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_proxy_options)) {
        struct http_proxy_options_binding *proxy_binding = NULL;
        AWS_NAPI_CALL(env, napi_get_value_external(env, node_proxy_options, (void **)&proxy_binding), {
            napi_throw_type_error(env, NULL, "mqtt5_client_new - failed to extract http proxy options from external");
            goto cleanup;
        });
        /* proxy_options are copied internally, no need to go nuts on copies */
        client_options.http_proxy_options = aws_napi_get_http_proxy_options(proxy_binding);
    }

    client_options.publish_received_handler = s_on_publish_received;
    client_options.publish_received_handler_user_data = binding;

    client_options.lifecycle_event_handler = s_lifecycle_event_callback;
    client_options.lifecycle_event_handler_user_data = binding;

    client_options.client_termination_handler = s_aws_mqtt5_client_binding_on_client_terminate;
    client_options.client_termination_handler_user_data = binding;

    binding->client = aws_mqtt5_client_new(allocator, &client_options);
    if (binding->client == NULL) {
        aws_napi_throw_last_error_with_context(env, "mqtt5_client_new - failed to create client");
        goto cleanup;
    }

    AWS_NAPI_CALL(env, napi_create_reference(env, node_external, 1, &binding->node_client_external_ref), {
        napi_throw_error(env, NULL, "mqtt5_client_new - Failed to create one count reference to napi external");
        goto cleanup;
    });

    napi_client_wrapper = node_external;

cleanup:

    s_aws_napi_mqtt5_client_creation_storage_clean_up(&options_storage);

    return napi_client_wrapper;
}

napi_value aws_napi_mqtt5_client_start(napi_env env, napi_callback_info info) {

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_start - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_start - needs exactly 1 argument");
        return NULL;
    }

    struct aws_mqtt5_client_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_start - Failed to extract client binding from first argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_start - binding was null");
        return NULL;
    }

    if (binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_start - client was null");
        return NULL;
    }

    if (aws_mqtt5_client_start(binding->client)) {
        aws_napi_throw_last_error_with_context(
            env, "aws_napi_mqtt5_client_start - Failure invoking aws_mqtt5_client_start");
        return NULL;
    }

    return NULL;
}

/* Persistent storage for a DISCONNECT packet. */
struct aws_napi_mqtt5_packet_disconnect_storage {
    uint32_t session_expiry_interval_seconds;

    struct aws_byte_buf reason_string;
    struct aws_byte_cursor reason_string_cursor;

    struct aws_napi_mqtt5_user_property_storage user_properties;

    struct aws_byte_buf server_reference;
    struct aws_byte_cursor server_reference_cursor;
};

static void s_aws_napi_mqtt5_packet_disconnect_storage_clean_up(
    struct aws_napi_mqtt5_packet_disconnect_storage *storage) {
    aws_byte_buf_clean_up(&storage->reason_string);

    s_aws_mqtt5_user_properties_clean_up(&storage->user_properties);

    aws_byte_buf_clean_up(&storage->server_reference);
}

/* Extract a DISCONNECT packet view from a Napi object (AwsMqtt5PacketDisconnect) and persist its data in storage. */
static int s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object(
    struct aws_mqtt5_client_binding *binding,
    struct aws_napi_mqtt5_packet_disconnect_storage *disconnect_storage,
    struct aws_mqtt5_packet_disconnect_view *disconnect_packet,
    napi_env env,
    napi_value node_disconnect_packet) {
    uint32_t reason_code = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_REASON_CODE,
        "s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object",
        aws_napi_get_named_property_as_uint32(
            env, node_disconnect_packet, AWS_NAPI_KEY_REASON_CODE, (uint32_t *)&reason_code),
        { disconnect_packet->reason_code = (enum aws_mqtt5_disconnect_reason_code)reason_code; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS,
        "s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object",
        aws_napi_get_named_property_as_uint32(
            env,
            node_disconnect_packet,
            AWS_NAPI_KEY_SESSION_EXPIRY_INTERVAL_SECONDS,
            &disconnect_storage->session_expiry_interval_seconds),
        { disconnect_packet->session_expiry_interval_seconds = &disconnect_storage->session_expiry_interval_seconds; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_REASON_STRING,
        "s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object",
        aws_napi_get_named_property_as_bytebuf(
            env, node_disconnect_packet, AWS_NAPI_KEY_REASON_STRING, napi_string, &disconnect_storage->reason_string),
        {
            disconnect_storage->reason_string_cursor = aws_byte_cursor_from_buf(&disconnect_storage->reason_string);
            disconnect_packet->reason_string = &disconnect_storage->reason_string_cursor;
        });

    if (s_aws_mqtt5_user_properties_extract_from_js_object(
            binding,
            &disconnect_storage->user_properties,
            env,
            node_disconnect_packet,
            &disconnect_packet->user_property_count,
            &disconnect_packet->user_properties)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object - failed to extract "
            "userProperties",
            (void *)binding->client);
        return AWS_OP_ERR;
    }

    /* Intentionally ignore server reference because it's a client error to send it */

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_mqtt5_client_stop(napi_env env, napi_callback_info info) {

    napi_value node_args[2];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_stop - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_stop - needs exactly 2 arguments");
        return NULL;
    }

    struct aws_mqtt5_client_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_stop - Failed to extract client binding from first argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_stop - binding was null");
        return NULL;
    }

    if (binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_stop - client was null");
        return NULL;
    }

    struct aws_napi_mqtt5_packet_disconnect_storage disconnect_storage;
    AWS_ZERO_STRUCT(disconnect_storage);

    struct aws_mqtt5_packet_disconnect_view *disconnect_view_ptr = NULL;
    struct aws_mqtt5_packet_disconnect_view disconnect_view;
    AWS_ZERO_STRUCT(disconnect_view);

    napi_value node_disconnect_packet = *arg++;
    if (!aws_napi_is_null_or_undefined(env, node_disconnect_packet)) {
        if (s_aws_napi_mqtt5_packet_disconnect_storage_initialize_from_js_object(
                binding, &disconnect_storage, &disconnect_view, env, node_disconnect_packet)) {
            napi_throw_error(env, NULL, "aws_napi_mqtt5_client_stop - could not initialize disconnect packet");
            goto done;
        }

        disconnect_view_ptr = &disconnect_view;
    }

    if (aws_mqtt5_client_stop(binding->client, disconnect_view_ptr, NULL)) {
        aws_napi_throw_last_error_with_context(
            env, "aws_napi_mqtt5_client_stop - Failure invoking aws_mqtt5_client_stop");
        goto done;
    }

done:

    s_aws_napi_mqtt5_packet_disconnect_storage_clean_up(&disconnect_storage);

    return NULL;
}

struct aws_napi_mqtt5_operation_binding {
    struct aws_allocator *allocator;

    struct aws_mqtt5_client_binding *client_binding;

    napi_threadsafe_function on_operation_completion;

    int error_code;

    enum aws_mqtt5_packet_type valid_storage;

    union {
        struct aws_mqtt5_packet_suback_storage suback;
        struct aws_mqtt5_packet_puback_storage puback;
        struct aws_mqtt5_packet_unsuback_storage unsuback;
    } packet_storage;
};

static void s_aws_napi_mqtt5_operation_binding_destroy(struct aws_napi_mqtt5_operation_binding *binding) {
    if (binding == NULL) {
        return;
    }

    binding->client_binding = s_aws_mqtt5_client_binding_release(binding->client_binding);

    AWS_CLEAN_THREADSAFE_FUNCTION(binding, on_operation_completion);

    switch (binding->valid_storage) {
        case AWS_MQTT5_PT_SUBACK:
            aws_mqtt5_packet_suback_storage_clean_up(&binding->packet_storage.suback);
            break;

        case AWS_MQTT5_PT_PUBACK:
            aws_mqtt5_packet_puback_storage_clean_up(&binding->packet_storage.puback);
            break;

        case AWS_MQTT5_PT_UNSUBACK:
            aws_mqtt5_packet_unsuback_storage_clean_up(&binding->packet_storage.unsuback);
            break;

        default:
            break;
    }

    aws_mem_release(binding->allocator, binding);
}

static int s_create_napi_suback_packet(
    napi_env env,
    const struct aws_mqtt5_packet_suback_view *suback,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_suback = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_suback), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(napi_suback, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_SUBACK)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            napi_suback, env, AWS_NAPI_KEY_REASON_STRING, suback->reason_string)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            napi_suback, env, suback->user_property_count, suback->user_properties)) {
        return AWS_OP_ERR;
    }

    size_t reason_code_count = suback->reason_code_count;
    if (reason_code_count == 0) {
        AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "s_create_napi_suback_packet - missing reason codes");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    napi_value suback_code_array = NULL;
    AWS_NAPI_CALL(env, napi_create_array_with_length(env, reason_code_count, &suback_code_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    for (size_t i = 0; i < reason_code_count; ++i) {
        napi_value napi_reason_code = NULL;
        AWS_NAPI_CALL(env, napi_create_uint32(env, (uint32_t)suback->reason_codes[i], &napi_reason_code), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        AWS_NAPI_CALL(env, napi_set_element(env, suback_code_array, (uint32_t)i, napi_reason_code), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });
    }

    AWS_NAPI_CALL(env, napi_set_named_property(env, napi_suback, AWS_NAPI_KEY_REASON_CODES, suback_code_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    *packet_out = napi_suback;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the emission of an ATTEMPTING_CONNECT client lifecycle event */
static void s_napi_on_subscribe_complete(napi_env env, napi_value function, void *context, void *user_data) {
    (void)user_data;

    struct aws_napi_mqtt5_operation_binding *binding = context;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->client_binding->node_mqtt5_client_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_on_subscribe_complete - mqtt5_client node wrapper no longer resolvable");
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, binding->error_code, &params[1]), { goto done; });

        if (binding->valid_storage == AWS_MQTT5_PT_SUBACK) {
            if (s_create_napi_suback_packet(env, &binding->packet_storage.suback.storage_view, &params[2])) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_subscribe_complete - could not build suback napi value");
                goto done;
            }
        } else {
            if (napi_get_undefined(env, &params[2]) != napi_ok) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_subscribe_complete - could not get undefined napi value");
                goto done;
            }
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_operation_completion, NULL, function, num_params, params));
    }

done:

    s_aws_napi_mqtt5_operation_binding_destroy(binding);
}

static void s_on_subscribe_complete(
    const struct aws_mqtt5_packet_suback_view *suback,
    int error_code,
    void *complete_ctx) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_napi_mqtt5_operation_binding *binding = complete_ctx;

    binding->error_code = error_code;
    if (suback != NULL &&
        aws_mqtt5_packet_suback_storage_init(&binding->packet_storage.suback, allocator, suback) == AWS_OP_SUCCESS) {
        binding->valid_storage = AWS_MQTT5_PT_SUBACK;
    } else if (binding->error_code == AWS_ERROR_SUCCESS) {
        binding->error_code = aws_last_error();
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_operation_completion, binding));
}

struct aws_napi_mqtt5_subscribe_storage {
    struct aws_array_list subscriptions;
    struct aws_byte_buf topics;

    uint32_t subscription_identifier;

    struct aws_napi_mqtt5_user_property_storage user_properties;
};

static void s_aws_napi_mqtt5_subscribe_storage_clean_up(struct aws_napi_mqtt5_subscribe_storage *storage) {
    aws_array_list_clean_up(&storage->subscriptions);
    aws_byte_buf_clean_up(&storage->topics);

    s_aws_mqtt5_user_properties_clean_up(&storage->user_properties);
}

static int s_aws_mqtt5_subscription_init_from_napi(
    struct aws_mqtt5_subscription_view *subscription,
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_subscription) {

    uint32_t qos = 0;
    PARSE_REQUIRED_NAPI_PROPERTY(
        AWS_NAPI_KEY_QOS,
        "s_aws_mqtt5_subscription_init_from_napi",
        aws_napi_get_named_property_as_uint32(env, node_subscription, AWS_NAPI_KEY_QOS, &qos),
        { subscription->qos = qos; });

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_NO_LOCAL,
        "s_aws_mqtt5_subscription_init_from_napi",
        aws_napi_get_named_property_as_boolean(env, node_subscription, AWS_NAPI_KEY_NO_LOCAL, &subscription->no_local),
        {});

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RETAIN_AS_PUBLISHED,
        "s_aws_mqtt5_subscription_init_from_napi",
        aws_napi_get_named_property_as_boolean(
            env, node_subscription, AWS_NAPI_KEY_RETAIN_AS_PUBLISHED, &subscription->retain_as_published),
        {});

    uint32_t retain_handling_type = 0;
    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_RETAIN_HANDLING_TYPE,
        "s_aws_mqtt5_subscription_init_from_napi",
        aws_napi_get_named_property_as_uint32(
            env, node_subscription, AWS_NAPI_KEY_RETAIN_HANDLING_TYPE, &retain_handling_type),
        { subscription->retain_handling_type = retain_handling_type; });

    return AWS_OP_SUCCESS;
}

static int s_aws_mqtt5_packet_subscribe_storage_init_from_napi(
    struct aws_napi_mqtt5_subscribe_storage *subscribe_storage,
    struct aws_mqtt5_packet_subscribe_view *subscribe_view,
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_subscribe_packet) {
    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_subscriptions = NULL;
    if (AWS_NGNPR_VALID_VALUE !=
        aws_napi_get_named_property(
            env, node_subscribe_packet, AWS_NAPI_KEY_SUBSCRIPTIONS, napi_object, &napi_subscriptions)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_mqtt5_packet_subscribe_storage_init_from_napi - missing require parameter: subscriptions",
            (void *)binding->client);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    /* how many subscriptions and total topic length */
    uint32_t subscription_count = 0;
    AWS_NAPI_CALL(env, napi_get_array_length(env, napi_subscriptions, &subscription_count), {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_mqtt5_packet_subscribe_storage_init_from_napi - subscriptions is not an array",
            (void *)binding->client);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    });

    size_t topic_length_sum = 0;
    for (uint32_t i = 0; i < subscription_count; ++i) {
        napi_value napi_subscription = NULL;
        AWS_NAPI_CALL(env, napi_get_element(env, napi_subscriptions, i, &napi_subscription), { return AWS_OP_ERR; });

        struct aws_byte_buf topic_filter_buf;
        AWS_ZERO_STRUCT(topic_filter_buf);

        bool success = AWS_NGNPR_VALID_VALUE ==
                       aws_napi_get_named_property_as_bytebuf(
                           env, napi_subscription, AWS_NAPI_KEY_TOPIC_FILTER, napi_string, &topic_filter_buf);

        topic_length_sum += topic_filter_buf.len;

        aws_byte_buf_clean_up(&topic_filter_buf);
        if (!success) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "id=%p s_aws_mqtt5_packet_subscribe_storage_init_from_napi - missing require parameter: topicFilter",
                (void *)binding->client);
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        }
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();

    if (aws_array_list_init_dynamic(
            &subscribe_storage->subscriptions,
            allocator,
            subscription_count,
            sizeof(struct aws_mqtt5_subscription_view))) {
        return AWS_OP_ERR;
    }

    if (aws_byte_buf_init(&subscribe_storage->topics, allocator, topic_length_sum)) {
        return AWS_OP_ERR;
    }

    for (uint32_t i = 0; i < subscription_count; ++i) {
        napi_value napi_subscription = NULL;
        AWS_NAPI_CALL(env, napi_get_element(env, napi_subscriptions, i, &napi_subscription), { return AWS_OP_ERR; });

        struct aws_byte_buf topic_filter_buf;
        AWS_ZERO_STRUCT(topic_filter_buf);

        aws_napi_get_named_property_as_bytebuf(
            env, napi_subscription, AWS_NAPI_KEY_TOPIC_FILTER, napi_string, &topic_filter_buf);

        struct aws_mqtt5_subscription_view subscription;
        AWS_ZERO_STRUCT(subscription);

        subscription.topic_filter = aws_byte_cursor_from_buf(&topic_filter_buf);

        bool success =
            aws_byte_buf_append_and_update(&subscribe_storage->topics, &subscription.topic_filter) == AWS_OP_SUCCESS;

        aws_byte_buf_clean_up(&topic_filter_buf);

        if (!success || s_aws_mqtt5_subscription_init_from_napi(&subscription, binding, env, napi_subscription)) {
            return AWS_OP_ERR;
        }

        aws_array_list_push_back(&subscribe_storage->subscriptions, &subscription);
    }

    subscribe_view->subscription_count = subscription_count;
    subscribe_view->subscriptions = subscribe_storage->subscriptions.data;

    PARSE_OPTIONAL_NAPI_PROPERTY(
        AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIER,
        "s_aws_mqtt5_packet_subscribe_storage_init_from_napi",
        aws_napi_get_named_property_as_uint32(
            env,
            node_subscribe_packet,
            AWS_NAPI_KEY_SUBSCRIPTION_IDENTIFIER,
            &subscribe_storage->subscription_identifier),
        { subscribe_view->subscription_identifier = &subscribe_storage->subscription_identifier; });

    if (s_aws_mqtt5_user_properties_extract_from_js_object(
            binding,
            &subscribe_storage->user_properties,
            env,
            node_subscribe_packet,
            &subscribe_view->user_property_count,
            &subscribe_view->user_properties)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_mqtt5_packet_subscribe_storage_init_from_napi - failed to extract userProperties");
        return AWS_OP_ERR;
    }

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_mqtt5_client_subscribe(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - needs exactly 3 arguments");
        return NULL;
    }

    bool successful = false;
    struct aws_mqtt5_client_binding *client_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&client_binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_subscribe - Failed to extract client binding from first argument");
        return NULL;
    });

    if (client_binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - binding was null");
        return NULL;
    }

    if (client_binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - client was null");
        return NULL;
    }

    struct aws_napi_mqtt5_operation_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_napi_mqtt5_operation_binding));
    binding->allocator = allocator;
    binding->client_binding = s_aws_mqtt5_client_binding_acquire(client_binding);

    napi_value node_subscribe_packet = *arg++;

    struct aws_napi_mqtt5_subscribe_storage subscribe_storage;
    AWS_ZERO_STRUCT(subscribe_storage);
    struct aws_mqtt5_packet_subscribe_view subscribe_view;
    AWS_ZERO_STRUCT(subscribe_view);
    if (s_aws_mqtt5_packet_subscribe_storage_init_from_napi(
            &subscribe_storage, &subscribe_view, client_binding, env, node_subscribe_packet)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - storage init failure");
        goto done;
    }

    napi_value completion_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            completion_callback,
            "aws_mqtt5_on_subsription_complete",
            s_napi_on_subscribe_complete,
            binding,
            &binding->on_operation_completion),
        {
            napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - failed to create threadsafe function");
            goto done;
        });

    struct aws_mqtt5_subscribe_completion_options completion_options = {
        .completion_callback = s_on_subscribe_complete,
        .completion_user_data = binding,
    };

    if (aws_mqtt5_client_subscribe(client_binding->client, &subscribe_view, &completion_options)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_subscribe - failure invoking native client subscribe");
        goto done;
    }

    successful = true;

done:

    s_aws_napi_mqtt5_subscribe_storage_clean_up(&subscribe_storage);

    if (!successful) {
        s_aws_napi_mqtt5_operation_binding_destroy(binding);
    }

    return NULL;
}

static int s_create_napi_unsuback_packet(
    napi_env env,
    const struct aws_mqtt5_packet_unsuback_view *unsuback,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_unsuback = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_unsuback), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(napi_unsuback, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_UNSUBACK)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            napi_unsuback, env, AWS_NAPI_KEY_REASON_STRING, unsuback->reason_string)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            napi_unsuback, env, unsuback->user_property_count, unsuback->user_properties)) {
        return AWS_OP_ERR;
    }

    size_t reason_code_count = unsuback->reason_code_count;
    if (reason_code_count == 0) {
        AWS_LOGF_ERROR(AWS_LS_NODEJS_CRT_GENERAL, "s_create_napi_unsuback_packet - missing reason codes");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    napi_value unsuback_code_array = NULL;
    AWS_NAPI_CALL(env, napi_create_array_with_length(env, reason_code_count, &unsuback_code_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    for (size_t i = 0; i < reason_code_count; ++i) {
        napi_value napi_reason_code = NULL;
        AWS_NAPI_CALL(env, napi_create_uint32(env, (uint32_t)unsuback->reason_codes[i], &napi_reason_code), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });

        AWS_NAPI_CALL(env, napi_set_element(env, unsuback_code_array, (uint32_t)i, napi_reason_code), {
            return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
        });
    }

    AWS_NAPI_CALL(env, napi_set_named_property(env, napi_unsuback, AWS_NAPI_KEY_REASON_CODES, unsuback_code_array), {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE);
    });

    *packet_out = napi_unsuback;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the emission of an ATTEMPTING_CONNECT client lifecycle event */
static void s_napi_on_unsubscribe_complete(napi_env env, napi_value function, void *context, void *user_data) {
    (void)user_data;

    struct aws_napi_mqtt5_operation_binding *binding = context;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->client_binding->node_mqtt5_client_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_on_unsubscribe_complete - mqtt5_client node wrapper no longer resolvable");
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, binding->error_code, &params[1]), { goto done; });

        if (binding->valid_storage == AWS_MQTT5_PT_UNSUBACK) {
            if (s_create_napi_unsuback_packet(env, &binding->packet_storage.unsuback.storage_view, &params[2])) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_unsubscribe_complete - could not build suback napi value");
                goto done;
            }
        } else if (napi_get_undefined(env, &params[2]) != napi_ok) {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_unsubscribe_complete - could not get undefined napi_value");
            goto done;
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_operation_completion, NULL, function, num_params, params));
    }

done:

    s_aws_napi_mqtt5_operation_binding_destroy(binding);
}

static void s_on_unsubscribe_complete(
    const struct aws_mqtt5_packet_unsuback_view *unsuback,
    int error_code,
    void *complete_ctx) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_napi_mqtt5_operation_binding *binding = complete_ctx;

    binding->error_code = error_code;
    if (unsuback != NULL && aws_mqtt5_packet_unsuback_storage_init(
                                &binding->packet_storage.unsuback, allocator, unsuback) == AWS_OP_SUCCESS) {
        binding->valid_storage = AWS_MQTT5_PT_UNSUBACK;
    } else if (binding->error_code == AWS_ERROR_SUCCESS) {
        binding->error_code = aws_last_error();
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_operation_completion, binding));
}

struct aws_napi_mqtt5_unsubscribe_storage {
    struct aws_array_list topic_filter_cursors;
    struct aws_byte_buf topic_filters;

    struct aws_napi_mqtt5_user_property_storage user_properties;
};

static void s_aws_napi_mqtt5_unsubscribe_storage_clean_up(struct aws_napi_mqtt5_unsubscribe_storage *storage) {
    aws_array_list_clean_up(&storage->topic_filter_cursors);
    aws_byte_buf_clean_up(&storage->topic_filters);

    s_aws_mqtt5_user_properties_clean_up(&storage->user_properties);
}

static int s_aws_mqtt5_packet_unsubscribe_storage_init_from_napi(
    struct aws_napi_mqtt5_unsubscribe_storage *unsubscribe_storage,
    struct aws_mqtt5_packet_unsubscribe_view *unsubscribe_view,
    struct aws_mqtt5_client_binding *binding,
    napi_env env,
    napi_value node_unsubscribe_packet) {
    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_topic_filters = NULL;
    if (AWS_NGNPR_VALID_VALUE !=
        aws_napi_get_named_property(
            env, node_unsubscribe_packet, AWS_NAPI_KEY_TOPIC_FILTERS, napi_object, &napi_topic_filters)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_mqtt5_packet_unsubscribe_storage_init_from_napi - missing require parameter: subscriptions",
            (void *)binding->client);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    /* how many topic filters and total topic filter length */
    uint32_t topic_filter_count = 0;
    AWS_NAPI_CALL(env, napi_get_array_length(env, napi_topic_filters, &topic_filter_count), {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "id=%p s_aws_mqtt5_packet_unsubscribe_storage_init_from_napi - topic filters is not an array",
            (void *)binding->client);
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    });

    size_t topic_filter_length_sum = 0;
    for (uint32_t i = 0; i < topic_filter_count; ++i) {
        napi_value napi_topic_filter = NULL;
        AWS_NAPI_CALL(env, napi_get_element(env, napi_topic_filters, i, &napi_topic_filter), { return AWS_OP_ERR; });

        struct aws_byte_buf topic_filter_buf;
        AWS_ZERO_STRUCT(topic_filter_buf);

        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&topic_filter_buf, env, napi_topic_filter), {
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        });

        topic_filter_length_sum += topic_filter_buf.len;

        aws_byte_buf_clean_up(&topic_filter_buf);
    }

    struct aws_allocator *allocator = aws_napi_get_allocator();

    if (aws_array_list_init_dynamic(
            &unsubscribe_storage->topic_filter_cursors,
            allocator,
            topic_filter_count,
            sizeof(struct aws_byte_cursor))) {
        return AWS_OP_ERR;
    }

    if (aws_byte_buf_init(&unsubscribe_storage->topic_filters, allocator, topic_filter_length_sum)) {
        return AWS_OP_ERR;
    }

    for (uint32_t i = 0; i < topic_filter_count; ++i) {
        napi_value napi_topic_filter = NULL;
        AWS_NAPI_CALL(env, napi_get_element(env, napi_topic_filters, i, &napi_topic_filter), { return AWS_OP_ERR; });

        struct aws_byte_buf topic_filter_buf;
        AWS_ZERO_STRUCT(topic_filter_buf);

        AWS_NAPI_CALL(env, aws_byte_buf_init_from_napi(&topic_filter_buf, env, napi_topic_filter), {
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        });

        struct aws_byte_cursor topic_filter = aws_byte_cursor_from_buf(&topic_filter_buf);

        bool success =
            aws_byte_buf_append_and_update(&unsubscribe_storage->topic_filters, &topic_filter) == AWS_OP_SUCCESS;

        aws_byte_buf_clean_up(&topic_filter_buf);

        if (!success) {
            return AWS_OP_ERR;
        }

        aws_array_list_push_back(&unsubscribe_storage->topic_filter_cursors, &topic_filter);
    }

    unsubscribe_view->topic_filter_count = topic_filter_count;
    unsubscribe_view->topic_filters = unsubscribe_storage->topic_filter_cursors.data;

    if (s_aws_mqtt5_user_properties_extract_from_js_object(
            binding,
            &unsubscribe_storage->user_properties,
            env,
            node_unsubscribe_packet,
            &unsubscribe_view->user_property_count,
            &unsubscribe_view->user_properties)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_mqtt5_packet_unsubscribe_storage_init_from_napi - failed to extract userProperties");
        return AWS_OP_ERR;
    }

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_mqtt5_client_unsubscribe(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - needs exactly 3 arguments");
        return NULL;
    }

    bool successful = false;
    struct aws_mqtt5_client_binding *client_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&client_binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_unsubscribe - Failed to extract client binding from first argument");
        return NULL;
    });

    if (client_binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - binding was null");
        return NULL;
    }

    if (client_binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - client was null");
        return NULL;
    }

    struct aws_napi_mqtt5_operation_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_napi_mqtt5_operation_binding));
    binding->allocator = allocator;
    binding->client_binding = s_aws_mqtt5_client_binding_acquire(client_binding);

    napi_value node_unsubscribe_packet = *arg++;

    struct aws_napi_mqtt5_unsubscribe_storage unsubscribe_storage;
    AWS_ZERO_STRUCT(unsubscribe_storage);
    struct aws_mqtt5_packet_unsubscribe_view unsubscribe_view;
    AWS_ZERO_STRUCT(unsubscribe_view);
    if (s_aws_mqtt5_packet_unsubscribe_storage_init_from_napi(
            &unsubscribe_storage, &unsubscribe_view, client_binding, env, node_unsubscribe_packet)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - storage init failure");
        goto done;
    }

    napi_value completion_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            completion_callback,
            "aws_mqtt5_on_unsubscribe_complete",
            s_napi_on_unsubscribe_complete,
            binding,
            &binding->on_operation_completion),
        {
            napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - failed to create threadsafe function");
            goto done;
        });

    struct aws_mqtt5_unsubscribe_completion_options completion_options = {
        .completion_callback = s_on_unsubscribe_complete,
        .completion_user_data = binding,
    };

    if (aws_mqtt5_client_unsubscribe(client_binding->client, &unsubscribe_view, &completion_options)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_unsubscribe - failure invoking native client unsubscribe");
        goto done;
    }

    successful = true;

done:

    s_aws_napi_mqtt5_unsubscribe_storage_clean_up(&unsubscribe_storage);

    if (!successful) {
        s_aws_napi_mqtt5_operation_binding_destroy(binding);
    }

    return NULL;
}

static int s_create_napi_puback_packet(
    napi_env env,
    const struct aws_mqtt5_packet_puback_view *puback,
    napi_value *packet_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_puback = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_puback), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u32(napi_puback, env, AWS_NAPI_KEY_TYPE, (uint32_t)AWS_MQTT5_PT_PUBACK)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u32(napi_puback, env, AWS_NAPI_KEY_REASON_CODE, puback->reason_code)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_optional_string(
            napi_puback, env, AWS_NAPI_KEY_REASON_STRING, puback->reason_string)) {
        return AWS_OP_ERR;
    }

    if (s_attach_object_property_user_properties(
            napi_puback, env, puback->user_property_count, puback->user_properties)) {
        return AWS_OP_ERR;
    }

    *packet_out = napi_puback;

    return AWS_OP_SUCCESS;
}

/* in-node/libuv-thread function to trigger the completion of a publish promise */
static void s_napi_on_publish_complete(napi_env env, napi_value function, void *context, void *user_data) {
    (void)user_data;

    struct aws_napi_mqtt5_operation_binding *binding = context;

    if (env) {
        napi_value params[3];
        const size_t num_params = AWS_ARRAY_SIZE(params);

        /*
         * If we can't resolve the weak ref to the mqtt5 client, then it's been garbage collected and we should not
         * do anything.
         */
        params[0] = NULL;
        if (napi_get_reference_value(env, binding->client_binding->node_mqtt5_client_ref, &params[0]) != napi_ok ||
            params[0] == NULL) {
            AWS_LOGF_INFO(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_napi_on_publish_complete - mqtt5_client node wrapper no longer resolvable");
            goto done;
        }

        AWS_NAPI_CALL(env, napi_create_uint32(env, binding->error_code, &params[1]), { goto done; });

        if (binding->valid_storage == AWS_MQTT5_PT_PUBACK) {
            if (s_create_napi_puback_packet(env, &binding->packet_storage.puback.storage_view, &params[2])) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_publish_complete - could not build puback napi_value");
                goto done;
            }
        } else {
            if (napi_get_undefined(env, &params[2]) != napi_ok) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL, "s_napi_on_publish_complete - could not get undefined napi_value");
                goto done;
            }
        }

        AWS_NAPI_ENSURE(
            env,
            aws_napi_dispatch_threadsafe_function(
                env, binding->on_operation_completion, NULL, function, num_params, params));
    }

done:

    s_aws_napi_mqtt5_operation_binding_destroy(binding);
}

static void s_on_publish_complete(
    enum aws_mqtt5_packet_type packet_type,
    const void *packet,
    int error_code,
    void *complete_ctx) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_napi_mqtt5_operation_binding *binding = complete_ctx;

    binding->error_code = error_code;

    if (packet_type == AWS_MQTT5_PT_PUBACK) {
        const struct aws_mqtt5_packet_puback_view *puback = packet;
        if (aws_mqtt5_packet_puback_storage_init(&binding->packet_storage.puback, allocator, puback) ==
            AWS_OP_SUCCESS) {
            binding->valid_storage = AWS_MQTT5_PT_PUBACK;
        } else if (binding->error_code == AWS_ERROR_SUCCESS) {
            binding->error_code = aws_last_error();
        }
    }

    /* queue a callback in node's libuv thread */
    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(binding->on_operation_completion, binding));
}

napi_value aws_napi_mqtt5_client_publish(napi_env env, napi_callback_info info) {
    struct aws_allocator *allocator = aws_napi_get_allocator();

    napi_value node_args[3];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - needs exactly 3 arguments");
        return NULL;
    }

    bool successful = false;
    struct aws_mqtt5_client_binding *client_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&client_binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_publish - Failed to extract client binding from first argument");
        return NULL;
    });

    if (client_binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - binding was null");
        return NULL;
    }

    if (client_binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - client was null");
        return NULL;
    }

    struct aws_napi_mqtt5_operation_binding *binding =
        aws_mem_calloc(allocator, 1, sizeof(struct aws_napi_mqtt5_operation_binding));
    binding->allocator = allocator;
    binding->client_binding = s_aws_mqtt5_client_binding_acquire(client_binding);

    napi_value node_publish_packet = *arg++;

    struct aws_napi_mqtt5_publish_storage publish_storage;
    AWS_ZERO_STRUCT(publish_storage);
    struct aws_mqtt5_packet_publish_view publish_view;
    AWS_ZERO_STRUCT(publish_view);
    if (s_init_publish_options_from_napi(client_binding, env, node_publish_packet, &publish_view, &publish_storage)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - storage init failure");
        goto done;
    }

    napi_value completion_callback = *arg++;
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            completion_callback,
            "aws_mqtt5_on_publish_complete",
            s_napi_on_publish_complete,
            binding,
            &binding->on_operation_completion),
        {
            napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - failed to create threadsafe function");
            goto done;
        });

    struct aws_mqtt5_publish_completion_options completion_options = {
        .completion_callback = s_on_publish_complete,
        .completion_user_data = binding,
    };

    if (aws_mqtt5_client_publish(client_binding->client, &publish_view, &completion_options)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_publish - failure invoking native client publish");
        goto done;
    }

    successful = true;

done:

    s_aws_napi_mqtt5_publish_storage_clean_up(&publish_storage);

    if (!successful) {
        s_aws_napi_mqtt5_operation_binding_destroy(binding);
    }

    return NULL;
}

static int s_create_napi_mqtt5_client_statistics(
    napi_env env,
    const struct aws_mqtt5_client_operation_statistics *stats,
    napi_value *stats_out) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    napi_value napi_stats = NULL;
    AWS_NAPI_CALL(
        env, napi_create_object(env, &napi_stats), { return aws_raise_error(AWS_CRT_NODEJS_ERROR_NAPI_FAILURE); });

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_INCOMPLETE_OPERATION_COUNT, stats->incomplete_operation_count)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_INCOMPLETE_OPERATION_SIZE, stats->incomplete_operation_size)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_UNACKED_OPERATION_COUNT, stats->unacked_operation_count)) {
        return AWS_OP_ERR;
    }

    if (aws_napi_attach_object_property_u64(
            napi_stats, env, AWS_NAPI_KEY_UNACKED_OPERATION_SIZE, stats->unacked_operation_size)) {
        return AWS_OP_ERR;
    };

    *stats_out = napi_stats;

    return AWS_OP_SUCCESS;
}

napi_value aws_napi_mqtt5_client_get_queue_statistics(napi_env env, napi_callback_info info) {

    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_get_queue_statistics - Failed to extract parameter array");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_get_queue_statistics - needs exactly 1 argument");
        return NULL;
    }

    struct aws_mqtt5_client_binding *client_binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&client_binding), {
        napi_throw_error(
            env,
            NULL,
            "aws_napi_mqtt5_client_get_queue_statistics - Failed to extract client binding from first argument");
        return NULL;
    });

    if (client_binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_get_queue_statistics - binding was null");
        return NULL;
    }

    if (client_binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_get_queue_statistics - client was null");
        return NULL;
    }

    struct aws_mqtt5_client_operation_statistics stats;
    AWS_ZERO_STRUCT(stats);

    aws_mqtt5_client_get_stats(client_binding->client, &stats);

    napi_value napi_stats = NULL;
    if (s_create_napi_mqtt5_client_statistics(env, &stats, &napi_stats)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_get_queue_statistics - failed to build statistics value");
        return NULL;
    }

    return napi_stats;
}

napi_value aws_napi_mqtt5_client_close(napi_env env, napi_callback_info info) {
    napi_value node_args[1];
    size_t num_args = AWS_ARRAY_SIZE(node_args);
    napi_value *arg = &node_args[0];
    AWS_NAPI_CALL(env, napi_get_cb_info(env, info, &num_args, node_args, NULL, NULL), {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_close - Failed to retrieve arguments");
        return NULL;
    });

    if (num_args != AWS_ARRAY_SIZE(node_args)) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_close - needs exactly 1 argument");
        return NULL;
    }

    struct aws_mqtt5_client_binding *binding = NULL;
    napi_value node_binding = *arg++;
    AWS_NAPI_CALL(env, napi_get_value_external(env, node_binding, (void **)&binding), {
        napi_throw_error(
            env, NULL, "aws_napi_mqtt5_client_close - Failed to extract client binding from first argument");
        return NULL;
    });

    if (binding == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_close - binding was null");
        return NULL;
    }

    if (binding->client == NULL) {
        napi_throw_error(env, NULL, "aws_napi_mqtt5_client_close - client was null");
        return NULL;
    }

    napi_ref node_client_external_ref = binding->node_client_external_ref;
    binding->node_client_external_ref = NULL;

    napi_ref node_mqtt5_client_ref = binding->node_mqtt5_client_ref;
    binding->node_mqtt5_client_ref = NULL;

    if (node_client_external_ref != NULL) {
        napi_delete_reference(env, node_client_external_ref);
    }

    if (node_mqtt5_client_ref != NULL) {
        napi_delete_reference(env, node_mqtt5_client_ref);
    }

    return NULL;
}
