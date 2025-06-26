import { ipcMain, BrowserWindow, shell } from "electron";
import psList from "ps-list";
import Config from "../lib/config";
import { getSpotifyApi, refreshAccessTokenIfNeeded } from "../lib/spotify";
import { startSpotifyAuthServer } from "../lib/spotifyAuthServer";
import { exec } from "child_process";
import { promisify } from "util";
import { logError } from "../lib/logger";

const execAsync = promisify(exec);

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

    const authURL = spotifyApi.createAuthorizeURL(scopes, "state");
    shell.openExternal(authURL);
});

ipcMain.handle("spotify:getUserData", async () => {
    try {
        const spotifyApi = getSpotifyApi();
        const me = await spotifyApi.getMe();
        return me.body;
    } catch (err) {
        logError(err, "spotify:getUserData");
        console.error("Failed to get user data", err);
        return null;
    }
});

ipcMain.handle("spotify:checkAuth", async () => {
    const accessToken = Config.get("spotifyAccessToken");
    const refreshToken = Config.get("spotifyRefreshToken");
    if (!accessToken || !refreshToken) {
        return { authenticated: false };
    }
    const refreshed = await refreshAccessTokenIfNeeded();
    if (!refreshed) {
        return { authenticated: false };
    }
    try {
        const spotifyApi = getSpotifyApi();
        const me = await spotifyApi.getMe();
        return { authenticated: true, username: me.body.display_name };
    } catch (err) {
        logError(err, "spotify:checkAuth");
        return { authenticated: false };
    }
});

ipcMain.on("spotify:logout", () => {
    const spotifyApi = getSpotifyApi();
    Config.set({ spotifyAccessToken: undefined, spotifyRefreshToken: undefined, spotifyExpiresAt: undefined });
    spotifyApi.setAccessToken("");
    spotifyApi.setRefreshToken("");
});

ipcMain.handle("spotify:isRunning", async () => {
    try {
        const processes = await psList();
        return processes.some((proc) => proc.name.toLowerCase().includes("spotify"));
    } catch (err) {
        console.warn("ps-list failed, falling back to tasklist:", err);
        try {
            const { stdout } = await execAsync("tasklist");
            return stdout.toLowerCase().includes("spotify.exe");
        } catch (execErr) {
            console.error("tasklist also failed:", execErr);
            return false;
        }
    }
});

ipcMain.handle("spotify:hasSecrets", () => {
    const spotifyClientId = Config.get("spotifyClientId");
    const spotifyClientSecret = Config.get("spotifyClientSecret");
    return !!spotifyClientId && !!spotifyClientSecret;
});

ipcMain.handle("spotify:getSecrets", () => {
    return {
        spotifyClientId: Config.get("spotifyClientId"),
        spotifyClientSecret: Config.get("spotifyClientSecret"),
    };
});

ipcMain.handle("spotify:setSecrets", async (event, secrets) => {
    const { spotifyClientId, spotifyClientSecret } = secrets;
    if (!spotifyClientId || !spotifyClientSecret) {
        return { success: false, error: "Missing client ID or secret." };
    }
    // Try to get a token using Client Credentials Flow to validate the credentials
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    try {
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                Authorization: "Basic " + Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: "Invalid client ID or secret." };
        }
        // Save secrets if valid
        Config.set({ spotifyClientId, spotifyClientSecret });
        return { success: true };
    } catch (err) {
        return { success: false, error: "Failed to validate credentials." };
    }
});

ipcMain.handle("spotify:hasSession", async () => {
    const spotifyApi = getSpotifyApi();
    if (!spotifyApi) return false;
    const devices = await spotifyApi.getMyDevices();
    if (!devices.body.devices.length) {
        return false;
    }
    return true;
});
