// index.ts
// Main process entry point for the Electron application.
// Handles app lifecycle, window management, tray creation, and IPC setup.

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import { logInfo, logDebug, logError, logWarn } from "../core/logging";
import Config from "../core/config";
import Updater from "basic-electron-updater";
import path from "path";

// Import IPC handlers for different features
import "../core/ipc";
import "../features/kick/ipc/handlers";
import "../features/spotify/ipc/handlers";

// Import feature initialization functions
import {
    listenToChat,
    startKickTokenAutoRefresh,
    stopKickTokenAutoRefresh,
} from "../features/kick/chat/listener";
import {
    startSpotifyTokenRefreshInterval,
    stopSpotifyTokenAutoRefresh,
} from "../features/spotify/playback/player";

// Window dimensions and platform detection
const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 450;
const IS_MAC = process.platform === "darwin";

// Webpack entry points (declared by webpack)
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle Windows installer squirrel events
if (require("electron-squirrel-startup")) {
    app.quit();
}

// Global variables for window and tray management
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting = false;

// Initialize the updater with configuration
let updater: any = null;
try {
    updater = new Updater({
        repo: "emirhanpisgin/melodify", // Your GitHub repository
        autoDownload: false, // Don't auto-download, let user choose
        allowPrerelease: false, // Only stable releases
        debug: false, // Enable debug in dev
    });
    logInfo("Updater initialized successfully", "updater:init");
} catch (error: any) {
    logError(error, "updater:init");
    // Continue without updater if initialization fails
}

function broadcast(channel: string, ...args: any[]) {
    try {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length === 0) {
            logDebug(
                `No windows available for broadcast to channel: ${channel}`,
                "broadcast"
            );
            return;
        }

        windows.forEach((win) => {
            if (win && !win.isDestroyed() && win.webContents) {
                try {
                    win.webContents.send(channel, ...args);
                } catch (error: any) {
                    logError(error, `broadcast:${channel}:window`);
                }
            }
        });
    } catch (error: any) {
        logError(error, `broadcast:${channel}`);
    }
}

// Set up event listeners for the updater
if (updater) {
    updater.on("checking-for-update", () => {
        logInfo("Checking for updates...", "updater");
        broadcast("update:status", "checking");
    });

    updater.on("update-available", (info: any) => {
        logInfo(`Update available: ${info.version}`, "updater");
        broadcast("update:status", "available", info);
    });

    updater.on("update-not-available", () => {
        logInfo("App is up to date.", "updater");
        broadcast("update:status", "not-available");
    });

    updater.on("download-progress", (progress: any) => {
        logDebug(`Download progress: ${progress.percent}%`, "updater");
        broadcast("update:status", "downloading", progress);
    });

    updater.on("downloaded", () => {
        logInfo("Update downloaded successfully", "updater");
        broadcast("update:status", "downloaded");
    });

    updater.on("error", (error: any) => {
        logError(error, "updater");
        broadcast(
            "update:status",
            "error",
            error.message || "Unknown update error"
        );
    });
} else {
    logWarn(
        "Updater not available - update functionality disabled",
        "updater:setup"
    );
}

async function checkForUpdates() {
    if (!updater) {
        logWarn(
            "Updater not available - cannot check for updates",
            "updater:checkForUpdates"
        );
        broadcast("update:status", "error", "Updater not available");
        return;
    }

    try {
        await updater.checkForUpdates();
    } catch (error: any) {
        logError(error, "updater:checkForUpdates");
        broadcast(
            "update:status",
            "error",
            error?.message || "Failed to check for updates"
        );
    }
}

async function downloadUpdate() {
    if (!updater) {
        logWarn(
            "Updater not available - cannot download update",
            "updater:downloadUpdate"
        );
        broadcast("update:status", "error", "Updater not available");
        return;
    }

    try {
        await updater.downloadUpdate();
    } catch (error: any) {
        logError(error, "updater:downloadUpdate");
        broadcast(
            "update:status",
            "error",
            error?.message || "Failed to download update"
        );
    }
}

function installUpdate() {
    if (!updater) {
        logWarn(
            "Updater not available - cannot install update",
            "updater:installUpdate"
        );
        broadcast("update:status", "error", "Updater not available");
        return;
    }

    try {
        updater.applyUpdate();
        // The updater will handle app quit automatically
    } catch (error: any) {
        logError(error, "updater:installUpdate");
        broadcast(
            "update:status",
            "error",
            error?.message || "Failed to install update"
        );
    }
}

/**
 * Creates the system tray with icon and context menu.
 * Handles tray icon creation, menu setup, and click events.
 */
const createTray = () => {
    if (tray) {
        tray.destroy();
    }

    // Determine icon file extension based on platform
    const iconExtension = process.platform === "win32" ? "ico" : "png";
    const iconPath = path.join(
        app.getAppPath(),
        `assets/icon.${iconExtension}`
    );

    let icon: Electron.NativeImage;
    try {
        // Load tray icon from file
        icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
            throw new Error(`Icon file is empty or invalid: ${iconPath}`);
        }
        logInfo(`Tray icon loaded: ${path.basename(iconPath)}`, "createTray");
    } catch (error) {
        logError(error, "createTray:failedToLoadIcon");
        // Create a simple colored square as fallback icon
        icon = nativeImage.createFromDataURL(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        );
        logWarn("Using fallback tray icon", "createTray");
    }

    try {
        // Create tray with resized icon
        tray = new Tray(icon.resize({ width: 16, height: 16 }));
        logInfo("Tray created successfully", "createTray");
    } catch (error) {
        logError(error, "createTray:failedToCreateTray");
        return;
    }

    // Create context menu for the tray
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Open",
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: "Quit",
            click: () => {
                isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Melodify");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        mainWindow?.show();
    });
    logDebug("Tray setup complete", "createTray");
};

/**
 * Creates the main application window.
 * Sets up window properties, loads the app, and handles window events.
 */
const createMainWindow = (): void => {
    logInfo("Creating main application window");
    try {
        // Create the main window with specific properties
        mainWindow = new BrowserWindow({
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            fullscreenable: false,
            resizable: false,
            autoHideMenuBar: true,
            frame: false,
            webPreferences: {
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        // Load the app and remove default menu
        mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        mainWindow.setMenu(null);

        // Open DevTools in development mode
        if (process.env.NODE_ENV === "development") {
            mainWindow.webContents.openDevTools({ mode: "detach" });
            logDebug("DevTools opened in development mode");
        }

        // Handle window close event (minimize to tray if enabled)
        mainWindow.on("close", (event) => {
            const minimizeToTray = Config.get("minimizeToTray");
            if (minimizeToTray && !isQuiting) {
                event.preventDefault();
                mainWindow?.hide();
                if (!tray) {
                    createTray();
                }
            }
        });

        logInfo("Main window created");
    } catch (error) {
        logError(error, "main:createMainWindow");
    }
};

app.on("ready", () => {
    logInfo("App ready event");
    createMainWindow();

    // Create tray if minimize-to-tray is enabled
    if (Config.get("minimizeToTray")) {
        createTray();
    }

    // Initialize features after app is ready
    try {
        // Start listening to Kick chat
        listenToChat();

        // Start token auto-refresh mechanisms
        startKickTokenAutoRefresh();

        // Only start Spotify token refresh if mainWindow is available
        if (mainWindow) {
            startSpotifyTokenRefreshInterval(mainWindow);
        } else {
            logWarn(
                "Main window not available for Spotify token refresh",
                "main:features"
            );
        }

        logInfo("Features initialized successfully", "main:features");
    } catch (error: any) {
        logError(error, "main:featureInit");
    }

    // Check for updates automatically if enabled (after a delay)
    checkAutoUpdate();
});

app.on("window-all-closed", () => {
    stopKickTokenAutoRefresh();
    stopSpotifyTokenAutoRefresh();
    if (!IS_MAC) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Window control IPC handlers
ipcMain.on("window:minimize", () => {
    logInfo("Window minimize requested");
    const minimizeToTray = Config.get("minimizeToTray");
    if (minimizeToTray) {
        mainWindow?.hide();
        if (!tray) {
            createTray();
        }
    } else {
        mainWindow?.minimize();
    }
});

ipcMain.on("window:close", () => {
    logInfo("Window close requested");
    isQuiting = true;
    mainWindow?.close();
});

// App control IPC handlers
ipcMain.on("app:restart", () => {
    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.quit();
});

// Updater IPC handlers - Note: These override any core IPC update handlers
ipcMain.removeAllListeners("update:check");
ipcMain.removeAllListeners("update:download");
ipcMain.removeAllListeners("update:install");

ipcMain.on("update:check", () => {
    logDebug("Update check requested from renderer", "updater:ipc");
    checkForUpdates();
});

ipcMain.on("update:download", (_event, _manifest) => {
    logDebug("Update download requested from renderer", "updater:ipc");
    downloadUpdate();
});

ipcMain.on("update:install", () => {
    logDebug("Update install requested from renderer", "updater:ipc");
    installUpdate();
});

// Check for updates automatically if enabled
const checkAutoUpdate = () => {
    try {
        const autoUpdateEnabled = Config.get("autoUpdateEnabled") ?? true;
        if (autoUpdateEnabled && updater) {
            logInfo(
                "Auto-update is enabled, checking for updates in 5 seconds",
                "main:autoUpdate"
            );
            setTimeout(() => {
                checkForUpdates().catch((error) => {
                    logError(error, "main:autoUpdateCheck");
                });
            }, 5000); // Wait 5 seconds after app start
        } else if (!updater) {
            logWarn(
                "Auto-update requested but updater is not available",
                "main:autoUpdate"
            );
        } else {
            logDebug("Auto-update is disabled", "main:autoUpdate");
        }
    } catch (error: any) {
        logError(error, "main:autoUpdate:configAccess");
    }
};

logInfo("Main process setup complete", "main:setup");
