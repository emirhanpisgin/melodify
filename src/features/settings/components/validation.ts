// Validation functions
export const validateUrl = (url: string): string | null => {
    if (!url.trim()) return "Please enter a URL";
    try {
        new URL(url);
        return null;
    } catch {
        return "Please enter a valid URL (e.g., http://example.com)";
    }
};

export const validateClientId = (id: string): string | null => {
    if (!id.trim()) return "Please enter a Client ID";
    if (id.length < 10) return "Client ID appears to be too short";
    if (id.length > 100) return "Client ID appears to be too long";
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return "Client ID can only contain letters, numbers, hyphens, and underscores";
    return null;
};

export const validateClientSecret = (secret: string): string | null => {
    if (!secret.trim()) return "Please enter a Client Secret";
    if (secret.length < 20) return "Client Secret appears to be too short";
    if (secret.length > 200) return "Client Secret appears to be too long";
    return null;
};

export const validateCommandAlias = (alias: string, existingAliases: string[], commandName: string): string | null => {
    if (!alias.trim()) return "Please enter an alternative command name";
    if (alias.length < 1) return "Alternative name must be at least 1 character";
    if (alias.length > 20) return "Alternative name must be no more than 20 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) return "Alternative name can only contain letters, numbers, hyphens, and underscores";
    if (alias === commandName) return "Alternative name cannot be the same as the main command";
    if (existingAliases.includes(alias)) return "This alternative name is already in use";
    return null;
};

export const validateTemplate = (template: string, allowedVars: string[]): string | null => {
    if (!template.trim()) return "Please enter a message";
    if (template.length > 500) return "Message must be no more than 500 characters";

    // Check for valid variables
    const variableRegex = /\{([^}]+)\}/g;
    const matches = template.match(variableRegex);
    if (matches) {
        for (const match of matches) {
            const varName = match.slice(1, -1);
            if (!allowedVars.includes(varName)) {
                return `Unknown variable: {${varName}}. Available variables: ${allowedVars.join(', ')}`;
            }
        }
    }
    return null;
};

// Real-time validation function
export const validateField = (key: string, value: any): string | null => {
    switch (key) {
        case "prefix":
            if (typeof value === "string") {
                if (!value || value.length < 1) return "Prefix cannot be empty";
                if (value.length > 10) return "Prefix too long (max 10 characters)";
                if (!/^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(value)) {
                    return "Prefix should be a special character (e.g., !, @, #, $)";
                }
            }
            break;
        case "kickRedirectUri":
        case "spotifyRedirectUri":
            if (typeof value === "string" && value) {
                return validateUrl(value);
            }
            break;
        case "spotifyClientId":
        case "kickClientId":
            if (typeof value === "string" && value) {
                return validateClientId(value);
            }
            break;
        case "spotifyClientSecret":
        case "kickClientSecret":
            if (typeof value === "string" && value) {
                return validateClientSecret(value);
            }
            break;
        case "songRequestReplyTemplate":
            if (typeof value === "string" && value) {
                return validateTemplate(value, ['title', 'artist']);
            }
            break;
        case "songRequestErrorTemplate":
        case "volumeErrorTemplate":
            if (typeof value === "string" && value) {
                return validateTemplate(value, ['error']);
            }
            break;
        case "volumeChangeReplyTemplate":
        case "volumeGetReplyTemplate":
            if (typeof value === "string" && value) {
                return validateTemplate(value, ['volume']);
            }
            break;
        case "customModerators":
            if (Array.isArray(value)) {
                const seenModerators = new Set<string>();
                for (const moderator of value) {
                    if (!moderator || typeof moderator !== "string") {
                        return "All moderator usernames must be valid strings";
                    }
                    if (moderator.length < 1) {
                        return "Moderator usernames cannot be empty";
                    }
                    if (moderator.length > 50) {
                        return "Moderator usernames must be no more than 50 characters";
                    }
                    if (!/^[a-zA-Z0-9_-]+$/.test(moderator)) {
                        return "Moderator usernames can only contain letters, numbers, hyphens, and underscores";
                    }
                    if (seenModerators.has(moderator.toLowerCase())) {
                        return `Duplicate moderator username: ${moderator}`;
                    }
                    seenModerators.add(moderator.toLowerCase());
                }
            }
            break;
        case "currentSongFilePath":
            if (typeof value === "string" && value) {
                if (value.length > 500) {
                    return "File path too long (max 500 characters)";
                }
                // Basic path validation - check for invalid characters
                // Allow colons for Windows drive letters (e.g., C:)
                if (/[<>"|?*]/.test(value)) {
                    return "File path contains invalid characters";
                }
            }
            break;
    }
    return null;
}; 