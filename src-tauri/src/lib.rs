use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

// A plain app command (not a plugin command), so it isn't subject to the
// capabilities/ACL system the same way "sql:*"/"dialog:*" commands are — it
// just needs to be registered below. Used to read a CSV file the user picked
// via the dialog plugin's native file picker, since that picker only returns
// a path.
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

// Copies the live sqlite file to a user-chosen destination (picked via the
// dialog plugin's save dialog on the JS side). A plain file copy is a valid
// point-in-time backup since sqlite commits are durable between app writes.
#[tauri::command]
fn backup_database(app: tauri::AppHandle, destination: String) -> Result<(), String> {
    let source = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("budget.db");
    std::fs::copy(&source, &destination).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_core_tables",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed_defaults",
            sql: include_str!("../migrations/0002_seed.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:budget.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_text_file, backup_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
