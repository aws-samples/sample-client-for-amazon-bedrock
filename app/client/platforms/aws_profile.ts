"use client";

import { useAccessStore } from "@/app/store";

// Bridge to the Tauri (Rust) commands in src-tauri/src/aws_profiles.rs.
// Only the desktop shell can read ~/.aws; on web/mobile these helpers
// report "unsupported" and the Settings UI hides the profile picker.

export interface LocalProfileCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | null;
  expirationMs?: number | null;
  region?: string | null;
}

// Re-resolve this long before expiry so an in-flight chat never races the
// credential deadline.
const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

function tauriInvoke():
  | ((command: string, payload?: Record<string, unknown>) => Promise<any>)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const tauri = window.__TAURI__ as any;
  return tauri?.invoke ?? tauri?.tauri?.invoke;
}

export function supportsLocalAwsProfiles(): boolean {
  return !!tauriInvoke();
}

export async function listLocalAwsProfiles(): Promise<string[]> {
  const invoke = tauriInvoke();
  if (!invoke) return [];
  return await invoke("list_aws_profiles");
}

export async function resolveLocalAwsProfile(
  profile: string,
): Promise<LocalProfileCredentials> {
  const invoke = tauriInvoke();
  if (!invoke) {
    throw new Error("Local AWS profiles are only available in the desktop app");
  }
  return await invoke("resolve_aws_profile", { profile });
}

/**
 * Resolve the profile and write the credentials into the access store.
 * The profile name is kept so the credentials can be re-resolved when
 * they expire (SSO / assume-role sessions).
 */
export async function applyLocalAwsProfile(
  profile: string,
): Promise<LocalProfileCredentials> {
  const credentials = await resolveLocalAwsProfile(profile);
  useAccessStore.getState().update((access) => {
    access.awsProfile = profile;
    access.awsProfileCredsExpiration = credentials.expirationMs ?? 0;
    access.awsAccessKeyId = credentials.accessKeyId;
    access.awsSecretAccessKey = credentials.secretAccessKey;
    access.awsSessionToken = credentials.sessionToken ?? "";
    if (credentials.region) {
      access.awsRegion = credentials.region;
    }
  });
  return credentials;
}

export function clearLocalAwsProfile() {
  useAccessStore.getState().update((access) => {
    access.awsProfile = "";
    access.awsProfileCredsExpiration = 0;
  });
}

/**
 * If credentials came from a local profile and are about to expire,
 * re-resolve them before use. No-op for manual keys, non-desktop builds,
 * and static (non-expiring) profile credentials. Throws when the refresh
 * fails (e.g. the SSO session itself expired) so callers can surface it.
 */
export async function ensureLocalAwsProfileCredentials(): Promise<void> {
  const access = useAccessStore.getState();
  const profile = access.awsProfile;
  if (!profile || !supportsLocalAwsProfiles()) return;

  const expiration = access.awsProfileCredsExpiration ?? 0;
  if (expiration === 0 || expiration - Date.now() > EXPIRY_MARGIN_MS) return;

  console.log(
    `[AWS Profile] credentials for "${profile}" are expiring, re-resolving`,
  );
  await applyLocalAwsProfile(profile);
}
