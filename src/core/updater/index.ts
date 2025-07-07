import { app, BrowserWindow, shell } from "electron";
import fetch from "node-fetch";
import { gt } from "semver";
import { download } from "electron-dl";
import { logInfo, logError } from "../logging";

const MANIFEST_URL = "https://raw.githubusercontent.com/emirhanpisgin/songulfy/main/update.json";

interface Manifest {
    version: string;
    platforms: {
        [platform: string]: {
            url: string;
        };
    };
}

let updateAvailable = false;
let downloadedFilePath: string | null = null;

function broadcast(channel: string, ...args: any[]) {
    BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send(channel, ...args);
    });
}

export async function checkForUpdates() {
    broadcast("update:status", "checking");
    logInfo("Checking for updates...", "updater");

    try {
        const res = await fetch(MANIFEST_URL);
        if (!res.ok) {
            throw new Error(`Failed to fetch manifest: ${res.statusText}`);
        }
        const manifest = (await res.json()) as Manifest;
        const currentVersion = app.getVersion();

        if (gt(manifest.version, currentVersion)) {
            logInfo(`Update available: ${manifest.version}`, "updater");
            updateAvailable = true;
            broadcast("update:status", "available", manifest);
        } else {
            logInfo("App is up to date.", "updater");
            broadcast("update:status", "not-available");
        }
    } catch (error) {
        logError(error, "updater:check");
        broadcast("update:status", "error", error.message);
    }
}

export async function downloadUpdate(manifest: Manifest) {
    if (!updateAvailable) return;

    const platform = process.platform;
    const arch = process.arch;
    const platformKey = `${platform}-${arch}`;
    
    // A simple mapping, you might need to adjust this based on forge's output
    let installerUrl: string | undefined;
    if (platform === 'win32') {
        installerUrl = manifest.platforms['win32-x64']?.url;
    } else if (platform === 'darwin') {
        installerUrl = manifest.platforms['darwin-x64']?.url || manifest.platforms['darwin-arm64']?.url;
    } else if (platform === 'linux') {
        installerUrl = manifest.platforms['linux-x64']?.url;
    }

    if (!installerUrl) {
        const errorMsg = `No update URL found for platform: ${platformKey}`;
        logError(errorMsg, "updater:download");
        broadcast("update:status", "error", errorMsg);
        return;
    }

    broadcast("update:status", "downloading");
    try {
        const win = BrowserWindow.getAllWindows()[0];
        const dl = await download(win, installerUrl, {
            onProgress: (progress) => broadcast("update:status", "downloading", progress),
            onCompleted: (file) => {
                downloadedFilePath = file.path;
                broadcast("update:status", "downloaded");
            },
        });
    } catch (error) {
        logError(error, "updater:download");
        broadcast("update:status", "error", error.message);
    }
}

export function installUpdate() {
    if (downloadedFilePath) {
        shell.openPath(downloadedFilePath).then(isOpened => {
            if(isOpened) {
                app.quit();
            } else {
                broadcast("update:status", "error", "Failed to open installer.");
            }
        });
    } else {
        logError("No downloaded file path to install", "updater:install");
        broadcast("update:status", "error", "No update file found to install.");
    }
} 