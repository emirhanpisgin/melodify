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

// Import IPC handlers
import "../core/ipc";
import "../features/kick/ipc/handlers";
import "../features/spotify/ipc/handlers";

const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 450;
const IS_MAC = process.platform === "darwin";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting = false;

const createTray = () => {
    if (tray) {
        tray.destroy();
    }

    // Create tray icon
    const iconExtension = process.platform === "win32" ? "ico" : "png";
    const iconPath = path.join(
        app.getAppPath(),
        `assets/icon.${iconExtension}`
    );

    let icon: Electron.NativeImage;
    try {
        icon = nativeImage.createFromPath(iconPath);
        logInfo(`Tray icon loaded: ${path.basename(iconPath)}`, "createTray");
    } catch (error) {
        logError(error, "createTray:failedToLoadIcon");
        // Create a simple colored square as fallback
        icon = nativeImage.createFromDataURL(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        );
    }

    try {
        tray = new Tray(icon.resize({ width: 16, height: 16 }));
        logInfo("Tray created successfully", "createTray");
    } catch (error) {
        logError(error, "createTray:failedToCreateTray");
        return;
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show Songülfy",
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        {
            label: "Settings",
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.webContents.send("open-settings");
                }
            },
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Songülfy");

    // Double-click to show window
    tray.on("double-click", () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
};

const createMainWindow = (): void => {
    logInfo("Creating main application window");
    try {
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

        mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        mainWindow.setMenu(null);

        if (process.env.NODE_ENV === "development") {
            mainWindow.webContents.openDevTools({ mode: "detach" });
            logDebug("DevTools opened in development mode");
        }

        // Handle window close event
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

        autoUpdater.checkForUpdates();
        logInfo("Main window created and autoUpdater initialized");
    } catch (error) {
        logError(error, "main:createMainWindow");
    }
};

// App lifecycle events

app.on("ready", () => {
    logInfo("App ready event");
    createMainWindow();

    // Create tray if minimize-to-tray is enabled
    const minimizeToTray = Config.get("minimizeToTray");
    if (minimizeToTray) {
        createTray();
    }
});

app.on("window-all-closed", () => {
    logInfo("All windows closed");
    if (!IS_MAC) {
        logInfo("Quitting app (not macOS)");
        app.quit();
    }
});

app.on("activate", () => {
    logInfo("App activate event");
    if (BrowserWindow.getAllWindows().length === 0) {
        logInfo("No windows open, creating main window");
        createMainWindow();
    }
});

// Error handling

process.on("uncaughtException", (err) => {
    logError(err, "main:uncaughtException");
});

process.on("unhandledRejection", (reason) => {
    logError(reason, "main:unhandledRejection");
});

ipcMain.on("app:restart", () => {
    logInfo("IPC app:restart called");
    app.relaunch();
    app.exit(0);
});

// Clean up tray when app is quitting
app.on("before-quit", () => {
    if (tray) {
        tray.destroy();
        tray = null;
    }
});
