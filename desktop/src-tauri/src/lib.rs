// SmartSchool SN — Wrapper Desktop Tauri 2.0
//
// Charge https://smartschool-sn.vercel.app dans une fenêtre native Windows.
// Plugins :
//  - single-instance : empêche les fenêtres dupliquées
//  - notification    : toasts Windows natifs
//  - updater         : auto-update via manifest signé
//  - shell           : ouverture des liens externes dans le navigateur
//  - process         : redémarrage post-update

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Single instance lock — focus la fenêtre existante au lieu d'ouvrir une 2e
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            use tauri::Manager;
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Vérification de mise à jour silencieuse au démarrage
            #[cfg(desktop)]
            {
                use tauri_plugin_updater::UpdaterExt;
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Ok(updater) = handle.updater() {
                        if let Ok(Some(update)) = updater.check().await {
                            log::info!("update available: {}", update.version);
                            let _ = update.download_and_install(|_, _| {}, || {}).await;
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SmartSchool desktop");
}
