import fetch from "node-fetch";
import Config from "../../../core/config";
import { logInfo, logError, logWarn, logDebug } from "../../../core/logging";
import { redactSecrets } from "../../../core/logging/utils";

export interface KickTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface KickUser {
    id: number;
    username: string;
    slug: string;
    broadcaster_user_id: number;
}

export interface KickChatroom {
    id: string;
    channel_id: number;
}

export interface KickChannel {
    id: number;
    slug: string;
    broadcaster_user_id: number;
}

interface KickTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

interface KickChannelsResponse {
    data: KickChannel[];
}

interface KickChatroomResponse {
    chatroom: {
        id: string;
    };
    id: number;
}

interface KickChannelResponse {
    id: number;
    user: {
        username: string;
        id: number;
    };
    slug: string;
}

export class KickClient {
    private baseUrl = "https://api.kick.com";
    private authUrl = "https://id.kick.com/oauth/token";
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private expiresAt: number | null = null;

    constructor() {
        this.loadTokens();
    }

    /**
     * Load tokens from config
     */
    private loadTokens(): void {
        this.accessToken = Config.get("kickAccessToken") || null;
        this.refreshToken = Config.get("kickRefreshToken") || null;
        this.expiresAt = Config.get("kickExpiresAt") || null;
    }

    /**
     * Save tokens to config
     */
    private saveTokens(tokens: KickTokens): void {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.expiresAt = tokens.expiresAt;

        Config.set({
            kickAccessToken: tokens.accessToken,
            kickRefreshToken: tokens.refreshToken,
            kickExpiresAt: tokens.expiresAt,
        });
    }

    /**
     * Clear tokens from config
     */
    public clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;

        Config.set({
            kickAccessToken: undefined,
            kickRefreshToken: undefined,
            kickExpiresAt: undefined,
        });
    }

    /**
     * Check if tokens are available
     */
    public hasTokens(): boolean {
        return !!(this.accessToken && this.refreshToken && this.expiresAt);
    }

    /**
     * Check if access token is expired
     */
    public isTokenExpired(): boolean {
        if (!this.expiresAt) return true;
        return Date.now() >= this.expiresAt;
    }

    /**
     * Get valid access token, refreshing if necessary
     */
    public async getValidAccessToken(): Promise<string | null> {
        if (!this.hasTokens()) {
            return null;
        }

        if (this.isTokenExpired()) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                return null;
            }
        }

        return this.accessToken;
    }

    /**
     * Refresh access token using refresh token
     */
    public async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            logError("No refresh token available", "KickClient:refreshAccessToken");
            return false;
        }

        try {
            const clientId = Config.get("kickClientId");
            const clientSecret = Config.get("kickClientSecret");

            if (!clientId || !clientSecret) {
                logError("Missing Kick client credentials", "KickClient:refreshAccessToken");
                return false;
            }

            const params = new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: this.refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            });

            logDebug("Refreshing Kick token", redactSecrets(Object.fromEntries(params)));

            const response = await fetch(this.authUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            if (!response.ok) {
                throw new Error(`Failed to refresh token: ${response.statusText}`);
            }

            const data = await response.json() as KickTokenResponse;
            const { access_token, refresh_token, expires_in } = data;

            this.saveTokens({
                accessToken: access_token,
                refreshToken: refresh_token || this.refreshToken,
                expiresAt: Date.now() + expires_in * 1000,
            });

            logInfo("Kick access token refreshed successfully");
            return true;
        } catch (error) {
            logError(error, "KickClient:refreshAccessToken");
            return false;
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    public async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<boolean> {
        try {
            const clientId = Config.get("kickClientId");
            const clientSecret = Config.get("kickClientSecret");
            const redirectUri = Config.get("kickRedirectUri") || "http://127.0.0.1:8889/callback";

            if (!clientId || !clientSecret) {
                throw new Error("Missing Kick client credentials");
            }

            const params = new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
                code_verifier: codeVerifier,
            });

            logDebug("Exchanging code for tokens", redactSecrets(Object.fromEntries(params)));

            const response = await fetch(this.authUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
            }

            const data = await response.json() as KickTokenResponse;
            const { access_token, refresh_token, expires_in } = data;

            this.saveTokens({
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: Date.now() + expires_in * 1000,
            });

            logInfo("Kick tokens obtained successfully");
            return true;
        } catch (error) {
            logError(error, "KickClient:exchangeCodeForTokens");
            return false;
        }
    }

    /**
     * Get user's channels
     */
    public async getChannels(): Promise<KickChannel[]> {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error("No valid access token available");
        }

        const response = await fetch(`${this.baseUrl}/public/v1/channels`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch channels: ${response.statusText}`);
        }

        const { data } = await response.json() as KickChannelsResponse;
        return data;
    }

    /**
     * Get chatroom for a channel
     */
    public async getChatroom(username: string): Promise<KickChatroom> {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error("No valid access token available");
        }

        const response = await fetch(`${this.baseUrl}/public/v1/channels/${username}/chatroom`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch chatroom: ${response.statusText}`);
        }

        return await response.json() as KickChatroom;
    }

    /**
     * Find chatroom by username (public API)
     */
    public async findChatroom(username: string): Promise<{ chatroomId: string; userId: number } | null> {
        try {
            const response = await fetch(`https://kick.com/api/v1/${username}/chatroom`);
            const data = await response.json() as KickChatroomResponse;

            if (!response.ok || !data.chatroom?.id) {
                return null;
            }

            return {
                chatroomId: data.chatroom.id,
                userId: data.id,
            };
        } catch (error) {
            logError(error, "KickClient:findChatroom");
            return null;
        }
    }

    /**
     * Send a message to chat
     */
    public async sendMessage(message: string, broadcasterUserId: number): Promise<void> {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error("No valid access token available");
        }

        const response = await fetch(`${this.baseUrl}/public/v1/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                broadcaster_user_id: broadcasterUserId,
                content: message,
                type: "bot",
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }
    }

    /**
     * Get user profile
     */
    public async getUserProfile(username: string): Promise<KickUser | null> {
        try {
            const response = await fetch(`https://kick.com/api/v1/channels/${username}`);
            
            if (!response.ok) {
                return null;
            }

            const data = await response.json() as KickChannelResponse;
            return {
                id: data.id,
                username: data.user.username,
                slug: data.slug,
                broadcaster_user_id: data.user.id,
            };
        } catch (error) {
            logError(error, "KickClient:getUserProfile");
            return null;
        }
    }

    /**
     * Validate client credentials
     */
    public async validateCredentials(clientId: string, clientSecret: string): Promise<boolean> {
        try {
            const params = new URLSearchParams({
                grant_type: "client_credentials",
            });

            const response = await fetch(this.authUrl, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            return response.ok;
        } catch (error) {
            logError(error, "KickClient:validateCredentials");
            return false;
        }
    }
}

// Export a singleton instance
export const kickClient = new KickClient(); 