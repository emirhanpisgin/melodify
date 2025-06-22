import { BrowserWindow } from "electron";
import { saveTokens, getSpotifyApi } from "./spotify";
import express from "express";

// Make startSpotifyAuthServer accept window or webContents to send events back to frontend
export function startSpotifyAuthServer(window: BrowserWindow) {
    const app = express();
    const port = 8888;

    app.get("/callback", async (req, res) => {
        const code = req.query.code as string | undefined;
        if (!code) {
            res.status(400).send("Missing code");
            return;
        }

        try {
            const spotifyApi = getSpotifyApi();

            if (!spotifyApi) {
                window.webContents.send("toast", {
                    type: "error",
                    message: "Spotify API not initialized. Please try again.",
                });
                return;
            }

            const data = await spotifyApi.authorizationCodeGrant(code);
            const { access_token, refresh_token, expires_in } = data.body;

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            saveTokens({ accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in });

            res.send("Spotify authentication successful! You can close this window.");
            console.log("✅ Spotify authenticated.");

            // Send IPC message back to frontend
            window.webContents.send("spotify:authenticated");
        } catch (err) {
            console.error("Spotify auth error", err);
            res.status(500).send("Spotify authentication failed.");
        }
    });

    app.listen(port, () => {
        console.log(`Spotify Auth server running at http://127.0.0.1:${port}`);
    });
}
