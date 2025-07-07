import {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    dialog,
} from "electron";
import Config from "../config";
import { logDebug, logError, logInfo, logWarn } from "../logging";
import { redactSecrets } from "../logging/utils";
import { CommandManager } from "../commands/manager";
import {
    startSongFileSaving,
    stopSongFileSaving,
} from "../../features/spotify/playback/player";
import path from "path";
import { registerAllCommands } from "../commands/registry";
import { checkForUpdates, downloadUpdate, installUpdate } from "../updater";

// Create command manager instance
const commandManager = new CommandManager();
registerAllCommands(commandManager);

export { commandManager };

ipcMain.on("open-external", (_, url: string) => {
    shell.openExternal(url);
});

ipcMain.handle("config:get", () => {
    return Config.get();
});

ipcMain.on("config:set", (event, newConfig) => {
    const oldConfig = Config.get();
    Config.set(newConfig);

    // Handle song file saving toggle
    const oldSaveToFile = oldConfig.saveCurrentSongToFile;
    const newSaveToFile = newConfig.saveCurrentSongToFile;

    if (oldSaveToFile !== newSaveToFile) {
        if (newSaveToFile) {
            startSongFileSaving();
        } else {
            stopSongFileSaving();
        }
    }

    // Handle startup setting changes
    const oldStartOnStartup = oldConfig.startOnStartup;
    const newStartOnStartup = newConfig.startOnStartup;

    if (oldStartOnStartup !== newStartOnStartup) {
        if (newStartOnStartup) {
            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: true,
            });
            logInfo("App configured to start on startup", "config:set");
        } else {
            app.setLoginItemSettings({
                openAtLogin: false,
            });
            logInfo("App configured to not start on startup", "config:set");
        }
    }

    // Handle command alias updates
    const oldCommandsConfig = oldConfig.commandsConfig || {};
    const newCommandsConfig = newConfig.commandsConfig || {};

    // Check for changes in command aliases and update CommandManager
    for (const [commandName, newCmdConfig] of Object.entries(
        newCommandsConfig
    )) {
        const oldCmdConfig = oldCommandsConfig[commandName] || {};
        const oldAliases = oldCmdConfig.aliases || [];
        const newAliases = (newCmdConfig as any).aliases || [];

        // Check if aliases have changed
        if (
            JSON.stringify(oldAliases.sort()) !==
            JSON.stringify(newAliases.sort())
        ) {
            logDebug(
                `Updating aliases for command '${commandName}': ${oldAliases.join(
                    ", "
                )} -> ${newAliases.join(", ")}`,
                "config:set"
            );
            commandManager.updateCommandAliases(commandName, newAliases);
        }
    }

    // Also reload all command aliases from config to ensure consistency
    commandManager.reloadCommandAliasesFromConfig();
});

// Update integration
ipcMain.on("update:check", () => {
    checkForUpdates();
});

ipcMain.on("update:download", (_event, manifest) => {
    downloadUpdate(manifest);
});

ipcMain.on("update:install", () => {
    installUpdate();
});

let autoUpdateEnabled = (Config.get("autoUpdateEnabled") as boolean) ?? true;

ipcMain.on("update:setAuto", (_event, enabled: boolean) => {
    autoUpdateEnabled = enabled;
    Config.set({ autoUpdateEnabled: enabled });
});

ipcMain.handle("update:getAuto", () => autoUpdateEnabled);
ipcMain.handle("app:getVersion", () => app.getVersion());

// Startup setting handlers
ipcMain.handle("startup:getStatus", () => {
    const loginItemSettings = app.getLoginItemSettings();
    return loginItemSettings.openAtLogin;
});

ipcMain.on("startup:setStatus", (_event, enabled: boolean) => {
    if (enabled) {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
        });
        logInfo("App configured to start on startup", "startup:setStatus");
    } else {
        app.setLoginItemSettings({
            openAtLogin: false,
        });
        logInfo("App configured to not start on startup", "startup:setStatus");
    }
    Config.set({ startOnStartup: enabled });
});

app.on("ready", () => {
    if (autoUpdateEnabled) {
        checkForUpdates();
    }

    // Initialize song file saving if enabled
    if (Config.get("saveCurrentSongToFile")) {
        startSongFileSaving();
    }

    // Initialize startup setting
    const startOnStartup = Config.get("startOnStartup");
    if (startOnStartup) {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
        });
        logInfo("App configured to start on startup", "app:ready");
    }
});

ipcMain.on("log:info", (_event, { message, meta }) => {
    logInfo(`[renderer] ${message}`, redactSecrets(meta));
});
ipcMain.on("log:warn", (_event, { message, meta }) => {
    logWarn(`[renderer] ${message}`, redactSecrets(meta));
});
ipcMain.on("log:error", (_event, { message }) => {
    logError(`[renderer] ${message}`);
});
ipcMain.on("log:debug", (_event, { message, meta }) => {
    logDebug(`[renderer] ${message}`, redactSecrets(meta));
});

ipcMain.handle("commands:getAll", () => {
    return commandManager.getAllSerializable();
});
ipcMain.on("commands:setEnabled", (_event, { name, enabled }) => {
    commandManager.setEnabled(name, enabled);
});

// Add IPC handler for updating command aliases
ipcMain.on("commands:updateAliases", (_event, { name, aliases }) => {
    const success = commandManager.updateCommandAliases(name, aliases);
    if (success) {
        // Update the config to persist the changes
        const commandsConfig = Config.get("commandsConfig") || {};
        if (!commandsConfig[name]) {
            commandsConfig[name] = {};
        }
        commandsConfig[name].aliases = aliases;
        Config.set({ commandsConfig });
        logInfo(
            `Updated aliases for command '${name}' via IPC: ${aliases.join(
                ", "
            )}`,
            "commands:updateAliases"
        );
    } else {
        logError(
            `Failed to update aliases for command '${name}': ${aliases.join(
                ", "
            )}`,
            "commands:updateAliases"
        );
    }
});

// File dialog for song file path selection
ipcMain.handle("file:selectSongFilePath", async () => {
    try {
        const result = await dialog.showSaveDialog({
            title: "Select file to save current song",
            defaultPath:
                Config.get("currentSongFilePath") ||
                path.join(app.getPath("userData"), "current-song.txt"),
            filters: [
                { name: "Text Files", extensions: ["txt"] },
                { name: "All Files", extensions: ["*"] },
            ],
            properties: ["createDirectory"],
        });

        if (!result.canceled && result.filePath) {
            return result.filePath;
        }
        return null;
    } catch (error) {
        logError(error, "file:selectSongFilePath");
        return null;
    }
});
