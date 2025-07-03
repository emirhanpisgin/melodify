const SECRET_KEYS = [
    "accessToken",
    "refreshToken",
    "clientSecret",
    "spotifyAccessToken",
    "spotifyRefreshToken",
    "spotifyClientSecret",
    "kickAccessToken",
    "kickRefreshToken",
    "kickClientSecret",
    "token",
    "secret",
    "password",
    "jwt",
    "idToken",
    "session",
    "codeVerifier",
];

function isObject(val: any): val is Record<string, any> {
    return val && typeof val === "object" && !Array.isArray(val);
}

export function redactSecrets(obj: any, depth = 0): any {
    if (depth > 3) return "[Object]";
    if (Array.isArray(obj)) return obj.map((v) => redactSecrets(v, depth + 1));
    if (!isObject(obj)) return obj;
    const redacted: Record<string, any> = {};
    for (const key in obj) {
        if (
            SECRET_KEYS.some((secretKey) =>
                key.toLowerCase().includes(secretKey.toLowerCase())
            )
        ) {
            redacted[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
            redacted[key] = redactSecrets(obj[key], depth + 1);
        } else {
            redacted[key] = obj[key];
        }
    }
    return redacted;
}
