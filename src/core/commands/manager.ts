// Command system for Kick chat

import Config from "../config";
import { logError, logWarn, logDebug, logInfo } from "../logging";

export interface CommandContext {
    username: string;
    message: string;
    badges: string[];
    raw?: any;
}

export interface Command {
    name: string;
    description: string;
    usage: string;
    enabled: boolean;
    modOnly?: boolean;
    aliases?: string[];
    handler: (
        ctx: CommandContext,
        args: string[],
        commandManager?: CommandManager
    ) => Promise<void>;
}

export class CommandManager {
    private commands: Map<string, Command> = new Map();
    private aliasMap: Map<string, string> = new Map(); // alias -> commandName

    // Cooldown tracking
    private globalCooldownEnd: number = 0;
    private userCooldowns: Map<string, number> = new Map(); // username -> cooldown end time

    register(command: Command) {
        // Validate command structure
        const validationError = this.validateCommand(command);
        if (validationError) {
            logError(
                `Failed to register command ${command.name}: ${validationError}`,
                "CommandManager"
            );
            return false;
        }

        // Check for duplicate command names
        if (this.commands.has(command.name)) {
            logWarn(
                `Command ${command.name} already exists, overwriting`,
                "CommandManager"
            );
        }

        // Check for duplicate aliases across all commands
        if (command.aliases) {
            for (const alias of command.aliases) {
                if (this.aliasMap.has(alias)) {
                    const existingCommand = this.aliasMap.get(alias);
                    logWarn(
                        `Alias '${alias}' already exists for command '${existingCommand}', cannot use for '${command.name}'`,
                        "CommandManager"
                    );
                    return false;
                }
            }
        }

        // Load enabled state and aliases from config
        const commandsConfig = Config.get("commandsConfig") || {};
        const savedConfig = commandsConfig[command.name] || {};
        const enabled =
            savedConfig.enabled !== undefined
                ? savedConfig.enabled
                : command.enabled;
        const savedAliases = savedConfig.aliases || command.aliases || [];

        // Update command with saved state
        command.enabled = enabled;
        command.aliases = savedAliases;

        // Register command and its aliases
        this.commands.set(command.name, command);
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliasMap.set(alias, command.name);
            }
        }

        logDebug(
            `Registered command: ${
                command.name
            } (enabled: ${enabled}, aliases: ${savedAliases.join(", ")})`,
            "CommandManager"
        );
        return true;
    }

    private validateCommand(command: Command): string | null {
        if (!command.name || command.name.trim() === "") {
            return "Command name cannot be empty";
        }

        if (command.name.length > 50) {
            return "Command name too long (max 50 characters)";
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(command.name)) {
            return "Command name can only contain letters, numbers, hyphens, and underscores";
        }

        if (!command.description || command.description.trim() === "") {
            return "Command description cannot be empty";
        }

        if (command.description.length > 200) {
            return "Command description too long (max 200 characters)";
        }

        if (!command.usage || command.usage.trim() === "") {
            return "Command usage cannot be empty";
        }

        if (command.usage.length > 100) {
            return "Command usage too long (max 100 characters)";
        }

        if (typeof command.enabled !== "boolean") {
            return "Command enabled status must be a boolean";
        }

        if (typeof command.handler !== "function") {
            return "Command handler must be a function";
        }

        // Validate aliases
        if (command.aliases) {
            if (!Array.isArray(command.aliases)) {
                return "Command aliases must be an array";
            }

            if (command.aliases.length > 10) {
                return "Too many aliases (max 10)";
            }

            const seenAliases = new Set<string>();
            for (const alias of command.aliases) {
                if (!alias || alias.trim() === "") {
                    return "Alias cannot be empty";
                }

                if (alias.length > 20) {
                    return "Alias too long (max 20 characters)";
                }

                if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
                    return "Alias can only contain letters, numbers, hyphens, and underscores";
                }

                if (alias === command.name) {
                    return "Alias cannot be the same as the command name";
                }

                if (seenAliases.has(alias)) {
                    return `Duplicate alias: ${alias}`;
                }
                seenAliases.add(alias);

                // Check if this alias conflicts with any existing command or alias
                if (this.commands.has(alias)) {
                    return `Alias '${alias}' conflicts with existing command '${alias}'`;
                }

                const existingCommandForAlias = this.aliasMap.get(alias);
                if (
                    existingCommandForAlias &&
                    existingCommandForAlias !== command.name
                ) {
                    return `Alias '${alias}' is already used by command '${existingCommandForAlias}'`;
                }
            }
        }

        return null;
    }

    getAllSerializable() {
        return Array.from(this.commands.values()).map((cmd) => ({
            name: cmd.name,
            description: cmd.description,
            usage: cmd.usage,
            enabled: cmd.enabled,
            modOnly: cmd.modOnly,
            aliases: cmd.aliases || [],
        }));
    }

    getAll() {
        return Array.from(this.commands.values());
    }

    get(name: string) {
        return (
            this.commands.get(name) ||
            this.commands.get(this.aliasMap.get(name) || "")
        );
    }

    setEnabled(name: string, enabled: boolean) {
        const command = this.commands.get(name);
        if (command) {
            command.enabled = enabled;

            // Save the command state to config
            const commandsConfig = Config.get("commandsConfig") || {};
            if (!commandsConfig[name]) {
                commandsConfig[name] = {};
            }
            commandsConfig[name].enabled = enabled;
            Config.set({ commandsConfig });

            logDebug(
                `Command ${name} ${enabled ? "enabled" : "disabled"}`,
                "CommandManager"
            );
        } else {
            logWarn(
                `Attempted to set enabled state for non-existent command: ${name}`,
                "CommandManager"
            );
        }
    }

    async handle(ctx: CommandContext) {
        const message = ctx.message.trim();
        const prefix = Config.get("prefix") || "!";
        if (!message.startsWith(prefix)) return;

        const parts = message.slice(prefix.length).split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        const command = this.get(commandName);
        if (!command) {
            logDebug(`Unknown command: ${commandName}`, "CommandManager");
            return;
        }

        if (!command.enabled) {
            logDebug(`Command ${commandName} is disabled`, "CommandManager");
            return;
        }

        if (command.modOnly && !isModerator(ctx.badges, ctx.username)) {
            logDebug(
                `User ${ctx.username} attempted to use mod-only command: ${commandName}`,
                "CommandManager"
            );
            return;
        }

        try {
            await command.handler(ctx, args, this);
        } catch (error) {
            logError(error, `CommandManager:${commandName}`);
        }
    }

    // Method to update command aliases
    updateCommandAliases(commandName: string, newAliases: string[]): boolean {
        const command = this.commands.get(commandName);
        if (!command) {
            logWarn(
                `Attempted to update aliases for non-existent command: ${commandName}`
            );
            return false;
        }

        // Validate new aliases
        if (!Array.isArray(newAliases)) {
            logError(
                "New aliases must be an array",
                "commandManager:updateAliases"
            );
            return false;
        }

        if (newAliases.length > 10) {
            logError(
                "Too many aliases (max 10)",
                "commandManager:updateAliases"
            );
            return false;
        }

        // Check for duplicates within the new aliases
        const seenAliases = new Set<string>();
        for (const alias of newAliases) {
            if (!alias || alias.trim() === "") {
                logError(
                    "Alias cannot be empty",
                    "commandManager:updateAliases"
                );
                return false;
            }

            if (alias.length > 20) {
                logError(
                    "Alias too long (max 20 characters)",
                    "commandManager:updateAliases"
                );
                return false;
            }

            if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
                logError(
                    "Alias can only contain letters, numbers, hyphens, and underscores",
                    "commandManager:updateAliases"
                );
                return false;
            }

            if (alias === commandName) {
                logError(
                    "Alias cannot be the same as the command name",
                    "commandManager:updateAliases"
                );
                return false;
            }

            if (seenAliases.has(alias)) {
                logError(
                    `Duplicate alias: ${alias}`,
                    "commandManager:updateAliases"
                );
                return false;
            }
            seenAliases.add(alias);

            // Check if this alias conflicts with any existing command
            if (this.commands.has(alias)) {
                logError(
                    `Alias '${alias}' conflicts with existing command '${alias}'`,
                    "commandManager:updateAliases"
                );
                return false;
            }

            // Check if this alias is already used by another command
            const existingCommandForAlias = this.aliasMap.get(alias);
            if (
                existingCommandForAlias &&
                existingCommandForAlias !== commandName
            ) {
                logError(
                    `Alias '${alias}' is already used by command '${existingCommandForAlias}'`,
                    "commandManager:updateAliases"
                );
                return false;
            }
        }

        // Remove old aliases from alias map
        if (command.aliases) {
            for (const oldAlias of command.aliases) {
                this.aliasMap.delete(oldAlias);
            }
        }

        // Update command aliases
        command.aliases = newAliases;

        // Add new aliases to alias map
        for (const alias of newAliases) {
            this.aliasMap.set(alias, commandName);
        }

        logInfo(
            `Updated aliases for command '${commandName}': ${newAliases.join(
                ", "
            )}`,
            "commandManager:updateAliases"
        );
        return true;
    }

    // Method to reload all command aliases from config
    reloadCommandAliasesFromConfig(): void {
        const commandsConfig = Config.get("commandsConfig") || {};

        for (const [commandName, command] of this.commands.entries()) {
            const savedConfig = commandsConfig[commandName] || {};
            const savedAliases = savedConfig.aliases || [];

            // Only update if aliases have actually changed
            if (
                JSON.stringify(command.aliases?.sort()) !==
                JSON.stringify(savedAliases.sort())
            ) {
                logDebug(
                    `Reloading aliases for command '${commandName}' from config: ${savedAliases.join(
                        ", "
                    )}`,
                    "CommandManager"
                );
                this.updateCommandAliases(commandName, savedAliases);
            }
        }
    }

    // Cooldown management methods
    public checkGlobalCooldown(): boolean {
        const globalCooldownEnabled = Config.get("globalCooldownEnabled");
        if (!globalCooldownEnabled) return false;

        const now = Date.now();
        if (now < this.globalCooldownEnd) {
            return true; // Still in cooldown
        }
        return false; // Not in cooldown
    }

    public checkUserCooldown(username: string): boolean {
        const perUserCooldownEnabled = Config.get("perUserCooldownEnabled");
        if (!perUserCooldownEnabled) return false;

        const now = Date.now();
        const userCooldownEnd = this.userCooldowns.get(username.toLowerCase());

        if (userCooldownEnd && now < userCooldownEnd) {
            return true; // Still in cooldown
        }
        return false; // Not in cooldown
    }

    public setGlobalCooldown(): void {
        const globalCooldownEnabled = Config.get("globalCooldownEnabled");
        if (!globalCooldownEnabled) return;

        const cooldownSeconds = parseInt(
            Config.get("globalCooldownSeconds") || "30"
        );
        this.globalCooldownEnd = Date.now() + cooldownSeconds * 1000;
        logDebug(
            `Global cooldown set for ${cooldownSeconds} seconds`,
            "CommandManager"
        );
    }

    public setUserCooldown(username: string): void {
        const perUserCooldownEnabled = Config.get("perUserCooldownEnabled");
        if (!perUserCooldownEnabled) return;

        const cooldownSeconds = parseInt(
            Config.get("perUserCooldownSeconds") || "60"
        );
        this.userCooldowns.set(
            username.toLowerCase(),
            Date.now() + cooldownSeconds * 1000
        );
        logDebug(
            `User cooldown set for ${username} for ${cooldownSeconds} seconds`,
            "CommandManager"
        );
    }

    public getRemainingCooldownTime(endTime: number): number {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        return Math.max(0, remaining);
    }

    public getUserCooldownEnd(username: string): number | undefined {
        return this.userCooldowns.get(username.toLowerCase());
    }

    public getGlobalCooldownEnd(): number {
        return this.globalCooldownEnd;
    }
}

function isModerator(badges: string[], username: string) {
    // Check if user has moderator badges
    if (badges.includes("broadcaster") || badges.includes("moderator")) {
        return true;
    }

    // Check if user is in custom moderators list
    const customModerators = Config.get("customModerators") || [];
    return customModerators.includes(username.toLowerCase());
}
