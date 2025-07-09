import crypto from "crypto";

export function generateCodeVerifier(length = 128) {
    // Generate a random string with allowed characters for PKCE
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let codeVerifier = "";
    for (let i = 0; i < length; i++) {
        codeVerifier += possible.charAt(
            Math.floor(Math.random() * possible.length)
        );
    }
    return codeVerifier;
}

export function generateCodeChallenge(codeVerifier: string) {
    const hash = crypto.createHash("sha256").update(codeVerifier).digest();
    // base64-url encode (replace + / = characters)
    return hash
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
