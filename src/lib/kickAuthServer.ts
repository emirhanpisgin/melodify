import express from "express";
import { BrowserWindow, shell } from "electron";
import { generateCodeChallenge, generateCodeVerifier } from "./pkceUtils";
import type { Server } from "http";
import Config from "./config";
import { listenToChat } from "./kick";

const redirectUri = "http://localhost:8889/callback";
const port = 8889;

//@ts-ignore
let serverInstance: Server | null = null;

export async function startKickAuthServer(window: BrowserWindow): Promise<void> {
    if (serverInstance) return;

    const app = express();

    return new Promise((resolve, reject) => {
        app.get("/callback", async (req, res) => {
            const code = req.query.code as string | undefined;

            if (!code) {
                res.status(400).send("Missing code parameter");
                reject(new Error("Missing code parameter"));
                return;
            }

            try {
                const { codeVerifier } = Config.getKick();
                if (!codeVerifier) {
                    res.status(500).send("Missing code verifier.");
                    reject(new Error("Missing code verifier"));
                    return;
                }

                const { kickClientId, kickClientSecret } = Config.getSecrets();
                if (!kickClientId || !kickClientSecret) {
                    window.webContents.send("toast", {
                        message: "Check settings for Kick client ID and secret.",
                        type: "error",
                    });
                    return;
                }

                const params = new URLSearchParams({
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: redirectUri,
                    client_id: kickClientId,
                    client_secret: kickClientSecret,
                    code_verifier: codeVerifier,
                });

                const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params.toString(),
                });

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
                }

                const tokenData = await tokenResponse.json();

                Config.setKick({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresAt: tokenData.expires_in,
                });

                const channelRequest = await fetch("https://api.kick.com/public/v1/channels", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });

                if (!channelRequest.ok) {
                    throw new Error(`Failed to fetch channels: ${channelRequest.statusText}`);
                }

                const { data } = await channelRequest.json();

                const username = data[0]?.slug;

                const chatroomRequest = await fetch(`https://kick.com/api/v2/channels/${username}/chatroom`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });

                if (!chatroomRequest.ok) {
                    throw new Error(`Failed to fetch chatroom: ${chatroomRequest.statusText}`);
                }

                const chatroomData = await chatroomRequest.json();

                Config.setKick({
                    userId: data[0].broadcaster_user_id,
                    username: username,
                    chatroomId: chatroomData.id,
                });

                res.send("✅ Kick authentication successful! You can close this window.");
                window.webContents.send("kick:authenticated", {
                    username: data[0].slug,
                });
                listenToChat(window);
                resolve();
            } catch (error) {
                console.error("Kick auth error", error);
                res.status(500).send("❌ Kick authentication failed.");
                reject(error);
            } finally {
                if (serverInstance) {
                    serverInstance.close();
                    serverInstance = null;
                }
            }
        });

        serverInstance = app.listen(port, () => {
            console.log(`🌐 Kick Auth server running at http://localhost:${port}`);
        });
    });
}

export function openKickAuthUrl() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const scopes = "chat:write user:read channel:read";

    const tokens = Config.getKick();
    const { kickClientId } = Config.getSecrets();
    tokens.codeVerifier = codeVerifier;

    Config.setKick(tokens);

    const state = Math.random().toString(36).slice(2);

    const url =
        `https://id.kick.com/oauth/authorize?` +
        `response_type=code` +
        `&client_id=${kickClientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256` +
        `&state=${state}`;

    console.log(`🌍 Opening Kick auth URL: ${url}`);
    shell.openExternal(url);
}
