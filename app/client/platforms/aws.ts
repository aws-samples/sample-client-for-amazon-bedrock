"use client";
import {
  ApiPath,
  DEFAULT_API_HOST,
  // DEFAULT_MODELS,
  // OpenaiPath,
  REQUEST_TIMEOUT_MS,
  // ServiceProvider,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";
import { ConverseCommandInput } from "@aws-sdk/client-bedrock-runtime";
import { BedrockClient, AWSConfig } from "@/app/client/platforms/aws_utils";
import Locale from "../../locales";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  LLMUsage,
  MultimodalContent,
} from "../api";
// import Locale from "../../locales";
// import {
//   EventStreamContentType,
//   fetchEventSource,
// } from "@fortaine/fetch-event-source";
// import { prettyObject } from "@/app/utils/format";
// import { getClientConfig } from "@/app/config/client";
// import { makeAzurePath } from "@/app/azure";
import {
  getMessageTextContent,
  getMessageImages,
  isVisionModel,
} from "@/app/utils";
import {
  isCognitoAKSKExpiration,
  redirectCognitoLoginPage,
  getCognitoRefreshToken,
  refreshCognitoAuthentication,
} from "./aws_cognito";
// import vi from "@/app/locales/vi";

const BEDROCK_ENDPOINT = process.env.NEXT_PUBLIC_BEDROCK_ENDPOINT;

export interface AWSListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export class ClaudeApi implements LLMApi {
  // private disableListModels = true;
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    return "https://facked-url.bedrock.com";
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  // get_model_id(model: string): string {
  //   // get the model id from the model name
  //   // go through all the models in DEFAULT_MODELS, and find the model id by the model name

  //   // const appConfig = useAppConfig();
  //   // console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", appConfig);
  //   var model_id = "";
  //   for (var i = 0; i < DEFAULT_MODELS.length; i++) {
  //     if (DEFAULT_MODELS[i].name === model) {
  //       model_id = DEFAULT_MODELS[i].modelId;
  //       break;
  //     }
  //   }

  //   return model_id;
  // }

  // get_model_version(model: string): string {
  //   // get the model version from the model name
  //   // go through all the models in DEFAULT_MODELS, and find the model version by the model name

  //   var model_version = "";
  //   for (var i = 0; i < DEFAULT_MODELS.length; i++) {
  //     if (DEFAULT_MODELS[i].name === model) {
  //       model_version = DEFAULT_MODELS[i].anthropic_version;
  //       break;
  //     }
  //   }

  //   return model_version;
  // }

  convertMessagePayload(
    messages: any,
    modelConfig: any,
    model_version: string,
  ): any {
    // converting the message payload, as the format of the original message playload is different from the format of the payload format of Bedrock API
    // define a new variable to store the new message payload,
    // scan all the messages in the original message payload,
    //      if the message is a system prompt, then need to remove it from the message payload, and store the system prompt content in "system parameter" as Bedrock API required.
    //      if the message is from user, then scan the content of the message
    //          if the content type is image_url, then get the image data and store it in the new message payload
    //          if the content type is not image_url, then store the content in the new message payload

    // console.log("original messages", messages);

    var new_messages: any = [];

    var has_system_prompt = false;
    var system_prompt = "";
    var prev_role = "";



    for (var i = 0; i < messages.length; i++) {
      if (messages[i].role === "system") {
        if (has_system_prompt) {
          // only first system prompt is used
          continue;
        } else {
          if (typeof messages[i].content === "string") {
            has_system_prompt = true;
            if (messages[i].content !== "") {
              system_prompt = messages[i].content;
            } else {
              system_prompt = "'.'";
            }
          }
        }
      } else if (messages[i].role === "user") {
        // check the value type of the content

        var new_contents = [];

        if (prev_role === messages[i].role) {
          // continued user message
          // need to get back the previous user message, and append the current message to the previous message

          const last_message = new_messages.pop();

          // put the contents in the last message to the new contents

          for (var k = 0; k < last_message.content.length; k++) {
            if (last_message.content[k] !== "") {
              new_contents.push(last_message.content[k]);
            } else {
              new_contents.push("' '");
            }
          }
        }

        if (typeof messages[i].content === "string") {
          // the message content is not an array, it is a text message

          const content_string =
            messages[i].content == "" ? "' '" : messages[i].content;

          const text_playload = { type: "text", text: content_string };

          new_contents.push(text_playload);
        } else {
          for (var j = 0; j < messages[i].content.length; j++) {
            if (
              (messages[i].content[j] as MultimodalContent).type === "image_url"
            ) {
              const curent_content = messages[i].content[
                j
              ] as MultimodalContent;

              // console.log('image_url', curent_content.image_url.url);

              if (curent_content.image_url !== undefined) {
                const image_data_in_string = curent_content.image_url.url;

                const image_metadata = image_data_in_string.split(",")[0];
                const image_data = image_data_in_string.split(",")[1];
                const media_type = image_metadata.split(";")[0].split(":")[1];

                // converse image block , use bytes reaplace base64
                const image_playload = {
                  "image": {
                    "format": media_type.split("/")[1],
                    "source": {
                      "bytes": Uint8Array.from(atob(image_data), c => c.charCodeAt(0))
                    }
                  }
                };

                new_contents.push(image_playload);
              }
            } else if (
              (messages[i].content[j] as MultimodalContent).type === "doc"
            ) {
              console.log("have doc !!!!", (messages[i].content[j] as MultimodalContent).doc?.name)

              // converse image block , use bytes reaplace base64
              const doc_playload = {
                "document": (messages[i].content[j] as MultimodalContent).doc
              };

              new_contents.push(doc_playload);

            }

            else {
              const content_string =
                messages[i].content[j] == "" ? "' '" : messages[i].content[j];
              new_contents.push(content_string);
            }
          }
        }

        new_messages.push({ role: messages[i].role, content: new_contents });

        prev_role = messages[i].role;

        // console.log("now , new message is:", new_messages);
      } else if (messages[i].role === "assistant") {
        var new_contents = [];

        if (prev_role === messages[i].role) {
          // continued assistant message
          // need to get back the previous assistant message, and append the current message to the previous message

          const last_message = new_messages.pop();

          // put the contents in the last message to the new contents

          for (var k = 0; k < last_message.content.length; k++) {
            const content_string =
              last_message.content[k] == "" ? "' '" : last_message.content[k];
            new_contents.push(last_message.content[k]);
          }
        }

        if (typeof messages[i].content === "string") {
          // the message content is not an array, it is a text message
          const message_contest_string =
            messages[i].content == "" ? "' '" : messages[i].content;
          const text_playload = { type: "text", text: message_contest_string };

          new_contents.push(text_playload);
        } else {
          for (var j = 0; j < messages[i].content.length; j++) {
            const message_content =
              messages[i].content[j] == "" ? "' '" : messages[i].content[j];
            new_contents.push(message_content);
          }
        }

        new_messages.push({ role: messages[i].role, content: new_contents });

        prev_role = messages[i].role;
      } else {
        const message_content = messages[i] == "" ? "' '" : messages[i];
        new_messages.push(message_content);

        prev_role = messages[i].role;
      }
    }

    /* 如果因为某些原因传入进来的消息第一条是assistant，加上一个空的user role,  :< ! */
    if (new_messages.length > 0 && new_messages[0].role === "assistant") {
      new_messages.unshift({
        role: "user", content: [
          { type: 'text', text: 'hi' }]
      });
    }

    // console.log("messages[0].role", messages[0].role)
    const requestPayload: any = {
      ...(has_system_prompt ? { system: system_prompt } : {}),
      messages: new_messages,
      top_p: modelConfig.top_p,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens,
      anthropic_version: model_version,
      model: modelConfig.model
    };
    console.log("modelConfig", modelConfig)
    // check if modelConfig.model is claude-3-7-sonnet
    if (requestPayload.model === "claude-3.7-sonnet") {
      requestPayload.reasoning_config = modelConfig.reasoning_config
    }
    if (requestPayload.reasoning_config?.type === "enabled") {
      requestPayload.top_p = undefined
      requestPayload.temperature = 1
    }
    return requestPayload;
  }

  async chat(options: ChatOptions) {
    const visionModel = isVisionModel(options.config.model);

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    const models = useAppConfig.getState().models;
    const accessStore = useAccessStore.getState();
    let credential;

    // if aksk expiration then login again
    if (accessStore.awsCognitoUser && isCognitoAKSKExpiration()) {
      console.log("AWS credentials is expired, try to refresh credential");

      const refreshToken = getCognitoRefreshToken();

      if (refreshToken) {
        console.log("Got AWS cognito refresh token, try to refresh");

        credential = await refreshCognitoAuthentication(refreshToken).then(
          (data) => {
            if (data.credential) {
              const credential = data.credential;

              accessStore.update((access: any) => {
                access.awsRegion = credential.awsRegion;
                access.awsAccessKeyId = credential.awsAccessKeyId;
                access.awsSecretAccessKey = credential.awsSecretAccessKey;
                access.awsSessionToken = credential.awsSessionToken;
                access.awsCognitoUser = true;
              });

              return credential;
            }
          },
        );

        console.log(
          "Got AWS cognito refresh result:{}",
          credential.awsAccessKeyId,
        );

        if (!credential) {
          options.onError?.(
            new Error("AWS credentials is expired, auto re-loging....."),
          );
          redirectCognitoLoginPage();
          return;
        }
      } else {
        options.onError?.(
          new Error("AWS credentials is expired, auto re-loging....."),
        );
        redirectCognitoLoginPage();
        return;
      }
    }

    if (
      accessStore.awsRegion === "" ||
      accessStore.awsAccessKeyId === "" ||
      accessStore.awsSecretAccessKey === ""
    ) {
      console.log("AWS credentials are not set");
      let responseText = "";
      const responseTexts = [responseText];
      responseTexts.push(Locale.Error.Unauthorized);
      responseText = responseTexts.join("\n\n");
      options.onFinish(responseText);
      return;
    }

    const BEDROCK_ENDPOINT = accessStore.bedrockEndpoint || process.env.NEXT_PUBLIC_BEDROCK_ENDPOINT;

    const aws_config_data = {
      region: accessStore.awsRegion,
      credentials: {
        accessKeyId: credential
          ? credential.awsAccessKeyId
          : accessStore.awsAccessKeyId,
        secretAccessKey: credential
          ? credential.awsSecretAccessKey
          : accessStore.awsSecretAccessKey,
        sessionToken: credential
          ? credential.awsSessionToken
          : accessStore.awsSessionToken,
      },
      ...(BEDROCK_ENDPOINT && { endpoint: BEDROCK_ENDPOINT }),
    };

    // console.log("aws_config_data", aws_config_data);

    const client = new BedrockClient(aws_config_data);

    // console.log("is vision model", visionModel);


    const messages = options.messages.map((v) => ({
      role: v.role,
      content: visionModel ? v.content : getMessageTextContent(v),
    }));

    const currentModel = models.find((v) => v.name === modelConfig.model);
    const modelID = currentModel?.modelId; // this.get_model_id(modelConfig.model);
    const modelVersion = currentModel?.anthropic_version; // this.get_model_version(modelConfig.model);

    if (!modelID || !modelVersion) {
      throw new Error(`Could not find modelID or modelVersion.`);
    }

    const requestPayload: any = this.convertMessagePayload(
      messages,
      modelConfig,
      modelVersion,
    );
    // add max_tokens to vision model
    if (visionModel) {
      Object.defineProperty(requestPayload, "max_tokens", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: modelConfig.max_tokens,
      });
    }

    // console.log("[Request] claude payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    // modelID = modelConfig.model.

    try {
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      //let metrics = null;
      let metrics: any = {};

      if (shouldStream) {
        let responseText = "";
        let remainText = "";
        let finished = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response Animation] finished");
            return;
          }

          if (remainText.length > 0) {
            const fetchCount = Math.max(1, Math.round(remainText.length / 60));
            const fetchText = remainText.slice(0, fetchCount);
            responseText += fetchText;
            remainText = remainText.slice(fetchCount);
            options.onUpdate?.(responseText, fetchText);
          }

          requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(responseText + remainText, metrics);
          }
        };

        controller.signal.onabort = finish;
        const payload: ConverseCommandInput = {
          modelId: modelID,
          ...(requestPayload.system ? { system: [{ text: requestPayload.system }] } : [{ text: "." }]),
          messages: requestPayload.messages,
          inferenceConfig: {
            maxTokens: requestPayload.max_tokens,
            temperature: requestPayload.temperature,
            topP: requestPayload.top_p
          }
        }
        console.log("requestPayload.model", requestPayload.model)
        if (requestPayload.model === "claude-3.7-sonnet" && requestPayload.reasoning_config?.type === "enabled") {
          payload.additionalModelRequestFields = { "reasoning_config": requestPayload.reasoning_config }
        }
        const response = await client.converseStream(payload);

        try {
          // Send the command to the model and wait for the response
          // Extract and print the streamed response text in real-time.
          let think_end = false;
          let hasSeenThinking = false; // 跟踪是否已经看到过思考内容
          
          for await (const item of response.stream ?? []) {
            if (item.contentBlockDelta) {
              const thinkingContent = item.contentBlockDelta.delta?.reasoningContent?.text;
              const content = item.contentBlockDelta.delta?.text;
              
              // 处理思考内容
              if (thinkingContent) {
                // 第一次出现思考内容时添加标题
                if (!hasSeenThinking) {
                  hasSeenThinking = true;
                  remainText += "> **Think:**\n> ";
                }
                
                // 处理思考内容并添加 > 前缀
                const formattedThinking = thinkingContent.replace(/\n/g, '\n> ');
                remainText += formattedThinking;
              }
              
              // 处理正常内容
              if (content) {
                // 如果从思考内容转到正常内容，添加分隔符
                if (hasSeenThinking && !think_end) {
                  think_end = true;
                  remainText += "\n\n";
                }
                
                remainText += content;
              }
            }
          }
          finish()
        } catch (err) {
          finish()
          console.log(`ERROR: Can't invoke '${modelID}'. Reason: ${err}`);
        }


      } else {
        // console.log("not streaming");

        const payload: ConverseCommandInput = {
          modelId: modelID,
          ...(requestPayload.system ? { system: [{ text: requestPayload.system }] } : [{ text: "." }]),
          messages: requestPayload.messages,
          inferenceConfig: {
            maxTokens: requestPayload.max_tokens,
            temperature: requestPayload.temperature,
            topP: requestPayload.top_p
          }
        }

        const res = await client.converseModel(payload)
        clearTimeout(requestTimeoutId);

        let message = "No message return";
        if (res.output?.message?.content) {
          message = res.output.message.content[0]["text"] ?? "";
        }
        if (res.usage) {
          metrics = res.usage;
        }
        options.onFinish(message, metrics);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    // As there are no usage data for AWS, we are returning a dummy usage data

    return {
      used: 1000,
      total: 1000,
    } as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    // as we only support Claude 3 mode at present, so we are returning a dummy model list data
    return [];
  }
}
// export { OpenaiPath };