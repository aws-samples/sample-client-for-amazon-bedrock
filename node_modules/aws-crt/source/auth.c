/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

#include "auth.h"

#include "class_binder.h"
#include "http_connection.h"
#include "http_message.h"
#include "io.h"

#include <aws/auth/credentials.h>
#include <aws/auth/signable.h>
#include <aws/auth/signing.h>
#include <aws/auth/signing_config.h>
#include <aws/auth/signing_result.h>

#include <aws/common/condition_variable.h>
#include <aws/common/mutex.h>

#include <aws/io/tls_channel_handler.h>

static const char *AWS_NAPI_KEY_ENDPOINT = "endpoint";
static const char *AWS_NAPI_KEY_IDENTITY = "identity";
static const char *AWS_NAPI_KEY_LOGINS = "logins";
static const char *AWS_NAPI_KEY_CUSTOM_ROLE_ARN = "customRoleArn";
static const char *AWS_NAPI_KEY_IDENTITY_PROVIDER_NAME = "identityProviderName";
static const char *AWS_NAPI_KEY_IDENTITY_PROVIDER_TOKEN = "identityProviderToken";
static const char *AWS_NAPI_KEY_THING_NAME = "thingName";
static const char *AWS_NAPI_KEY_ROLE_ALIAS = "roleAlias";

static struct aws_napi_class_info s_creds_provider_class_info;
static aws_napi_method_fn s_creds_provider_constructor;
static aws_napi_method_fn s_creds_provider_new_default;
static aws_napi_method_fn s_creds_provider_new_static;
static aws_napi_method_fn s_creds_provider_new_cognito;
static aws_napi_method_fn s_creds_provider_new_x509;

static aws_napi_method_fn s_aws_sign_request;
static aws_napi_method_fn s_aws_verify_sigv4a_signing;

napi_status aws_napi_auth_bind(napi_env env, napi_value exports) {
    static const struct aws_napi_method_info s_creds_provider_constructor_info = {
        .name = "AwsCredentialsProvider",
        .method = s_creds_provider_constructor,
        .num_arguments = 1,
        .arg_types = {napi_external},
    };

    static const struct aws_napi_method_info s_creds_provider_methods[] = {
        {
            .name = "newDefault",
            .method = s_creds_provider_new_default,
            .num_arguments = 1,
            .arg_types = {napi_undefined},
            .attributes = napi_static,
        },
        {
            .name = "newStatic",
            .method = s_creds_provider_new_static,
            .num_arguments = 2,
            .arg_types = {napi_string, napi_string, napi_string},
            .attributes = napi_static,
        },
        {
            .name = "newCognito",
            .method = s_creds_provider_new_cognito,
            .num_arguments = 4,
            .arg_types = {napi_undefined, napi_undefined, napi_undefined, napi_undefined},
            .attributes = napi_static,
        },
        {
            .name = "newX509",
            .method = s_creds_provider_new_x509,
            .num_arguments = 3,
            .arg_types = {napi_undefined, napi_undefined, napi_undefined},
            .attributes = napi_static,
        }};

    AWS_NAPI_CALL(
        env,
        aws_napi_define_class(
            env,
            exports,
            &s_creds_provider_constructor_info,
            NULL,
            0,
            s_creds_provider_methods,
            AWS_ARRAY_SIZE(s_creds_provider_methods),
            &s_creds_provider_class_info),
        { return status; });

    static struct aws_napi_method_info s_signer_request_method = {
        .name = "aws_sign_request",
        .method = s_aws_sign_request,
        .num_arguments = 3,
        .arg_types = {napi_object, napi_object, napi_function},
    };

    AWS_NAPI_CALL(env, aws_napi_define_function(env, exports, &s_signer_request_method), { return status; });

    static struct aws_napi_method_info s_verify_sigv4a_signing_method = {
        .name = "aws_verify_sigv4a_signing",
        .method = s_aws_verify_sigv4a_signing,
        .num_arguments = 6,
        .arg_types = {napi_object, napi_object, napi_string, napi_string, napi_string, napi_string},
    };

    AWS_NAPI_CALL(env, aws_napi_define_function(env, exports, &s_verify_sigv4a_signing_method), { return status; });

    return napi_ok;
}

/***********************************************************************************************************************
 * Credentials Provider
 **********************************************************************************************************************/

static void s_napi_creds_provider_finalize(napi_env env, void *finalize_data, void *finalize_hint) {
    (void)env;
    (void)finalize_hint;
    aws_credentials_provider_release(finalize_data);
}

napi_status aws_napi_credentials_provider_wrap(
    napi_env env,
    struct aws_credentials_provider *creds_provider,
    napi_value *result) {

    aws_credentials_provider_acquire(creds_provider);

    return aws_napi_wrap(env, &s_creds_provider_class_info, creds_provider, s_napi_creds_provider_finalize, result);
}

struct aws_credentials_provider *aws_napi_credentials_provider_unwrap(napi_env env, napi_value js_object) {
    struct aws_credentials_provider *creds_provider = NULL;
    AWS_NAPI_CALL(env, napi_unwrap(env, js_object, (void **)&creds_provider), { return NULL; });

    aws_credentials_provider_acquire(creds_provider);

    return creds_provider;
}

static napi_value s_creds_provider_constructor(napi_env env, const struct aws_napi_callback_info *cb_info) {

    (void)env;

    /* Don't do any construction, object should be empty except prototype and wrapped value */
    return cb_info->native_this;
}

static napi_value s_creds_provider_new_default(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 1);

    struct aws_allocator *allocator = aws_napi_get_allocator();
    const struct aws_napi_argument *arg = NULL;

    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    struct aws_credentials_provider_chain_default_options options;
    AWS_ZERO_STRUCT(options);

    if (arg->native.external != NULL) {
        options.bootstrap = aws_napi_get_client_bootstrap(arg->native.external);
    } else {
        options.bootstrap = aws_napi_get_default_client_bootstrap();
    }

    struct aws_credentials_provider *provider = aws_credentials_provider_new_chain_default(allocator, &options);

    napi_value node_this = NULL;
    AWS_NAPI_CALL(env, aws_napi_credentials_provider_wrap(env, provider, &node_this), {
        napi_throw_error(env, NULL, "Failed to wrap CredentialsProvider");
        return NULL;
    });

    /* Reference is now held by the node object */
    aws_credentials_provider_release(provider);

    return node_this;
}

static napi_value s_creds_provider_new_static(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args >= 2);

    struct aws_allocator *allocator = aws_napi_get_allocator();
    const struct aws_napi_argument *arg = NULL;

    struct aws_credentials_provider_static_options options;
    AWS_ZERO_STRUCT(options);

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    options.access_key_id = aws_byte_cursor_from_buf(&arg->native.string);

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    options.secret_access_key = aws_byte_cursor_from_buf(&arg->native.string);

    if (aws_napi_method_next_argument(napi_string, cb_info, &arg)) {
        options.session_token = aws_byte_cursor_from_buf(&arg->native.string);
    }

    struct aws_credentials_provider *provider = aws_credentials_provider_new_static(allocator, &options);

    napi_value node_this = NULL;
    AWS_NAPI_CALL(env, aws_napi_credentials_provider_wrap(env, provider, &node_this), {
        napi_throw_error(env, NULL, "Failed to wrap CredentialsProvider");
        return NULL;
    });

    /* Reference is now held by the node object */
    aws_credentials_provider_release(provider);

    return node_this;
}

struct aws_cognito_credentials_provider_config {
    struct aws_byte_buf endpoint;
    struct aws_byte_buf identity;

    struct aws_array_list logins;
    struct aws_array_list login_buffers;

    struct aws_byte_buf custom_role_arn;
};

static void s_aws_cognito_credentials_provider_config_clean_up(struct aws_cognito_credentials_provider_config *config) {
    aws_byte_buf_clean_up(&config->endpoint);
    aws_byte_buf_clean_up(&config->identity);

    aws_array_list_clean_up(&config->logins);

    for (size_t i = 0; i < aws_array_list_length(&config->login_buffers); ++i) {
        struct aws_byte_buf buffer;
        AWS_ZERO_STRUCT(buffer);

        aws_array_list_get_at(&config->login_buffers, &buffer, i);

        aws_byte_buf_clean_up(&buffer);
    }
    aws_array_list_clean_up(&config->login_buffers);

    aws_byte_buf_clean_up(&config->custom_role_arn);
}

static int s_aws_cognito_credentials_provider_config_init(
    struct aws_cognito_credentials_provider_config *config,
    napi_env env,
    napi_value node_config) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    int result = AWS_OP_ERR;
    struct aws_byte_buf identity_provider_name_buf;
    AWS_ZERO_STRUCT(identity_provider_name_buf);
    struct aws_byte_buf identity_provider_token_buf;
    AWS_ZERO_STRUCT(identity_provider_token_buf);

    struct aws_allocator *allocator = aws_napi_get_allocator();
    if (aws_array_list_init_dynamic(
            &config->logins, allocator, 0, sizeof(struct aws_cognito_identity_provider_token_pair)) ||
        aws_array_list_init_dynamic(&config->login_buffers, allocator, 0, sizeof(struct aws_byte_buf))) {
        return AWS_OP_ERR;
    }

    if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                     env, node_config, AWS_NAPI_KEY_ENDPOINT, napi_string, &config->endpoint)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_cognito_credentials_provider_config_init - required property 'endpoint' could not be extracted from "
            "config");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                     env, node_config, AWS_NAPI_KEY_IDENTITY, napi_string, &config->identity)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_cognito_credentials_provider_config_init - required property 'identity' could not be extracted from "
            "config");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    napi_value napi_logins = NULL;
    if (AWS_NGNPR_VALID_VALUE ==
        aws_napi_get_named_property(env, node_config, AWS_NAPI_KEY_LOGINS, napi_object, &napi_logins)) {

        /* how many login entries */
        uint32_t login_count = 0;
        AWS_NAPI_CALL(env, napi_get_array_length(env, napi_logins, &login_count), {
            AWS_LOGF_ERROR(
                AWS_LS_NODEJS_CRT_GENERAL,
                "s_aws_cognito_credentials_provider_config_init - property 'logins' must be an array");
            return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        });

        for (size_t i = 0; i < login_count; ++i) {

            napi_value napi_token_pair = NULL;
            AWS_NAPI_CALL(env, napi_get_element(env, napi_logins, (uint32_t)i, &napi_token_pair), {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "s_aws_cognito_credentials_provider_config_init - could not access property 'logins' array "
                    "element");
                aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
                goto done;
            });

            if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                             env,
                                             napi_token_pair,
                                             AWS_NAPI_KEY_IDENTITY_PROVIDER_NAME,
                                             napi_string,
                                             &identity_provider_name_buf)) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "s_aws_cognito_credentials_provider_config_init - required property 'identityProviderName' missing "
                    "from login token pair");
                aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
                goto done;
            }

            if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                             env,
                                             napi_token_pair,
                                             AWS_NAPI_KEY_IDENTITY_PROVIDER_TOKEN,
                                             napi_string,
                                             &identity_provider_token_buf)) {
                AWS_LOGF_ERROR(
                    AWS_LS_NODEJS_CRT_GENERAL,
                    "s_aws_cognito_credentials_provider_config_init - required property 'identityProviderToken' "
                    "missing from login token pair");
                aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
                goto done;
            }

            struct aws_byte_cursor identity_provider_name_cursor =
                aws_byte_cursor_from_buf(&identity_provider_name_buf);
            if (aws_array_list_push_back(&config->login_buffers, &identity_provider_name_buf)) {
                goto done;
            }

            AWS_ZERO_STRUCT(identity_provider_name_buf);

            struct aws_byte_cursor identity_provider_token_cursor =
                aws_byte_cursor_from_buf(&identity_provider_token_buf);
            if (aws_array_list_push_back(&config->login_buffers, &identity_provider_token_buf)) {
                goto done;
            }

            AWS_ZERO_STRUCT(identity_provider_token_buf);

            struct aws_cognito_identity_provider_token_pair config_token_pair = {
                .identity_provider_name = identity_provider_name_cursor,
                .identity_provider_token = identity_provider_token_cursor,
            };

            if (aws_array_list_push_back(&config->logins, &config_token_pair)) {
                goto done;
            }
        }
    }

    if (AWS_NGNPR_INVALID_VALUE ==
        aws_napi_get_named_property_as_bytebuf(
            env, node_config, AWS_NAPI_KEY_CUSTOM_ROLE_ARN, napi_string, &config->custom_role_arn)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_cognito_credentials_provider_config_init - optional property 'customRoleArn' could not be extracted "
            "from "
            "config");
        aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
        goto done;
    }

    result = AWS_OP_SUCCESS;

done:

    /* we carefully ensure that we only hit here with buffers that failed to be added to the login_buffers array */
    aws_byte_buf_clean_up(&identity_provider_name_buf);
    aws_byte_buf_clean_up(&identity_provider_token_buf);

    return result;
}

static napi_value s_creds_provider_new_cognito(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 4);

    napi_value node_provider = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_credentials_provider *provider = NULL;
    struct aws_cognito_credentials_provider_config provider_config;
    AWS_ZERO_STRUCT(provider_config);

    struct aws_credentials_provider_cognito_options options;
    AWS_ZERO_STRUCT(options);

    const struct aws_napi_argument *arg = NULL;

    aws_napi_method_next_argument(napi_undefined, cb_info, &arg);
    napi_value first_argument = arg->node;

    if (s_aws_cognito_credentials_provider_config_init(&provider_config, env, first_argument)) {
        napi_throw_error(env, NULL, "Failed to initialize cognito provider configuration from node config");
        goto done;
    }

    options.endpoint = aws_byte_cursor_from_buf(&provider_config.endpoint);
    options.identity = aws_byte_cursor_from_buf(&provider_config.identity);
    options.login_count = aws_array_list_length(&provider_config.logins);
    options.logins = provider_config.logins.data;

    struct aws_byte_cursor custom_role_arn_cursor;
    AWS_ZERO_STRUCT(custom_role_arn_cursor);
    if (provider_config.custom_role_arn.len > 0) {
        custom_role_arn_cursor = aws_byte_cursor_from_buf(&provider_config.custom_role_arn);
        options.custom_role_arn = &custom_role_arn_cursor;
    }

    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    AWS_NAPI_CALL(env, napi_get_value_external(env, arg->node, (void **)&options.tls_ctx), {
        napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
        goto done;
    });

    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    if (arg->native.external != NULL) {
        options.bootstrap = aws_napi_get_client_bootstrap(arg->native.external);
    } else {
        options.bootstrap = aws_napi_get_default_client_bootstrap();
    }

    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    if (arg->native.external != NULL) {
        options.http_proxy_options = aws_napi_get_http_proxy_options(arg->native.external);
    }

    provider = aws_credentials_provider_new_cognito_caching(allocator, &options);
    if (provider == NULL) {
        napi_throw_error(env, NULL, "Failed to create native Cognito Credentials Provider");
        goto done;
    }

    AWS_NAPI_CALL(env, aws_napi_credentials_provider_wrap(env, provider, &node_provider), {
        napi_throw_error(env, NULL, "Failed to wrap CognitoCredentialsProvider");
        goto done;
    });

done:

    s_aws_cognito_credentials_provider_config_clean_up(&provider_config);

    aws_credentials_provider_release(provider);

    return node_provider;
}

struct aws_x509_credentials_provider_config {
    struct aws_byte_buf endpoint;
    struct aws_byte_buf thing_name;
    struct aws_byte_buf role_alias;
};

static void s_aws_x509_credentials_provider_config_clean_up(struct aws_x509_credentials_provider_config *config) {
    aws_byte_buf_clean_up(&config->endpoint);
    aws_byte_buf_clean_up(&config->thing_name);
    aws_byte_buf_clean_up(&config->role_alias);
}

static int s_aws_x509_credentials_provider_config_init(
    struct aws_x509_credentials_provider_config *config,
    napi_env env,
    napi_value node_config) {

    if (env == NULL) {
        return aws_raise_error(AWS_CRT_NODEJS_ERROR_THREADSAFE_FUNCTION_NULL_NAPI_ENV);
    }

    if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                     env, node_config, AWS_NAPI_KEY_ENDPOINT, napi_string, &config->endpoint)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_x509_credentials_provider_config_init - required property 'endpoint' could not be extracted from "
            "config");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                     env, node_config, AWS_NAPI_KEY_THING_NAME, napi_string, &config->thing_name)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_x509_credentials_provider_config_init - required property 'thing_name' could not be extracted from "
            "config");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    if (AWS_NGNPR_VALID_VALUE != aws_napi_get_named_property_as_bytebuf(
                                     env, node_config, AWS_NAPI_KEY_ROLE_ALIAS, napi_string, &config->role_alias)) {
        AWS_LOGF_ERROR(
            AWS_LS_NODEJS_CRT_GENERAL,
            "s_aws_x509_credentials_provider_config_init - required property 'role_alias' could not be extracted from "
            "config");
        return aws_raise_error(AWS_ERROR_INVALID_ARGUMENT);
    }

    return AWS_OP_SUCCESS;
}

static napi_value s_creds_provider_new_x509(napi_env env, const struct aws_napi_callback_info *cb_info) {

    AWS_FATAL_ASSERT(cb_info->num_args == 3);

    napi_value node_provider = NULL;
    struct aws_allocator *allocator = aws_napi_get_allocator();
    struct aws_credentials_provider *provider = NULL;
    struct aws_x509_credentials_provider_config provider_config;
    AWS_ZERO_STRUCT(provider_config);
    struct aws_tls_connection_options tls_connection_options;
    AWS_ZERO_STRUCT(tls_connection_options);

    struct aws_credentials_provider_x509_options options;
    AWS_ZERO_STRUCT(options);

    const struct aws_napi_argument *arg = NULL;

    aws_napi_method_next_argument(napi_undefined, cb_info, &arg);
    napi_value first_argument = arg->node;

    if (s_aws_x509_credentials_provider_config_init(&provider_config, env, first_argument)) {
        napi_throw_error(env, NULL, "Failed to initialize x509 provider configuration from node config");
        goto done;
    }

    options.endpoint = aws_byte_cursor_from_buf(&provider_config.endpoint);
    options.thing_name = aws_byte_cursor_from_buf(&provider_config.thing_name);
    options.role_alias = aws_byte_cursor_from_buf(&provider_config.role_alias);

    struct aws_tls_ctx *tls_context = NULL;
    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    AWS_NAPI_CALL(env, napi_get_value_external(env, arg->node, (void **)&tls_context), {
        napi_throw_error(env, NULL, "Failed to extract tls_ctx from external");
        goto done;
    });
    if (tls_context != NULL) {
        aws_tls_connection_options_init_from_ctx(&tls_connection_options, tls_context);
        options.tls_connection_options = &tls_connection_options;
    } else {
        napi_throw_error(env, NULL, "Failed to extract and set tls_ctx from external");
        goto done;
    }

    /* Always use the default bootstrap */
    options.bootstrap = aws_napi_get_default_client_bootstrap();

    aws_napi_method_next_argument(napi_external, cb_info, &arg);
    if (arg->native.external != NULL) {
        options.proxy_options = aws_napi_get_http_proxy_options(arg->native.external);
    }

    provider = aws_credentials_provider_new_x509(allocator, &options);
    if (provider == NULL) {
        napi_throw_error(env, NULL, "Failed to create native X509 Credentials Provider");
        goto done;
    }

    AWS_NAPI_CALL(env, aws_napi_credentials_provider_wrap(env, provider, &node_provider), {
        napi_throw_error(env, NULL, "Failed to wrap X509CredentialsProvider");
        goto done;
    });

done:
    aws_tls_connection_options_clean_up(&tls_connection_options);
    s_aws_x509_credentials_provider_config_clean_up(&provider_config);
    aws_credentials_provider_release(provider);
    return node_provider;
}

/***********************************************************************************************************************
 * Signing
 **********************************************************************************************************************/

struct signer_sign_request_state {
    napi_ref node_request;
    struct aws_http_message *request;
    struct aws_signable *signable;

    /**
     * aws_string *
     * this exists so that when should_sign_param is called from off thread, we don't have to hit Node every single
     * time
     */
    struct aws_array_list header_blacklist;

    napi_threadsafe_function on_complete;

    int error_code;
};

static bool s_should_sign_header(const struct aws_byte_cursor *name, void *userdata) {
    struct signer_sign_request_state *state = userdata;

    /* If there are params in the black_list, check them all */
    if (state->header_blacklist.length) {
        const size_t num_blacklisted = aws_array_list_length(&state->header_blacklist);
        for (size_t i = 0; i < num_blacklisted; ++i) {
            struct aws_string *blacklisted = NULL;
            aws_array_list_get_at(&state->header_blacklist, &blacklisted, i);
            AWS_ASSUME(blacklisted);

            if (aws_string_eq_byte_cursor_ignore_case(blacklisted, name)) {
                return false;
            }
        }
    }

    return true;
}

static void s_destroy_signing_binding(
    napi_env env,
    struct aws_allocator *allocator,
    struct signer_sign_request_state *binding) {
    if (binding == NULL) {
        return;
    }

    /* Release references */
    napi_delete_reference(env, binding->node_request);

    const size_t num_blacklisted = binding->header_blacklist.length;
    for (size_t i = 0; i < num_blacklisted; ++i) {
        struct aws_string *blacklisted = NULL;
        aws_array_list_get_at(&binding->header_blacklist, &blacklisted, i);
        aws_string_destroy(blacklisted);
    }
    aws_array_list_clean_up(&binding->header_blacklist);

    aws_signable_destroy(binding->signable);

    AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(binding->on_complete, napi_tsfn_abort));
    aws_mem_release(allocator, binding);
}

static void s_aws_sign_request_complete_call(napi_env env, napi_value on_complete, void *context, void *user_data) {

    struct signer_sign_request_state *state = context;
    struct aws_allocator *allocator = user_data;

    napi_value args[1];
    AWS_NAPI_ENSURE(env, napi_create_int32(env, state->error_code, &args[0]));

    AWS_NAPI_ENSURE(
        env,
        aws_napi_dispatch_threadsafe_function(env, state->on_complete, NULL, on_complete, AWS_ARRAY_SIZE(args), args));

    s_destroy_signing_binding(env, allocator, state);
}

static void s_aws_sign_request_complete(struct aws_signing_result *result, int error_code, void *userdata) {

    struct signer_sign_request_state *state = userdata;
    struct aws_allocator *allocator = aws_napi_get_allocator();

    state->error_code = error_code;
    if (error_code == AWS_ERROR_SUCCESS) {
        aws_apply_signing_result_to_http_request(state->request, allocator, result);
    }

    AWS_NAPI_ENSURE(NULL, aws_napi_queue_threadsafe_function(state->on_complete, allocator));
}

static int s_get_config_from_js_config(
    napi_env env,
    struct aws_signing_config_aws *config,
    napi_value js_config,
    struct aws_byte_buf *region_buf,
    struct aws_byte_buf *service_buf,
    struct aws_byte_buf *signed_body_value_buf,
    struct signer_sign_request_state *state,
    struct aws_allocator *allocator) {

    config->config_type = AWS_SIGNING_CONFIG_AWS;
    int result = AWS_OP_SUCCESS;

    napi_value current_value = NULL;
    /* Get algorithm */
    if (aws_napi_get_named_property(env, js_config, "algorithm", napi_number, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        int32_t algorithm_int = 0;
        napi_get_value_int32(env, current_value, &algorithm_int);
        if (algorithm_int < 0) {
            napi_throw_error(env, NULL, "Signing algorithm value out of acceptable range");
            result = AWS_OP_ERR;
            goto done;
        }

        config->algorithm = (enum aws_signing_algorithm)algorithm_int;
    }

    /* Get signature type */
    if (aws_napi_get_named_property(env, js_config, "signature_type", napi_number, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        int32_t signature_type_int = 0;
        napi_get_value_int32(env, current_value, &signature_type_int);
        if (signature_type_int < 0) {
            napi_throw_error(env, NULL, "Signing signature type value out of acceptable range");
            result = AWS_OP_ERR;
            goto done;
        }

        config->signature_type = (enum aws_signature_type)signature_type_int;
    }

    /* Get provider */
    if (aws_napi_get_named_property(env, js_config, "provider", napi_object, &current_value) != AWS_NGNPR_VALID_VALUE ||
        NULL == (config->credentials_provider = aws_napi_credentials_provider_unwrap(env, current_value))) {

        napi_throw_type_error(env, NULL, "Credentials Provider is required");
        result = AWS_OP_ERR;
        goto done;
    }

    /* Get region */
    if (aws_napi_get_named_property(env, js_config, "region", napi_string, &current_value) != AWS_NGNPR_VALID_VALUE) {
        napi_throw_type_error(env, NULL, "Region string is required");
        result = AWS_OP_ERR;
        goto done;
    }
    if (aws_byte_buf_init_from_napi(region_buf, env, current_value)) {
        napi_throw_error(env, NULL, "Failed to build region buffer");
        result = AWS_OP_ERR;
        goto done;
    }
    config->region = aws_byte_cursor_from_buf(region_buf);

    /* Get service */
    if (aws_napi_get_named_property(env, js_config, "service", napi_string, &current_value) == AWS_NGNPR_VALID_VALUE) {
        if (aws_byte_buf_init_from_napi(service_buf, env, current_value)) {
            napi_throw_error(env, NULL, "Failed to build service buffer");
            result = AWS_OP_ERR;
            goto done;
        }

        config->service = aws_byte_cursor_from_buf(service_buf);
    }

    /* Get date */
    /* #TODO eventually check for napi_date type (node v11) */
    if (aws_napi_get_named_property(env, js_config, "date", napi_object, &current_value) == AWS_NGNPR_VALID_VALUE) {
        napi_value prototype = NULL;
        AWS_NAPI_CALL(env, napi_get_prototype(env, current_value, &prototype), {
            napi_throw_type_error(env, NULL, "Date param must be a Date object");
            result = AWS_OP_ERR;
            goto done;
        });

        napi_value valueOfFn = NULL;
        AWS_NAPI_CALL(env, napi_get_named_property(env, prototype, "getTime", &valueOfFn), {
            napi_throw_type_error(env, NULL, "Date param must be a Date object");
            result = AWS_OP_ERR;
            goto done;
        });

        napi_value node_result = NULL;
        AWS_NAPI_CALL(env, napi_call_function(env, current_value, valueOfFn, 0, NULL, &node_result), {
            napi_throw_type_error(env, NULL, "Date param must be a Date object");
            result = AWS_OP_ERR;
            goto done;
        });

        int64_t ms_since_epoch = 0;
        AWS_NAPI_CALL(env, napi_get_value_int64(env, node_result, &ms_since_epoch), {
            napi_throw_type_error(env, NULL, "Date param must be a Date object");
            result = AWS_OP_ERR;
            goto done;
        });

        aws_date_time_init_epoch_millis(&config->date, (uint64_t)ms_since_epoch);
    } else {
        aws_date_time_init_now(&config->date);
    }

    /* Get param blacklist */
    if (aws_napi_get_named_property(env, js_config, "header_blacklist", napi_object, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        bool is_array = false;
        AWS_NAPI_CALL(env, napi_is_array(env, current_value, &is_array), {
            napi_throw_error(env, NULL, "Failed to check if header blacklist is an array");
            result = AWS_OP_ERR;
            goto done;
        });

        if (!is_array) {
            napi_throw_type_error(env, NULL, "header blacklist must be an array of strings");
            result = AWS_OP_ERR;
            goto done;
        }

        uint32_t blacklist_length = 0;
        AWS_NAPI_CALL(env, napi_get_array_length(env, current_value, &blacklist_length), {
            napi_throw_error(env, NULL, "Failed to get the length of node_header_blacklist");
            result = AWS_OP_ERR;
            goto done;
        });

        /* Initialize the string array */
        int err = aws_array_list_init_dynamic(
            &state->header_blacklist, allocator, blacklist_length, sizeof(struct aws_string *));
        if (err == AWS_OP_ERR) {
            aws_napi_throw_last_error(env);
            result = AWS_OP_ERR;
            goto done;
        }

        /* Start copying the strings */
        for (uint32_t i = 0; i < blacklist_length; ++i) {
            napi_value header = NULL;
            AWS_NAPI_CALL(env, napi_get_element(env, current_value, i, &header), {
                napi_throw_error(env, NULL, "Failed to get element from param blacklist");
                result = AWS_OP_ERR;
                goto done;
            });

            struct aws_string *header_name = aws_string_new_from_napi(env, header);
            if (!header_name) {
                napi_throw_error(env, NULL, "header blacklist must be array of strings");
                result = AWS_OP_ERR;
                goto done;
            }

            if (aws_array_list_push_back(&state->header_blacklist, &header_name)) {
                aws_string_destroy(header_name);
                aws_napi_throw_last_error(env);
                result = AWS_OP_ERR;
                goto done;
            }
        }

        config->should_sign_header = s_should_sign_header;
        config->should_sign_header_ud = state;
    }

    /* Get bools */
    if (aws_napi_get_named_property(env, js_config, "use_double_uri_encode", napi_boolean, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        bool property_value = true;
        napi_get_value_bool(env, current_value, &property_value);
        config->flags.use_double_uri_encode = property_value;
    } else {
        config->flags.use_double_uri_encode = true;
    }

    if (aws_napi_get_named_property(env, js_config, "should_normalize_uri_path", napi_boolean, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        bool property_value = true;
        napi_get_value_bool(env, current_value, &property_value);
        config->flags.should_normalize_uri_path = property_value;
    } else {
        config->flags.should_normalize_uri_path = true;
    }

    if (aws_napi_get_named_property(env, js_config, "omit_session_token", napi_boolean, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        bool property_value = true;
        napi_get_value_bool(env, current_value, &property_value);
        config->flags.omit_session_token = property_value;
    } else {
        config->flags.omit_session_token = false;
    }

    /* Get signed body value */
    if (aws_napi_get_named_property(env, js_config, "signed_body_value", napi_string, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        if (aws_byte_buf_init_from_napi(signed_body_value_buf, env, current_value)) {
            napi_throw_error(env, NULL, "Failed to build signed_body_value buffer");
            result = AWS_OP_ERR;
            goto done;
        }
        config->signed_body_value = aws_byte_cursor_from_buf(signed_body_value_buf);
    }

    /* Get signed body header */
    if (aws_napi_get_named_property(env, js_config, "signed_body_header", napi_number, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        int32_t signed_body_header = 0;
        napi_get_value_int32(env, current_value, &signed_body_header);
        config->signed_body_header = (enum aws_signed_body_header_type)signed_body_header;
    } else {
        config->signed_body_header = AWS_SBHT_NONE;
    }

    /* Get expiration time */
    if (aws_napi_get_named_property(env, js_config, "expiration_in_seconds", napi_number, &current_value) ==
        AWS_NGNPR_VALID_VALUE) {
        int64_t expiration_in_seconds = 0;
        napi_get_value_int64(env, current_value, &expiration_in_seconds);
        if (expiration_in_seconds < 0) {
            napi_throw_error(env, NULL, "Signing expiration time in seconds must be non-negative");
            result = AWS_OP_ERR;
            goto done;
        }
        config->expiration_in_seconds = (uint64_t)expiration_in_seconds;
    }

done:
    return result;
}

static napi_value s_aws_sign_request(napi_env env, const struct aws_napi_callback_info *cb_info) {

    struct aws_allocator *allocator = aws_napi_get_allocator();
    const struct aws_napi_argument *arg = NULL;

    struct signer_sign_request_state *state = aws_mem_calloc(allocator, 1, sizeof(struct signer_sign_request_state));
    if (!state) {
        return NULL;
    }

    /* Temp buffers */
    struct aws_byte_buf region_buf;
    AWS_ZERO_STRUCT(region_buf);
    struct aws_byte_buf service_buf;
    AWS_ZERO_STRUCT(service_buf);
    struct aws_byte_buf signed_body_value_buf;
    AWS_ZERO_STRUCT(signed_body_value_buf);

    /* Get request */
    aws_napi_method_next_argument(napi_object, cb_info, &arg);
    napi_create_reference(env, arg->node, 1, &state->node_request);
    state->request = aws_napi_http_message_unwrap(env, arg->node);
    state->signable = aws_signable_new_http_request(allocator, state->request);

    /* Populate config */
    struct aws_signing_config_aws config;
    AWS_ZERO_STRUCT(config);

    aws_napi_method_next_argument(napi_object, cb_info, &arg);
    napi_value js_config = arg->node;

    if (s_get_config_from_js_config(
            env, &config, js_config, &region_buf, &service_buf, &signed_body_value_buf, state, allocator)) {
        /* error already raised */
        goto error;
    }
    aws_napi_method_next_argument(napi_function, cb_info, &arg);
    AWS_NAPI_CALL(
        env,
        aws_napi_create_threadsafe_function(
            env,
            arg->node,
            "aws_signer_on_signing_complete",
            s_aws_sign_request_complete_call,
            state,
            &state->on_complete),
        {
            napi_throw_type_error(env, NULL, "on_shutdown must be a valid callback or undefined");
            goto error;
        });

    if (aws_sign_request_aws(
            allocator,
            state->signable,
            (struct aws_signing_config_base *)&config,
            s_aws_sign_request_complete,
            state)) {
        aws_napi_throw_last_error(env);
        AWS_NAPI_ENSURE(env, aws_napi_release_threadsafe_function(state->on_complete, napi_tsfn_abort));
    }

    goto done;

error:
    // Additional cleanup needed when we didn't successfully bind the on_complete function
    s_destroy_signing_binding(env, allocator, state);

done:
    // Shared cleanup
    aws_credentials_provider_release(config.credentials_provider);

    aws_byte_buf_clean_up(&region_buf);
    aws_byte_buf_clean_up(&service_buf);
    aws_byte_buf_clean_up(&signed_body_value_buf);

    return NULL;
}

struct sigv4a_credentail_getter_state {
    struct aws_allocator *allocator;
    struct aws_condition_variable cvar;
    struct aws_mutex lock;
    bool completed;

    struct aws_signing_config_aws *config;
};

static void s_aws_signv4a_on_get_credentials(struct aws_credentials *credentials, int error_code, void *user_data) {
    (void)error_code;
    struct sigv4a_credentail_getter_state *state = user_data;

    aws_mutex_lock(&state->lock);
    state->completed = true;
    if (credentials) {
        state->config->credentials = credentials;
    }
    aws_mutex_unlock(&state->lock);
    aws_condition_variable_notify_one(&state->cvar);
}

static bool s_get_credential_completed(void *arg) {
    struct sigv4a_credentail_getter_state *state = arg;
    return state->completed;
}

static void s_wait_for_get_credential_to_complete(struct sigv4a_credentail_getter_state *state) {
    aws_mutex_lock(&state->lock);
    aws_condition_variable_wait_pred(&state->cvar, &state->lock, s_get_credential_completed, state);
    aws_mutex_unlock(&state->lock);
}

/* wrap of the signing verification tests */
static napi_value s_aws_verify_sigv4a_signing(napi_env env, const struct aws_napi_callback_info *cb_info) {

    napi_value result = NULL;

    AWS_NAPI_ENSURE(env, napi_get_boolean(env, false, &result));

    struct aws_allocator *allocator = aws_napi_get_allocator();
    const struct aws_napi_argument *arg = NULL;

    struct signer_sign_request_state *state = aws_mem_calloc(allocator, 1, sizeof(struct signer_sign_request_state));
    if (!state) {
        return result;
    }

    /* Temp buffers */
    struct aws_byte_buf region_buf;
    AWS_ZERO_STRUCT(region_buf);
    struct aws_byte_buf service_buf;
    AWS_ZERO_STRUCT(service_buf);
    struct aws_byte_buf signed_body_value_buf;
    AWS_ZERO_STRUCT(signed_body_value_buf);
    struct aws_byte_buf expected_canonical_request_buf;
    AWS_ZERO_STRUCT(expected_canonical_request_buf);
    struct aws_byte_buf signature_buf;
    AWS_ZERO_STRUCT(signature_buf);
    struct aws_byte_buf ecc_key_pub_x_buf;
    AWS_ZERO_STRUCT(ecc_key_pub_x_buf);
    struct aws_byte_buf ecc_key_pub_y_buf;
    AWS_ZERO_STRUCT(ecc_key_pub_y_buf);

    /* Get request */
    aws_napi_method_next_argument(napi_object, cb_info, &arg);
    state->request = aws_napi_http_message_unwrap(env, arg->node);
    state->signable = aws_signable_new_http_request(allocator, state->request);

    /* Populate config */
    struct aws_signing_config_aws config;
    AWS_ZERO_STRUCT(config);

    aws_napi_method_next_argument(napi_object, cb_info, &arg);
    napi_value js_config = arg->node;

    if (s_get_config_from_js_config(
            env, &config, js_config, &region_buf, &service_buf, &signed_body_value_buf, state, allocator)) {
        /* error already raised */
        goto done;
    }

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    napi_value node_expected_canonical_request = arg->node;
    if (aws_byte_buf_init_from_napi(&expected_canonical_request_buf, env, node_expected_canonical_request)) {
        napi_throw_type_error(env, NULL, "The expected canonical request must be a string");
        goto done;
    }

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    napi_value node_signature = arg->node;
    if (aws_byte_buf_init_from_napi(&signature_buf, env, node_signature)) {
        napi_throw_type_error(env, NULL, "The signature must be a string");
        goto done;
    }

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    napi_value node_ecc_key_pub_x = arg->node;
    if (aws_byte_buf_init_from_napi(&ecc_key_pub_x_buf, env, node_ecc_key_pub_x)) {
        napi_throw_type_error(env, NULL, "The public ecc key must be a string");
        goto done;
    }

    aws_napi_method_next_argument(napi_string, cb_info, &arg);
    napi_value node_ecc_key_pub_y = arg->node;
    if (aws_byte_buf_init_from_napi(&ecc_key_pub_y_buf, env, node_ecc_key_pub_y)) {
        napi_throw_type_error(env, NULL, "The public ecc key must be a string");
        goto done;
    }

    struct sigv4a_credentail_getter_state credential_state;
    AWS_ZERO_STRUCT(credential_state);
    credential_state.allocator = allocator;
    credential_state.config = &config;
    aws_condition_variable_init(&credential_state.cvar);
    aws_mutex_init(&credential_state.lock);
    /* get credential from provider for the verification */
    if (aws_credentials_provider_get_credentials(
            config.credentials_provider, s_aws_signv4a_on_get_credentials, &credential_state)) {
        goto done;
    }
    /* wait for credential provider getting the credential */
    s_wait_for_get_credential_to_complete(&credential_state);
    if (!config.credentials) {
        napi_throw_type_error(env, NULL, "Failed to get credentials from credential provider");
        goto done;
    }

    if (aws_verify_sigv4a_signing(
            allocator,
            state->signable,
            (struct aws_signing_config_base *)&config,
            aws_byte_cursor_from_buf(&expected_canonical_request_buf),
            aws_byte_cursor_from_buf(&signature_buf),
            aws_byte_cursor_from_buf(&ecc_key_pub_x_buf),
            aws_byte_cursor_from_buf(&ecc_key_pub_y_buf))) {
        /* Verification failed, the signature result is wrong. */
        aws_napi_throw_last_error(env);
        goto done;
    }

    /* verification succeed */
    AWS_NAPI_ENSURE(env, napi_get_boolean(env, true, &result));

done:
    s_destroy_signing_binding(env, allocator, state);

    aws_credentials_provider_release(config.credentials_provider);
    aws_byte_buf_clean_up(&region_buf);
    aws_byte_buf_clean_up(&service_buf);
    aws_byte_buf_clean_up(&signed_body_value_buf);
    aws_byte_buf_clean_up(&expected_canonical_request_buf);
    aws_byte_buf_clean_up(&signature_buf);
    aws_byte_buf_clean_up(&ecc_key_pub_x_buf);
    aws_byte_buf_clean_up(&ecc_key_pub_y_buf);

    return result;
}
