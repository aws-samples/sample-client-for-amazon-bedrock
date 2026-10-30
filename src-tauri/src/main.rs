// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod aws_profiles;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      aws_profiles::list_aws_profiles,
      aws_profiles::resolve_aws_profile
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
