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

ipcMain.on("spotify:playSong", async (event, songQuery) => {
    const spotifyApi = getSpotifyApi();

    if (!spotifyApi) {
        event.sender.send("toast", {
            type: "error",
            message: "Spotify API not initialized. Please try again.",
        });
        return;
    }

    try {
        const searchResults = await spotifyApi.searchTracks(songQuery, { limit: 10, market: "TR" });
        const tracks = searchResults.body.tracks.items;

        if (tracks.length === 0) {
            event.sender.send("toast", {
                type: "error",
                message: "No songs found for the given query.",
            });
            return;
        }

        const trackUri = tracks[0].uri;
        await spotifyApi.addToQueue(trackUri);

        event.sender.send("toast", {
            type: "success",
            message: `Playing "${tracks[0].name}" by ${tracks[0].artists.map((a) => a.name).join(", ")}`,
        });
    } catch (err) {
        console.error("Failed to play song", err);
        event.sender.send("toast", {
            type: "error",
            message: "Failed to play song. Please try again.",
        });
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
        return { authenticated: true, username: me.body.display_name };
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
        Config.setSecrets({
            spotifyClientId,
            spotifyClientSecret,
        });

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
