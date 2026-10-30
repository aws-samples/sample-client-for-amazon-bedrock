//! Local AWS profile support for the desktop app.
//!
//! The webview cannot read `~/.aws`, so these commands run in the Tauri
//! (Rust) process: one lists the profile names, the other resolves a
//! profile to temporary credentials through the official `aws-config`
//! resolution chain, so assume-role, SSO (`aws sso login`) and
//! `credential_process` profiles all work, not just static keys.

use aws_credential_types::provider::ProvideCredentials;
use serde::Serialize;
use std::collections::BTreeSet;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedProfileCredentials {
  access_key_id: String,
  secret_access_key: String,
  session_token: Option<String>,
  /// Unix epoch millis; None for static long-lived keys.
  expiration_ms: Option<u64>,
  region: Option<String>,
}

fn aws_dir() -> Option<PathBuf> {
  tauri::api::path::home_dir().map(|home| home.join(".aws"))
}

/// Section headers of an AWS ini file. `config` uses `[profile name]`
/// (plus `[default]`), `credentials` uses bare `[name]`.
fn profile_names_in(path: &PathBuf, strip_profile_prefix: bool) -> Vec<String> {
  let Ok(content) = std::fs::read_to_string(path) else {
    return Vec::new();
  };
  content
    .lines()
    .filter_map(|line| {
      let line = line.trim();
      let inner = line.strip_prefix('[')?.strip_suffix(']')?.trim();
      let name = if strip_profile_prefix {
        inner.strip_prefix("profile ").unwrap_or(inner).trim()
      } else {
        inner
      };
      (!name.is_empty()).then(|| name.to_string())
    })
    .collect()
}

#[tauri::command]
pub async fn list_aws_profiles() -> Result<Vec<String>, String> {
  let dir = aws_dir().ok_or("could not locate the home directory")?;

  let mut names = BTreeSet::new();
  names.extend(profile_names_in(&dir.join("config"), true));
  names.extend(profile_names_in(&dir.join("credentials"), false));

  // "default" first, the rest alphabetical.
  let mut result: Vec<String> = Vec::new();
  if names.remove("default") {
    result.push("default".to_string());
  }
  result.extend(names);
  Ok(result)
}

#[tauri::command]
pub async fn resolve_aws_profile(
  profile: String,
) -> Result<ResolvedProfileCredentials, String> {
  if profile.trim().is_empty() {
    return Err("profile name is empty".to_string());
  }

  let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
    .profile_name(&profile)
    .load()
    .await;

  let provider = config
    .credentials_provider()
    .ok_or_else(|| format!("no credentials provider for profile \"{profile}\""))?;

  let credentials = provider.provide_credentials().await.map_err(|e| {
    // Include the cause chain: "the SSO session has expired" and similar
    // root causes are far more actionable than the top-level error alone.
    let mut message = format!(
      "could not resolve credentials for profile \"{profile}\": {e}"
    );
    let mut source = std::error::Error::source(&e);
    while let Some(cause) = source {
      message.push_str(&format!(": {cause}"));
      source = cause.source();
    }
    message
  })?;

  let expiration_ms = credentials.expiry().and_then(|t| {
    t.duration_since(UNIX_EPOCH)
      .ok()
      .map(|d| d.as_millis() as u64)
  });

  Ok(ResolvedProfileCredentials {
    access_key_id: credentials.access_key_id().to_string(),
    secret_access_key: credentials.secret_access_key().to_string(),
    session_token: credentials.session_token().map(|s| s.to_string()),
    expiration_ms,
    region: config.region().map(|r| r.to_string()),
  })
}
