import { ipcMain, BrowserWindow, shell } from "electron";
import psList from "ps-list";
import Config from "../lib/config";
import { getSpotifyApi, refreshAccessTokenIfNeeded } from "../lib/spotify";
import { startSpotifyAuthServer } from "../lib/spotifyAuthServer";

ipcMain.on("spotify:auth", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    startSpotifyAuthServer(window);

    const scopes = [
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-private",
    ];

    const spotifyApi = getSpotifyApi();

    if (!spotifyApi) {
        window.webContents.send("toast", {
            type: "error",
            message: "Spotify API not initialized. Please try again.",
        });
        return;
    }

    const authURL = spotifyApi.createAuthorizeURL(scopes, "state");
    shell.openExternal(authURL);
});

ipcMain.handle("spotify:getUserData", async () => {
    try {
        const spotifyApi = getSpotifyApi();

        const me = await spotifyApi.getMe();
        return me.body;
    } catch (err) {
        console.error("Failed to get user data", err);
        return null;
    }
});

ipcMain.handle("spotify:checkAuth", async () => {
    const tokens = Config.getSpotify();
    if (!tokens) {
        return { authenticated: false };
    }

    const refreshed = await refreshAccessTokenIfNeeded();
    if (!refreshed) {
        return { authenticated: false };
    }

    try {
        const spotifyApi = getSpotifyApi();

        const me = await spotifyApi.getMe();
        return { authenticated: true, user: me.body };
    } catch (err) {
        return { authenticated: false };
    }
});

ipcMain.on("spotify:logout", () => {
    const spotifyApi = getSpotifyApi();

    Config.clearSpotify();
    spotifyApi.setAccessToken("");
    spotifyApi.setRefreshToken("");
});

ipcMain.handle("spotify:isRunning", async () => {
    const processes = await psList();

    const isRunning = processes.some((proc) => proc.name.toLowerCase().includes("spotify"));

    return isRunning;
});

ipcMain.handle("spotify:hasSecrets", () => {
    const { spotifyClientId, spotifyClientSecret } = Config.getSecrets();
    return !!spotifyClientId && !!spotifyClientSecret;
});

ipcMain.handle("spotify:getSecrets", () => {
    const { spotifyClientId, spotifyClientSecret } = Config.getSecrets();
    return { spotifyClientId, spotifyClientSecret };
});

ipcMain.on("spotify:setSecrets", (event, secrets) => {
    const { spotifyClientId, spotifyClientSecret } = secrets;

    if (!spotifyClientId || !spotifyClientSecret) {
        event.sender.send("toast", {
            type: "error",
            message: "Spotify Client ID and Secret are required.",
        });
        return;
    }

    Config.setSecrets({
        spotifyClientId,
        spotifyClientSecret,
    });
});
