import { ipcMain, shell } from "electron";
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
