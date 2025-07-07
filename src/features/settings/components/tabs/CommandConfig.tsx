import Toggle from "../../../../ui/components/Toggle";
import Input from "../../../../ui/components/Input";
import MultipleInput from "../../../../ui/components/MultipleInput";
import Accordion from "../../../../ui/components/Accordion";

interface CommandConfigProps {
    cmd: any;
    config: any;
    onInput: (key: string, value: any) => void;
    onToggleCommand: (name: string, enabled: boolean) => void;
    validationErrors: { [key: string]: string };
    aliasInputs: { [cmd: string]: string };
    setAliasInputs: (inputs: { [cmd: string]: string }) => void;
    autoSave: (newConfig: any) => void;
    setTab: (tab: string) => void;
}

const KICK_ROLES = ["vip", "og", "subscriber"]; // Excluding broadcaster and moderator since they can do anything

const REPLY_CONFIGS = [
    {
        key: "songRequest",
        label: "Song Request",
        replyToggle: "replyOnSongRequest",
        replyTemplate: "songRequestReplyTemplate",
        errorToggle: "replyOnSongRequestError",
        errorTemplate: "songRequestErrorTemplate",
        replyVars: "{title}, {artist}",
    },
    {
        key: "volume",
        label: "Volume Command",
        replyToggle: "replyOnVolumeChange",
        replyTemplate: "volumeChangeReplyTemplate",
        errorToggle: "replyOnVolumeError",
        errorTemplate: "volumeErrorTemplate",
        replyVars: "{volume}",
        successLabel: "Reply when setting volume",
        errorLabel: "Reply on volume errors",
    },
];

export default function CommandConfig({
    cmd,
    config,
    onInput,
    onToggleCommand,
    validationErrors,
    aliasInputs,
    setAliasInputs,
    autoSave,
    setTab
}: CommandConfigProps) {
    const cmdCfg = (config.commandsConfig?.[cmd.name] as { aliases?: string[] } | undefined) || {};
    const aliases = aliasInputs[cmd.name] !== undefined
        ? aliasInputs[cmd.name].split("\u0000").filter(Boolean)
        : (cmdCfg.aliases || cmd.aliases || []);

    return (
        <div className="pb-3 border-b border-zinc-800 last:border-b-0">
            {/* General Settings - Always Visible */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <div className="flex gap-4 items-center mb-2">
                        <div className="font-semibold text-white text-lg">{config.prefix || "!"}{cmd.name}</div>
                        <Toggle
                            checked={cmd.enabled}
                            onChange={(checked) => onToggleCommand(cmd.name, checked)}
                            label="Enabled"
                            size="sm"
                            variant="success"
                            labelClassName="text-sm"
                        />
                    </div>
                    <div className="text-zinc-400 text-sm mb-1">{cmd.description}</div>
                    <div className="text-zinc-500 text-xs">How to use: <code className="bg-zinc-700 px-1 rounded">{cmd.usage.replace("{prefix}", config.prefix || "!")}</code></div>
                </div>
            </div>

            {/* Aliases - Always Visible */}
            <div className="mb-2">
                <MultipleInput
                    values={aliases}
                    onChange={(newAliases: string[]) => {
                        const newAliasInputs = { ...aliasInputs, [cmd.name]: newAliases.join("\u0000") };
                        setAliasInputs(newAliasInputs);
                        const newConfig = {
                            ...config,
                            commandsConfig: {
                                ...(config.commandsConfig as Record<string, { aliases?: string[] }>),
                                [cmd.name]: {
                                    ...(config.commandsConfig?.[cmd.name] as { aliases?: string[] } || {}),
                                    aliases: newAliases,
                                },
                            },
                        };
                        autoSave(newConfig);
                    }}
                    placeholder="Add alternative command name and press Enter"
                    label="Alternative Command Names"
                    maxItems={10}
                    minLength={1}
                    maxLength={20}
                    allowDuplicates={false}
                    allExistingValues={(() => {
                        // Get all aliases from other commands
                        const allAliases: string[] = [];
                        if (config.commandsConfig) {
                            for (const [otherCmdName, otherCmdConfig] of Object.entries(config.commandsConfig)) {
                                if (otherCmdName !== cmd.name && (otherCmdConfig as { aliases?: string[] }).aliases) {
                                    allAliases.push(...(otherCmdConfig as { aliases?: string[] }).aliases!);
                                }
                            }
                        }
                        return allAliases;
                    })()}
                    validateItem={(alias, currentAliases) => {
                        // Additional validation for command aliases
                        if (alias === cmd.name) {
                            return "Alternative name cannot be the same as the main command";
                        }
                        if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
                            return "Alternative name can only contain letters, numbers, hyphens, and underscores";
                        }
                        return null;
                    }}
                />
            </div>

            {/* Song Request Settings Button - Outside Accordion */}
            {cmd.name === "sr" && (
                <div className="mb-3">
                    <button
                        onClick={() => setTab("songRequests")}
                        className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                    >
                        Configure song request settings (permissions, cooldowns, etc.)
                    </button>
                </div>
            )}

            {/* Replies - In Accordion */}
            <Accordion title="Replies" defaultOpen={false}>
                <div className="flex flex-col gap-4">

                    {/* Reply Messages */}
                    <div className="flex flex-col gap-3">
                        <div className="font-bold text-sm text-white">Chat Responses</div>

                        {/* Cooldown Message Settings - Only for sr command */}
                        {cmd.name === "sr" && (
                            <div className="flex flex-col gap-2 rounded-lg">
                                <Toggle
                                    checked={!!config.replyOnCooldown}
                                    onChange={(checked) => onInput("replyOnCooldown", checked)}
                                    label="Reply on cooldown"
                                    variant="success"
                                />
                                <Input
                                    value={typeof config.cooldownMessageTemplate === "string" && config.cooldownMessageTemplate !== ""
                                        ? config.cooldownMessageTemplate as string
                                        : "Please wait {time} seconds before requesting another song."}
                                    onChange={e => onInput("cooldownMessageTemplate", e.target.value)}
                                    placeholder="Message to send when users are on cooldown"
                                    helperText="Available variables: {time}"
                                    maxLength={500}
                                    showCharacterCount={true}
                                    error={!!validationErrors.cooldownMessageTemplate}
                                />
                            </div>
                        )}

                        {REPLY_CONFIGS.filter((r) => r.key === cmd.name || (cmd.name === "sr" && r.key === "songRequest")).map((replyCfg) => {
                            // Determine the default values for each template
                            const defaultReply = replyCfg.key === "songRequest"
                                ? "Added to queue: {title} by {artist}"
                                : replyCfg.key === "volume"
                                    ? "Volume changed to {volume}%"
                                    : "";
                            const defaultError = "Error: {error}";
                            // Use config value, or default if empty
                            const replyValue = typeof config[replyCfg.replyTemplate] === "string" && config[replyCfg.replyTemplate] !== ""
                                ? config[replyCfg.replyTemplate] as string
                                : defaultReply;
                            const errorValue = typeof config[replyCfg.errorTemplate] === "string" && config[replyCfg.errorTemplate] !== ""
                                ? config[replyCfg.errorTemplate] as string
                                : defaultError;
                            return (
                                <div key={replyCfg.key} className="flex flex-col gap-2 rounded-lg">
                                    <Toggle
                                        checked={!!config[replyCfg.replyToggle]}
                                        onChange={(checked) => onInput(replyCfg.replyToggle, checked)}
                                        label={replyCfg.successLabel || "Reply on success"}
                                        variant="success"
                                    />
                                    <Input
                                        value={replyValue}
                                        onChange={e => onInput(replyCfg.replyTemplate, e.target.value)}
                                        placeholder="Success message to send in chat"
                                        helperText={`Available variables: ${replyCfg.replyVars}`}
                                        maxLength={500}
                                        showCharacterCount={true}
                                        error={!!validationErrors[replyCfg.replyTemplate]}
                                    />
                                    <Toggle
                                        checked={!!config[replyCfg.errorToggle]}
                                        onChange={(checked) => onInput(replyCfg.errorToggle, checked)}
                                        label={replyCfg.errorLabel || "Reply on error"}
                                        variant="danger"
                                    />
                                    <Input
                                        value={errorValue}
                                        onChange={e => onInput(replyCfg.errorTemplate, e.target.value)}
                                        placeholder="Error message to send in chat"
                                        helperText="Available variables: {error}"
                                        maxLength={500}
                                        showCharacterCount={true}
                                        error={!!validationErrors[replyCfg.errorTemplate]}
                                    />
                                </div>
                            );
                        })}

                        {/* Volume Get Configuration - Only for volume command */}
                        {cmd.name === "volume" && (
                            <div className="flex flex-col gap-2 rounded-lg">
                                <Toggle
                                    checked={!!config.replyOnVolumeGet}
                                    onChange={(checked) => onInput("replyOnVolumeGet", checked)}
                                    label="Enable volume checking feature"
                                    variant="success"
                                />
                                <div className="text-xs text-zinc-400 mb-2">
                                    When enabled, users can type <code className="bg-zinc-700 px-1 rounded">{config.prefix || "!"}volume</code> without arguments to get the current Spotify volume.
                                    The response will be sent to chat using the template below.
                                </div>
                                <Input
                                    value={typeof config.volumeGetReplyTemplate === "string" && config.volumeGetReplyTemplate !== ""
                                        ? config.volumeGetReplyTemplate as string
                                        : "Current Spotify volume is {volume}%"}
                                    onChange={e => onInput("volumeGetReplyTemplate", e.target.value)}
                                    placeholder="Message to send when getting current volume"
                                    helperText="Available variables: {volume}"
                                    maxLength={500}
                                    showCharacterCount={true}
                                    error={!!validationErrors.volumeGetReplyTemplate}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Accordion>
        </div>
    );
} 