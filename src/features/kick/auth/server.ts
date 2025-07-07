import express from "express";
import { BrowserWindow, shell } from "electron";
import { generateCodeChallenge, generateCodeVerifier } from "../../../shared/utils/pkce";
import type { Server } from "http";
import Config from "../../../core/config";
import { listenToChat } from "../chat/listener";
import { logInfo, logError, logWarn, logDebug } from "../../../core/logging";
import { redactSecrets } from "../../../core/logging/utils";
import { kickClient } from "../api/client";

const redirectUri = Config.get("kickRedirectUri") || "http://localhost:8889/callback";
const port = 8889;

//@ts-ignore
let serverInstance: Server | null = null;

export async function startKickAuthServer(window: BrowserWindow): Promise<void> {
    logDebug("startKickAuthServer called", redactSecrets({ window: !!window }));
    if (serverInstance) return;

    const app = express();

    return new Promise((resolve, reject) => {
        app.get("/callback", async (req, res) => {
            const code = req.query.code as string | undefined;
            logDebug("Kick auth callback hit", redactSecrets({ code }));

            if (!code) {
                res.status(400).send("Missing code parameter");
                reject(new Error("Missing code parameter"));
                return;
            }

            try {
                const codeVerifier = Config.get("codeVerifier");
                if (!codeVerifier) {
                    res.status(500).send("Missing code verifier.");
                    reject(new Error("Missing code verifier"));
                    return;
                }

                // Exchange code for tokens using KickClient
                const tokenExchangeSuccess = await kickClient.exchangeCodeForTokens(code, codeVerifier);
                if (!tokenExchangeSuccess) {
                    throw new Error("Failed to exchange code for tokens");
                }

                logInfo("Kick tokens obtained successfully");

                // Get user's channels using KickClient
                const channels = await kickClient.getChannels();
                if (!channels || channels.length === 0) {
                    throw new Error("No channels found for user");
                }

                const username = channels[0].slug;

                // Get chatroom using KickClient
                const chatroom = await kickClient.getChatroom(username);

                Config.set({
                    userId: channels[0].broadcaster_user_id.toString(),
                    username: username,
                    chatroomId: chatroom.id,
                });

                logInfo("Kick user/channel/chatroom set", redactSecrets({ 
                    userId: channels[0].broadcaster_user_id, 
                    username, 
                    chatroomId: chatroom.id 
                }));

                res.send("✅ Kick authentication successful! You can close this window.");
                window.webContents.send("kick:authenticated", {
                    username: channels[0].slug,
                });
                listenToChat(window);
                resolve();
            } catch (error) {
                logError(error, "kickAuthServer:startKickAuthServer");
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
            logInfo(`Kick Auth server running at http://localhost:${port}`);
        });
    });
}

export function openKickAuthUrl() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const scopes = "chat:write user:read channel:read";

    Config.set({ codeVerifier });

    const kickClientId = Config.get("kickClientId");
    const state = Math.random().toString(36).slice(2);

    const url =
        `https://id.kick.com/oauth/authorize?` +
        `response_type=code` +
        `&client_id=${kickClientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

    shell.openExternal(url);
}

// All legacy Config.getKick, Config.setKick, Config.getSecrets usages removed. All config is now flat and type-safe.
