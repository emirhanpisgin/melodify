import { app, BrowserWindow, ipcMain } from "electron";
import "./ipc/index";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import fs from "fs";
import { getSpotifyApi } from "./lib/spotify";
import path from "path";
import Config from "./lib/config";
import { logDebug, logError, logInfo } from "./lib/logger";

const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 450;
const IS_MAC = process.platform === "darwin";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
    app.quit();
}

const createMainWindow = (): void => {
    logInfo("Creating main application window");
    try {
        const mainWindow = new BrowserWindow({
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

        ipcMain.on("window:minimize", () => {
            logInfo("Window minimize requested");
            mainWindow.minimize();
        });
        ipcMain.on("window:close", () => {
            logInfo("Window close requested");
            mainWindow.close();
        });

        updateElectronApp({
            updateSource: {
                type: UpdateSourceType.ElectronPublicUpdateService,
                repo: "emirhanpisgin/songulfy",
            },
            updateInterval: "1 hour",
        });
        logInfo("Main window created and updateElectronApp initialized");
    } catch (error) {
        logError(error, "main:createMainWindow");
    }
};

setInterval(async () => {
    try {
        const spotifyApi = getSpotifyApi();
        if (!spotifyApi) {
            logDebug("Spotify API not available");
            return;
        }
        const playback = await spotifyApi.getMyCurrentPlaybackState();
        const track = playback.body?.item;
        if (track && track.type === "track") {
            const title = track.name;
            const artist = track.artists.map((a) => a.name).join(", ");
            const songPath = path.join(app.getPath("userData"), "song.txt");
            const currentSongFormat =
                Config.get("currentSongFormat") || "{title} - {artist}";
            const currentSongText = currentSongFormat
                .replace("{title}", title)
                .replace("{artist}", artist);
            fs.writeFileSync(songPath, currentSongText, "utf-8");
            logDebug("Wrote current song to file", { title, artist, songPath });
        }
    } catch (err) {
        logError(err, "main:checkSpotifySong");
    }
}, 10000);

// App lifecycle events

app.on("ready", () => {
    logInfo("App ready event");
    createMainWindow();
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
