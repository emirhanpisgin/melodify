import { useState, useEffect, useRef } from "react";
import GeneralTab from "./tabs/GeneralTab";
import SongRequestsTab from "./tabs/SongRequestsTab";
import SecretsTab from "./tabs/SecretsTab";
import AdvancedTab from "./tabs/AdvancedTab";
import LogsTab from "./tabs/LogsTab";
import CommandsTab from "./tabs/CommandsTab";
import SaveStatus from "./tabs/SaveStatus";
import DebugTab from "./tabs/DebugTab";
import UpdateTab from "./tabs/UpdateTab";
import { validateField, validateUrl, validateClientId, validateClientSecret, validateTemplate, validateCommandAlias } from "./validation";

const TABS = [
    { key: "general", label: "General" },
    { key: "songRequests", label: "Song Requests" },
    { key: "commands", label: "Commands" },
    { key: "secrets", label: "Secrets" },
    { key: "advanced", label: "Advanced" },
    { key: "logs", label: "Logs" },
    { key: "updates", label: "Updates" },
    ...(process.env.NODE_ENV === "development" ? [{ key: "debug", label: "Debug" }] : []),
];

type Config = {
    prefix?: string;
    canAnyonePlaySong?: boolean;
    allowedBadges?: string[];
    currentSongFormat?: string;
    commandsConfig?: Record<string, { aliases?: string[] }>;
    autoUpdateEnabled?: boolean;
    startOnStartup?: boolean;
    minimizeToTray?: boolean;
    rewardTitle?: string;
    kickRedirectUri?: string;
    spotifyRedirectUri?: string;
    globalCooldownEnabled?: boolean;
    globalCooldownSeconds?: string;
    perUserCooldownEnabled?: boolean;
    perUserCooldownSeconds?: string;
    replyOnCooldown?: boolean;
    cooldownMessageTemplate?: string;
    [key: string]: string | boolean | string[] | Record<string, any> | undefined;
};

export default function Settings({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<string>("general");
    const [config, setConfig] = useState<Config>({});
    const [logs, setLogs] = useState<any[]>([]);
    const [commands, setCommands] = useState<any[]>([]);
    const [aliasInputs, setAliasInputs] = useState<{ [cmd: string]: string }>({});
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.electronAPI.invoke("config:get").then(setConfig);
        window.electronAPI.invoke("commands:getAll").then(setCommands);
    }, []);

    const validateConfig = (): boolean => {
        const errors: { [key: string]: string } = {};

        // Validate prefix
        const prefix = config.prefix;
        if (typeof prefix === "string") {
            if (!prefix || prefix.length < 1) {
                errors.prefix = "Prefix cannot be empty";
            } else if (prefix.length > 10) {
                errors.prefix = "Prefix too long (max 10 characters)";
            } else if (!/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(prefix)) {
                errors.prefix = "Prefix should be a special character (e.g., !, @, #, $)";
            }
        }

        // Validate URLs
        const kickRedirectUri = config.kickRedirectUri;
        if (typeof kickRedirectUri === "string" && kickRedirectUri) {
            const urlError = validateUrl(kickRedirectUri);
            if (urlError) errors.kickRedirectUri = urlError;
        }

        const spotifyRedirectUri = config.spotifyRedirectUri;
        if (typeof spotifyRedirectUri === "string" && spotifyRedirectUri) {
            const urlError = validateUrl(spotifyRedirectUri);
            if (urlError) errors.spotifyRedirectUri = urlError;
        }

        // Validate Client IDs and Secrets
        const spotifyClientId = config.spotifyClientId;
        if (typeof spotifyClientId === "string" && spotifyClientId) {
            const idError = validateClientId(spotifyClientId);
            if (idError) errors.spotifyClientId = idError;
        }

        const spotifyClientSecret = config.spotifyClientSecret;
        if (typeof spotifyClientSecret === "string" && spotifyClientSecret) {
            const secretError = validateClientSecret(spotifyClientSecret);
            if (secretError) errors.spotifyClientSecret = secretError;
        }

        const kickClientId = config.kickClientId;
        if (typeof kickClientId === "string" && kickClientId) {
            const idError = validateClientId(kickClientId);
            if (idError) errors.kickClientId = idError;
        }

        const kickClientSecret = config.kickClientSecret;
        if (typeof kickClientSecret === "string" && kickClientSecret) {
            const secretError = validateClientSecret(kickClientSecret);
            if (secretError) errors.kickClientSecret = secretError;
        }

        // Validate templates
        const songRequestReplyTemplate = config.songRequestReplyTemplate;
        if (typeof songRequestReplyTemplate === "string" && songRequestReplyTemplate) {
            const templateError = validateTemplate(songRequestReplyTemplate, ['title', 'artist']);
            if (templateError) errors.songRequestReplyTemplate = templateError;
        }

        const songRequestErrorTemplate = config.songRequestErrorTemplate;
        if (typeof songRequestErrorTemplate === "string" && songRequestErrorTemplate) {
            const templateError = validateTemplate(songRequestErrorTemplate, ['error']);
            if (templateError) errors.songRequestErrorTemplate = templateError;
        }

        const cooldownMessageTemplate = config.cooldownMessageTemplate;
        if (typeof cooldownMessageTemplate === "string" && cooldownMessageTemplate) {
            const templateError = validateTemplate(cooldownMessageTemplate, ['time']);
            if (templateError) errors.cooldownMessageTemplate = templateError;
        }

        const volumeChangeReplyTemplate = config.volumeChangeReplyTemplate;
        if (typeof volumeChangeReplyTemplate === "string" && volumeChangeReplyTemplate) {
            const templateError = validateTemplate(volumeChangeReplyTemplate, ['volume']);
            if (templateError) errors.volumeChangeReplyTemplate = templateError;
        }

        const volumeErrorTemplate = config.volumeErrorTemplate;
        if (typeof volumeErrorTemplate === "string" && volumeErrorTemplate) {
            const templateError = validateTemplate(volumeErrorTemplate, ['error']);
            if (templateError) errors.volumeErrorTemplate = templateError;
        }

        const volumeGetReplyTemplate = config.volumeGetReplyTemplate;
        if (typeof volumeGetReplyTemplate === "string" && volumeGetReplyTemplate) {
            const templateError = validateTemplate(volumeGetReplyTemplate, ['volume']);
            if (templateError) errors.volumeGetReplyTemplate = templateError;
        }

        // Validate custom moderators
        const customModerators = config.customModerators;
        if (Array.isArray(customModerators)) {
            const seenModerators = new Set<string>();
            for (const moderator of customModerators) {
                if (!moderator || typeof moderator !== "string") {
                    errors.customModerators = "All moderator usernames must be valid strings";
                    break;
                }
                if (moderator.length < 1) {
                    errors.customModerators = "Moderator usernames cannot be empty";
                    break;
                }
                if (moderator.length > 50) {
                    errors.customModerators = "Moderator usernames must be no more than 50 characters";
                    break;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(moderator)) {
                    errors.customModerators = "Moderator usernames can only contain letters, numbers, hyphens, and underscores";
                    break;
                }
                if (seenModerators.has(moderator.toLowerCase())) {
                    errors.customModerators = `Duplicate moderator username: ${moderator}`;
                    break;
                }
                seenModerators.add(moderator.toLowerCase());
            }
        }

        // Validate current song file path
        const currentSongFilePath = config.currentSongFilePath;
        if (typeof currentSongFilePath === "string" && currentSongFilePath) {
            if (currentSongFilePath.length > 500) {
                errors.currentSongFilePath = "File path too long (max 500 characters)";
            } else if (/[<>"|?*]/.test(currentSongFilePath)) {
                errors.currentSongFilePath = "File path contains invalid characters";
            }
        }

        // Validate cooldown settings
        const globalCooldownSeconds = config.globalCooldownSeconds;
        if (typeof globalCooldownSeconds === "string" && globalCooldownSeconds) {
            const seconds = parseInt(globalCooldownSeconds);
            if (isNaN(seconds) || seconds < 1 || seconds > 3600) {
                errors.globalCooldownSeconds = "Global cooldown must be between 1 and 3600 seconds";
            }
        }

        const perUserCooldownSeconds = config.perUserCooldownSeconds;
        if (typeof perUserCooldownSeconds === "string" && perUserCooldownSeconds) {
            const seconds = parseInt(perUserCooldownSeconds);
            if (isNaN(seconds) || seconds < 1 || seconds > 3600) {
                errors.perUserCooldownSeconds = "Per-user cooldown must be between 1 and 3600 seconds";
            }
        }

        // Validate command aliases - check for duplicates across ALL commands
        if (config.commandsConfig) {
            // Build a map of all aliases across all commands
            const allAliases = new Map<string, string>(); // alias -> commandName

            for (const [cmdName, cmdConfig] of Object.entries(config.commandsConfig)) {
                if (cmdConfig.aliases) {
                    for (const alias of cmdConfig.aliases) {
                        if (allAliases.has(alias)) {
                            const existingCommand = allAliases.get(alias);
                            errors[`${cmdName}_alias_${alias}`] = `Alternative name '${alias}' is already used by command '${existingCommand}'`;
                        } else {
                            allAliases.set(alias, cmdName);
                        }
                    }
                }
            }

            // Now validate individual aliases
            for (const [cmdName, cmdConfig] of Object.entries(config.commandsConfig)) {
                if (cmdConfig.aliases) {
                    const existingAliases: string[] = [];
                    for (const alias of cmdConfig.aliases) {
                        const aliasError = validateCommandAlias(alias, existingAliases, cmdName);
                        if (aliasError) {
                            errors[`${cmdName}_alias_${alias}`] = aliasError;
                        }
                        existingAliases.push(alias);
                    }
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const autoSave = async (newConfig: Config) => {
        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set saving status
        setSaveStatus('saving');

        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Validate the new config instead of the current state
                const errors: { [key: string]: string } = {};

                // Validate prefix
                const prefix = newConfig.prefix;
                if (typeof prefix === "string") {
                    if (!prefix || prefix.length < 1) {
                        errors.prefix = "Prefix cannot be empty";
                    } else if (prefix.length > 10) {
                        errors.prefix = "Prefix too long (max 10 characters)";
                    } else if (!/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(prefix)) {
                        errors.prefix = "Prefix should be a special character (e.g., !, @, #, $)";
                    }
                }

                // Validate URLs
                const kickRedirectUri = newConfig.kickRedirectUri;
                if (typeof kickRedirectUri === "string" && kickRedirectUri) {
                    const urlError = validateUrl(kickRedirectUri);
                    if (urlError) errors.kickRedirectUri = urlError;
                }

                const spotifyRedirectUri = newConfig.spotifyRedirectUri;
                if (typeof spotifyRedirectUri === "string" && spotifyRedirectUri) {
                    const urlError = validateUrl(spotifyRedirectUri);
                    if (urlError) errors.spotifyRedirectUri = urlError;
                }

                // Validate Client IDs and Secrets
                const spotifyClientId = newConfig.spotifyClientId;
                if (typeof spotifyClientId === "string" && spotifyClientId) {
                    const idError = validateClientId(spotifyClientId);
                    if (idError) errors.spotifyClientId = idError;
                }

                const spotifyClientSecret = newConfig.spotifyClientSecret;
                if (typeof spotifyClientSecret === "string" && spotifyClientSecret) {
                    const secretError = validateClientSecret(spotifyClientSecret);
                    if (secretError) errors.spotifyClientSecret = secretError;
                }

                const kickClientId = newConfig.kickClientId;
                if (typeof kickClientId === "string" && kickClientId) {
                    const idError = validateClientId(kickClientId);
                    if (idError) errors.kickClientId = idError;
                }

                const kickClientSecret = newConfig.kickClientSecret;
                if (typeof kickClientSecret === "string" && kickClientSecret) {
                    const secretError = validateClientSecret(kickClientSecret);
                    if (secretError) errors.kickClientSecret = secretError;
                }

                // Validate templates
                const songRequestReplyTemplate = newConfig.songRequestReplyTemplate;
                if (typeof songRequestReplyTemplate === "string" && songRequestReplyTemplate) {
                    const templateError = validateTemplate(songRequestReplyTemplate, ['title', 'artist']);
                    if (templateError) errors.songRequestReplyTemplate = templateError;
                }

                const songRequestErrorTemplate = newConfig.songRequestErrorTemplate;
                if (typeof songRequestErrorTemplate === "string" && songRequestErrorTemplate) {
                    const templateError = validateTemplate(songRequestErrorTemplate, ['error']);
                    if (templateError) errors.songRequestErrorTemplate = templateError;
                }

                const cooldownMessageTemplate = newConfig.cooldownMessageTemplate;
                if (typeof cooldownMessageTemplate === "string" && cooldownMessageTemplate) {
                    const templateError = validateTemplate(cooldownMessageTemplate, ['time']);
                    if (templateError) errors.cooldownMessageTemplate = templateError;
                }

                const volumeChangeReplyTemplate = newConfig.volumeChangeReplyTemplate;
                if (typeof volumeChangeReplyTemplate === "string" && volumeChangeReplyTemplate) {
                    const templateError = validateTemplate(volumeChangeReplyTemplate, ['volume']);
                    if (templateError) errors.volumeChangeReplyTemplate = templateError;
                }

                const volumeErrorTemplate = newConfig.volumeErrorTemplate;
                if (typeof volumeErrorTemplate === "string" && volumeErrorTemplate) {
                    const templateError = validateTemplate(volumeErrorTemplate, ['error']);
                    if (templateError) errors.volumeErrorTemplate = templateError;
                }

                const volumeGetReplyTemplate = newConfig.volumeGetReplyTemplate;
                if (typeof volumeGetReplyTemplate === "string" && volumeGetReplyTemplate) {
                    const templateError = validateTemplate(volumeGetReplyTemplate, ['volume']);
                    if (templateError) errors.volumeGetReplyTemplate = templateError;
                }

                // Validate custom moderators
                const customModerators = newConfig.customModerators;
                if (Array.isArray(customModerators)) {
                    const seenModerators = new Set<string>();
                    for (const moderator of customModerators) {
                        if (!moderator || typeof moderator !== "string") {
                            errors.customModerators = "All moderator usernames must be valid strings";
                            break;
                        }
                        if (moderator.length < 1) {
                            errors.customModerators = "Moderator usernames cannot be empty";
                            break;
                        }
                        if (moderator.length > 50) {
                            errors.customModerators = "Moderator usernames must be no more than 50 characters";
                            break;
                        }
                        if (!/^[a-zA-Z0-9_-]+$/.test(moderator)) {
                            errors.customModerators = "Moderator usernames can only contain letters, numbers, hyphens, and underscores";
                            break;
                        }
                        if (seenModerators.has(moderator.toLowerCase())) {
                            errors.customModerators = `Duplicate moderator username: ${moderator}`;
                            break;
                        }
                        seenModerators.add(moderator.toLowerCase());
                    }
                }

                // Validate current song file path
                const currentSongFilePath = newConfig.currentSongFilePath;
                if (typeof currentSongFilePath === "string" && currentSongFilePath) {
                    if (currentSongFilePath.length > 500) {
                        errors.currentSongFilePath = "File path too long (max 500 characters)";
                    } else if (/[<>"|?*]/.test(currentSongFilePath)) {
                        errors.currentSongFilePath = "File path contains invalid characters";
                    }
                }

                // Validate cooldown settings
                const globalCooldownSeconds = newConfig.globalCooldownSeconds;
                if (typeof globalCooldownSeconds === "string" && globalCooldownSeconds) {
                    const seconds = parseInt(globalCooldownSeconds);
                    if (isNaN(seconds) || seconds < 1 || seconds > 3600) {
                        errors.globalCooldownSeconds = "Global cooldown must be between 1 and 3600 seconds";
                    }
                }

                const perUserCooldownSeconds = newConfig.perUserCooldownSeconds;
                if (typeof perUserCooldownSeconds === "string" && perUserCooldownSeconds) {
                    const seconds = parseInt(perUserCooldownSeconds);
                    if (isNaN(seconds) || seconds < 1 || seconds > 3600) {
                        errors.perUserCooldownSeconds = "Per-user cooldown must be between 1 and 3600 seconds";
                    }
                }

                // Validate command aliases - check for duplicates across ALL commands
                if (newConfig.commandsConfig) {
                    // Build a map of all aliases across all commands
                    const allAliases = new Map<string, string>(); // alias -> commandName

                    for (const [cmdName, cmdConfig] of Object.entries(newConfig.commandsConfig)) {
                        if (cmdConfig.aliases) {
                            for (const alias of cmdConfig.aliases) {
                                if (allAliases.has(alias)) {
                                    const existingCommand = allAliases.get(alias);
                                    errors[`${cmdName}_alias_${alias}`] = `Alternative name '${alias}' is already used by command '${existingCommand}'`;
                                } else {
                                    allAliases.set(alias, cmdName);
                                }
                            }
                        }
                    }

                    // Now validate individual aliases
                    for (const [cmdName, cmdConfig] of Object.entries(newConfig.commandsConfig)) {
                        if (cmdConfig.aliases) {
                            const existingAliases: string[] = [];
                            for (const alias of cmdConfig.aliases) {
                                const aliasError = validateCommandAlias(alias, existingAliases, cmdName);
                                if (aliasError) {
                                    errors[`${cmdName}_alias_${alias}`] = aliasError;
                                }
                                existingAliases.push(alias);
                            }
                        }
                    }
                }

                setValidationErrors(errors);

                if (Object.keys(errors).length === 0) {
                    window.electronAPI.send("config:set", newConfig);
                    setSaveStatus('saved');

                    // Reset to idle after 2 seconds with fade-out animation
                    setTimeout(() => {
                        setSaveStatus('idle');
                    }, 2000);
                } else {
                    setSaveStatus('error');
                    setTimeout(() => {
                        setSaveStatus('idle');
                    }, 3000);
                }
            } catch (error) {
                setSaveStatus('error');
                setTimeout(() => {
                    setSaveStatus('idle');
                }, 3000);
            }
        }, 500); // 500ms debounce
    };

    const handleInput = (key: string, value: string | boolean | string[]) => {
        setConfig((prevConfig) => {
            const newConfig = { ...prevConfig, [key]: value };

            // Auto-save the new config
            autoSave(newConfig);

            return newConfig;
        });

        // Real-time validation
        const error = validateField(key, value);
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[key] = error;
            } else {
                delete newErrors[key];
            }
            return newErrors;
        });
    };

    useEffect(() => {
        if (tab === "logs") {
            window.electronAPI.invoke("log:getAll").then((allLogs) => setLogs(allLogs || []));
        }
    }, [tab]);

    useEffect(() => {
        if (tab !== "logs") return;
        const handler = (entry: any) => {
            setLogs((prev) => [...prev.slice(-999), entry])
        };
        window.electronAPI.on("log:entry", handler);
        return () => window.electronAPI.removeListener("log:entry", handler);
    }, [tab]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [tab]);

    const handleToggleCommand = (name: string, enabled: boolean) => {
        window.electronAPI.send("commands:setEnabled", { name, enabled });
        setCommands((prev) => prev.map(cmd => cmd.name === name ? { ...cmd, enabled } : cmd));
    };

    const renderTabContent = () => {
        switch (tab) {
            case "general":
                return <GeneralTab config={config} onInput={handleInput} validationErrors={validationErrors} />;
            case "songRequests":
                return <SongRequestsTab config={config} onInput={handleInput} validationErrors={validationErrors} />;
            case "secrets":
                return <SecretsTab config={config} onInput={handleInput} validationErrors={validationErrors} />;
            case "advanced":
                return <AdvancedTab config={config} onInput={handleInput} validationErrors={validationErrors} />;
            case "logs":
                return <LogsTab logs={logs} />;
            case "commands":
                return (
                    <CommandsTab
                        commands={commands}
                        config={config}
                        onInput={handleInput}
                        onToggleCommand={handleToggleCommand}
                        validationErrors={validationErrors}
                        aliasInputs={aliasInputs}
                        setAliasInputs={setAliasInputs}
                        autoSave={autoSave}
                        setTab={setTab}
                    />
                );
            case "updates":
                return <UpdateTab />;
            case "debug":
                if (process.env.NODE_ENV === "development") {
                    return <DebugTab />;
                }
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="fixed bottom-0 left-0 h-screen w-screen z-50 flex bg-zinc-900">
            <div className="w-40 border-r border-zinc-800 flex flex-col overflow-y-auto max-h-screen flex-shrink-0">
                {TABS.map((t) => (
                    <div
                        key={t.key}
                        className={`text-left px-3 py-2 transition-colors font-semibold cursor-pointer ${tab === t.key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </div>
                ))}
            </div>
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 py-4 relative max-h-full min-h-0 min-w-0">
                    {renderTabContent()}
                </div>
                {/* Save Status Indicator */}
                <div className="absolute top-4 right-4">
                    <SaveStatus status={saveStatus} />
                </div>
            </div>
        </div>
    );
}