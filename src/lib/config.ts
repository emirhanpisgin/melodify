import fs from "fs";
import path from "path";
import { app } from "electron";

export interface AppStore {
    spotify: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
    };
    kick: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        codeVerifier?: string;
        username?: string;
    };
    secrets: {
        spotifyClientId?: string;
        spotifyClientSecret?: string;
        kickClientId?: string;
        kickClientSecret?: string;
    };
}

const defaultStore: AppStore = {
    spotify: {},
    kick: {},
    secrets: {},
};

const storePath = path.join(app.getPath("userData"), "config.json");

let cache: AppStore = { ...defaultStore };

function load() {
    try {
        if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, "utf-8");
            cache = { ...defaultStore, ...JSON.parse(raw) };
        } else {
            save();
        }
    } catch (err) {
        console.error("Failed to load config:", err);
        cache = { ...defaultStore };
    }
}

function save() {
    try {
        fs.writeFileSync(storePath, JSON.stringify(cache, null, 2), "utf-8");
    } catch (err) {
        console.error("Failed to save config:", err);
    }
}

load();

const Config = {
    getSpotify(): AppStore["spotify"] {
        return cache.spotify;
    },
    setSpotify(data: Partial<AppStore["spotify"]>) {
        cache.spotify = { ...cache.spotify, ...data };
        save();
    },
    clearSpotify() {
        cache.spotify = {};
        save();
    },

    getKick(): AppStore["kick"] {
        return cache.kick;
    },
    setKick(data: Partial<AppStore["kick"]>) {
        cache.kick = { ...cache.kick, ...data };
        save();
    },
    clearKick() {
        cache.kick = {};
        save();
    },
    getKickUsername(): string | undefined {
        return cache.kick.username;
    },
    setKickUsername(username: string) {
        cache.kick.username = username;
        save();
    },

    getSecrets(): AppStore["secrets"] {
        return cache.secrets;
    },
    setSecrets(data: Partial<AppStore["secrets"]>) {
        cache.secrets = { ...cache.secrets, ...data };
        save();
    },

    reset() {
        cache = { ...defaultStore };
        save();
    },

    getPath(): string {
        return storePath;
    },
};

export default Config;
