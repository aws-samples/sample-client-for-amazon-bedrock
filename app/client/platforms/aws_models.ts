"use client";

import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
  FoundationModelSummary,
  InferenceProfileSummary,
} from "@aws-sdk/client-bedrock";
import { useAccessStore } from "@/app/store";
import { DEFAULT_MODELS } from "@/app/constant";
import { LLMModel } from "../api";
import { ensureLocalAwsProfileCredentials } from "./aws_profile";

const ANTHROPIC_VERSION = "bedrock-2023-05-31";

// Many newer models cannot be invoked by their foundation-model id: they only
// support cross-region inference profiles ("us.", "eu.", "apac.", "global."
// prefixed ids), so discovery has to join ListFoundationModels with
// ListInferenceProfiles to find the id that Converse will actually accept.
function profileBaseModelIds(profile: InferenceProfileSummary): string[] {
  return (profile.models ?? [])
    .map((m) => m.modelArn?.split("foundation-model/")[1] ?? "")
    .filter((id) => id.length > 0);
}

async function listAllInferenceProfiles(
  client: BedrockClient,
): Promise<InferenceProfileSummary[]> {
  const profiles: InferenceProfileSummary[] = [];
  let nextToken: string | undefined;
  do {
    const page = await client.send(
      new ListInferenceProfilesCommand({
        maxResults: 1000,
        typeEquals: "SYSTEM_DEFINED",
        nextToken,
      }),
    );
    profiles.push(...(page.inferenceProfileSummaries ?? []));
    nextToken = page.nextToken;
  } while (nextToken);
  return profiles;
}

function pickInvocationId(
  model: FoundationModelSummary,
  profilesByModelId: Map<string, string[]>,
): string | undefined {
  // Cast: this SDK version's InferenceType union lacks "INFERENCE_PROFILE",
  // but the service does return it for cross-region-profile-only models.
  const inferenceTypes = (model.inferenceTypesSupported ?? []) as string[];
  if (inferenceTypes.includes("ON_DEMAND")) {
    return model.modelId;
  }
  if (!inferenceTypes.includes("INFERENCE_PROFILE")) {
    return undefined; // provisioned-only model (or context-length variant)
  }
  const profileIds = profilesByModelId.get(model.modelId ?? "") ?? [];
  // Prefer the global profile (matches the built-in defaults), then any
  // geo-scoped one (us. / eu. / apac. ...) usable from the current region.
  return (
    profileIds.find((id) => id.startsWith("global.")) ?? profileIds[0]
  );
}

/**
 * Discover every ACTIVE, text-output, on-demand-invocable model in the
 * configured region, mapped to the app's LLMModel shape. Returns [] when AWS
 * credentials are not configured yet; throws on API errors so callers can
 * surface them.
 */
export async function discoverBedrockModels(): Promise<LLMModel[]> {
  // Refresh expiring local-profile credentials (desktop) before use.
  await ensureLocalAwsProfileCredentials();

  const accessStore = useAccessStore.getState();

  if (
    accessStore.awsRegion === "" ||
    accessStore.awsAccessKeyId === "" ||
    accessStore.awsSecretAccessKey === ""
  ) {
    return [];
  }

  // Note: accessStore.bedrockEndpoint overrides the *runtime* endpoint only.
  // Discovery talks to the control plane (bedrock.<region>.amazonaws.com).
  const client = new BedrockClient({
    region: accessStore.awsRegion,
    credentials: {
      accessKeyId: accessStore.awsAccessKeyId,
      secretAccessKey: accessStore.awsSecretAccessKey,
      sessionToken: accessStore.awsSessionToken || undefined,
    },
  });

  const [modelsResponse, profiles] = await Promise.all([
    client.send(new ListFoundationModelsCommand({ byOutputModality: "TEXT" })),
    listAllInferenceProfiles(client),
  ]);

  const profilesByModelId = new Map<string, string[]>();
  for (const profile of profiles) {
    if (profile.status !== "ACTIVE" || !profile.inferenceProfileId) continue;
    for (const baseId of profileBaseModelIds(profile)) {
      const ids = profilesByModelId.get(baseId) ?? [];
      ids.push(profile.inferenceProfileId);
      profilesByModelId.set(baseId, ids);
    }
  }

  const discovered: LLMModel[] = [];
  const seenIds = new Set<string>();

  for (const model of modelsResponse.modelSummaries ?? []) {
    if (model.modelLifecycle?.status !== "ACTIVE") continue;
    if (!(model.outputModalities ?? []).includes("TEXT")) continue;

    const invocationId = pickInvocationId(model, profilesByModelId);
    if (!invocationId || seenIds.has(invocationId)) continue;
    seenIds.add(invocationId);

    // Keep the built-in friendly names as aliases so the default model,
    // existing chats, and the legacy-alias migration keep working.
    const builtin = DEFAULT_MODELS.find((d) => d.modelId === invocationId);
    const providerName = model.providerName ?? "AWS";

    discovered.push({
      name: builtin?.name ?? invocationId,
      available: true,
      modelId: invocationId,
      displayName: builtin?.displayName ?? model.modelName ?? invocationId,
      support_image_understanding: (model.inputModalities ?? []).includes(
        "IMAGE",
      ),
      support_streaming: model.responseStreamingSupported ?? true,
      ...(providerName === "Anthropic"
        ? { anthropic_version: ANTHROPIC_VERSION }
        : {}),
      provider: {
        id: providerName.toLowerCase(),
        providerName,
        providerType: "aws",
      },
    });
  }

  // Two releases of a model can share a display name (e.g. "Claude 3.5
  // Sonnet" v1/v2); disambiguate with the invocable id.
  const nameCounts = new Map<string, number>();
  for (const m of discovered) {
    nameCounts.set(m.displayName, (nameCounts.get(m.displayName) ?? 0) + 1);
  }
  for (const m of discovered) {
    if ((nameCounts.get(m.displayName) ?? 0) > 1) {
      m.displayName = `${m.displayName} (${m.modelId})`;
    }
  }

  // Anthropic first (this is a Claude-focused client), then by provider and
  // name so the dropdown stays stable between refreshes.
  discovered.sort((a, b) => {
    const aAnthropic = a.provider?.providerName === "Anthropic" ? 0 : 1;
    const bAnthropic = b.provider?.providerName === "Anthropic" ? 0 : 1;
    if (aAnthropic !== bAnthropic) return aAnthropic - bAnthropic;
    const byProvider = (a.provider?.providerName ?? "").localeCompare(
      b.provider?.providerName ?? "",
    );
    if (byProvider !== 0) return byProvider;
    return a.displayName.localeCompare(b.displayName);
  });

  return discovered;
}
