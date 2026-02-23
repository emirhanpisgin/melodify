import fetch from "node-fetch";
import Config from "@/core/config";
import { logDebug, logError, logWarn } from "@/core/logging";
import { redactSecrets } from "@/core/logging/utils";

interface TwitchTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

class TwitchClient {
    private baseUrl = "https://api.twitch.tv/helix";
    private authUrl = "https://id.twitch.tv/oauth2/token";
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private expiresAt: number | null = null;

    constructor() {
        this.loadTokens();
    }

    private loadTokens(): void {
        this.accessToken = Config.get("twitchAccessToken") || null;
        this.refreshToken = Config.get("twitchRefreshToken") || null;
        this.expiresAt = Config.get("twitchExpiresAt") || null;
    }

    private saveTokens(tokens: TwitchTokens): void {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.expiresAt = tokens.expiresAt;

        Config.set({
            twitchAccessToken: tokens.accessToken,
            twitchRefreshToken: tokens.refreshToken,
            twitchExpiresAt: tokens.expiresAt,
        });
    }

    public clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;

        Config.set({
            twitchAccessToken: undefined,
            twitchRefreshToken: undefined,
            twitchExpiresAt: undefined,
        });
    }

    public hasTokens(): boolean {
        return !!(this.accessToken && this.refreshToken && this.expiresAt);
    }

    public isTokenExpired(): boolean {
        if (!this.expiresAt) return true;
        return Date.now() >= this.expiresAt;
    }

    public getAccessToken(): string | null {
        return this.accessToken;
    }

    public updateTokens(tokens: TwitchTokens): void {
        this.saveTokens(tokens);
    }
}

export default new TwitchClient();
