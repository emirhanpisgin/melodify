// index.ts
// Main process entry point for the Electron application.
// Handles app lifecycle, window management, tray creation, and IPC setup.

import {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    nativeImage,
    autoUpdater,
} from "electron";
import { logInfo, logDebug, logError } from "../core/logging";
import Config from "../core/config";
import path from "path";
import fs from "fs";

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
        logInfo(`Tray icon loaded: ${path.basename(iconPath)}`, "createTray");
    } catch (error) {
        logError(error, "createTray:failedToLoadIcon");
        // Create a simple colored square as fallback icon
        icon = nativeImage.createFromDataURL(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        );
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

    tray.setToolTip("Songulfy");
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

        // Handle minimize request from renderer
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

        // Handle close request from renderer
        ipcMain.on("window:close", () => {
            logInfo("Window close requested");
            isQuiting = true;
            mainWindow?.close();
        });

        // Initialize auto-updater
        autoUpdater.checkForUpdates();
        logInfo("Main window created and autoUpdater initialized");
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

ipcMain.on("app:restart", () => {
    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.quit();
});

// Start listening to Kick chat
listenToChat();

// Start token auto-refresh mechanisms
startKickTokenAutoRefresh();
startSpotifyTokenRefreshInterval(mainWindow);

logInfo("Main process setup complete", "main:setup");
