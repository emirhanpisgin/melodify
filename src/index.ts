// Electron main process entry point
import { app, BrowserWindow, ipcMain } from "electron";
import "./ipc/index";
import "./lib/config";
import { logError } from "./lib/logger";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import path from "path";
import { spawn } from "child_process";

// Constants for window configuration
const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 450;
const IS_MAC = process.platform === "darwin";

// Webpack entry points (provided by electron-forge/webpack)
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

function createUninstallShortcut() {
    const updateExe = path.resolve(process.execPath, "..", "..", "Update.exe");
    spawn(
        updateExe,
        ["--createShortcut=Songulfy.exe", "--shortcut-locations=StartMenu"],
        {
            detached: true,
        }
    );
}

// Handle Squirrel.Windows startup events
if (process.argv.includes("--squirrel-firstrun")) {
    createUninstallShortcut();
    app.quit();
}

/**
 * Creates the main application window.
 */
const createMainWindow = (): void => {
    try {
        const mainWindow = new BrowserWindow({
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            fullscreenable: false,
            resizable: false,
            autoHideMenuBar: true,
            frame: false, // Remove native titlebar for custom
            webPreferences: {
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
                // contextIsolation: true, // Uncomment if using context isolation
                // nodeIntegration: false, // Uncomment if needed for security
            },
        });

        mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        mainWindow.setMenu(null);

        // Open DevTools in a separate window in development mode only
        if (process.env.NODE_ENV === "development") {
            mainWindow.webContents.openDevTools({ mode: "detach" });
        }

        // IPC for window controls
        ipcMain.on("window:minimize", () => {
            mainWindow.minimize();
        });
        ipcMain.on("window:close", () => {
            mainWindow.close();
        });

        updateElectronApp({
            updateSource: {
                type: UpdateSourceType.ElectronPublicUpdateService,
                repo: "emirhanpisgin/songulfy",
            },
            updateInterval: "1 hour",
        });
    } catch (error) {
        logError(error, "main:createMainWindow");
        // eslint-disable-next-line no-console
        console.error("Failed to create main window:", error);
    }
};

// App lifecycle events
app.on("ready", () => {
    createMainWindow();
});

app.on("window-all-closed", () => {
    if (!IS_MAC) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Error handling
process.on("uncaughtException", (err) => {
    logError(err, "main:uncaughtException");
    // Optionally, show a dialog or notification to the user
});

process.on("unhandledRejection", (reason) => {
    logError(reason, "main:unhandledRejection");
});

ipcMain.on("app:restart", () => {
    app.relaunch();
    app.exit(0);
});
