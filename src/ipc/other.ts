import { app, autoUpdater, BrowserWindow, ipcMain, shell } from "electron";
import Config from "../lib/config";

ipcMain.on("open-external", (_, url: string) => {
    shell.openExternal(url);
});

ipcMain.handle("config:get", () => {
    return Config.get();
});

ipcMain.on("config:set", (event, newConfig) => {
    Config.set(newConfig);
});

// Auto-update integration
let autoUpdateEnabled = (Config.get("autoUpdateEnabled") as boolean) ?? true;

function broadcastUpdateStatus(status: string, data?: any) {
    BrowserWindow.getAllWindows().forEach((win) =>
        win.webContents.send("update:status", { status, ...data })
    );
}

ipcMain.on("update:check", () => {
    broadcastUpdateStatus("checking");
    autoUpdater.checkForUpdates();
});
ipcMain.on("update:setAuto", (_event, enabled: boolean) => {
    autoUpdateEnabled = enabled;
    Config.set({ autoUpdateEnabled: enabled });
});
ipcMain.handle("update:getAuto", () => autoUpdateEnabled);
ipcMain.handle("app:getVersion", () => app.getVersion());

app.on("ready", () => {
    autoUpdater.checkForUpdates();
});

autoUpdater.on("checking-for-update", () => broadcastUpdateStatus("checking"));
autoUpdater.on("update-available", () => broadcastUpdateStatus("available"));
autoUpdater.on("update-not-available", () =>
    broadcastUpdateStatus("not-available")
);
autoUpdater.on("error", (err: any) =>
    broadcastUpdateStatus("error", { error: err.message })
);
autoUpdater.on("update-downloaded", (info: any) =>
    broadcastUpdateStatus("downloaded", { info })
);
