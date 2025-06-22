import fetch from "node-fetch";
import Config from "./config";

const redirectUri = "http://localhost:8889/callback";

async function refreshAccessTokenIfNeeded(window?: Electron.BrowserWindow): Promise<boolean> {
    const tokens = Config.getKick();
    if (!tokens) return false;

    if (Date.now() >= (tokens.expiresAt as number)) {
        try {
            const { kickClientId, kickClientSecret } = Config.getSecrets();
            if (!kickClientId || !kickClientSecret) {
                window.webContents.send("toast", {
                    type: "error",
                    message: "Kick client ID or secret is not set. Please configure in settings.",
                });
                return false;
            }
            const params = new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: `${tokens.refreshToken}`,
                client_id: kickClientId,
                client_secret: kickClientSecret,
            });

            const res = await fetch("https://kick.com/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });

            if (!res.ok) {
                throw new Error(`Failed to refresh token: ${res.statusText}`);
            }

            const data = await res.json();
            const { access_token, refresh_token, expires_in } = data as any;

            Config.setKick({
                accessToken: access_token,
                refreshToken: refresh_token ?? tokens.refreshToken,
                expiresAt: expires_in,
            });

            console.log("Kick access token refreshed");
            return true;
        } catch (error) {
            console.error("Failed to refresh Kick access token", error);
            Config.clearKick();
            return false;
        }
    }

    return true;
}

export { refreshAccessTokenIfNeeded };

export default {
    redirectUri,
};
