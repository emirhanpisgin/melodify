// src/lib/kickCommands.ts
// Modular chat command parsing for Kick chat

/**
 * Parses a chat message and returns a command object if it matches a known command.
 * @param message The chat message string
 * @param prefix The command prefix (e.g. !sr)
 */
export function parseKickCommand(message: string, prefix: string = "!sr") {
    if (!message.startsWith(prefix)) return null;
    const args = message.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();
    return { command, args };
}

// Example usage:
// const result = parseKickCommand("!sr play never gonna give you up");
// if (result?.command === "play") { ... }
