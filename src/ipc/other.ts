import { ipcMain, shell } from "electron";

ipcMain.on("open-external", (_, url: string) => {
    shell.openExternal(url);
});
