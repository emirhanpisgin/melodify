import Input from "@/ui/components/Input";
import MultipleInput from "@/ui/components/MultipleInput";
import Toggle from "@/ui/components/Toggle";
import { Hash, MessageSquare, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { validateCommandAlias, validateTemplate } from "../validation";

interface CommandsProps {
    config: any;
    commands: any[];
    onConfigChange: (key: string, value: any) => void;
    onCommandToggle: (name: string, enabled: boolean) => void;
}

export default function Commands({
    config,
    commands,
    onConfigChange,
    onCommandToggle,
}: CommandsProps) {
    const { t } = useTranslation();
    const enabledCount = commands.filter(
        (cmd) => config.commands?.[cmd.name]?.enabled !== false
    ).length;

    const handleAliasChange = (cmdName: string, aliases: string[]) => {
        const newCommands = {
            ...config.commands,
            [cmdName]: {
                ...config.commands?.[cmdName],
                aliases,
            },
        };
        onConfigChange("commands", newCommands);
    };

    const addAlias = (cmdName: string, alias: string) => {
        const cmdCfg = config.commands?.[cmdName] || {
            enabled: true,
            aliases: [],
        };

        // Validate the alias
        const existingAliases = cmdCfg.aliases || [];
        const validationError = validateCommandAlias(
            alias.trim(),
            existingAliases,
            cmdName
        );

        if (validationError) {
            // You could show a toast notification or set an error state here
            console.warn(`Alias validation failed: ${validationError}`);
            return;
        }

        if (alias.trim() && !cmdCfg.aliases?.includes(alias.trim())) {
            const newAliases = [...(cmdCfg.aliases || []), alias.trim()];
            handleAliasChange(cmdName, newAliases);
        }
    };

    const removeAlias = (cmdName: string, aliasToRemove: string) => {
        const cmdCfg = config.commands?.[cmdName] || {
            enabled: true,
            aliases: [],
        };
        const newAliases = (cmdCfg.aliases || []).filter(
            (alias: string) => alias !== aliasToRemove
        );
        handleAliasChange(cmdName, newAliases);
    };

    const handleCommandToggle = (cmdName: string, enabled: boolean) => {
        const newCommands = {
            ...config.commands,
            [cmdName]: {
                ...config.commands?.[cmdName],
                enabled,
            },
        };
        onConfigChange("commands", newCommands);
    };

    const handleReplyToggle = (key: string, enabled: boolean) => {
        onConfigChange(key, enabled);
    };

    const handleReplyTemplateChange = (key: string, template: string) => {
        // Validate template based on the key
        let allowedVars: string[] = [];
        if (key.includes("songRequest")) {
            allowedVars = ["title", "artist"];
        } else if (key.includes("volume")) {
            if (key.includes("Change") || key.includes("Get")) {
                allowedVars = ["volume"];
            } else {
                allowedVars = ["error"];
            }
        }

        if (allowedVars.length > 0) {
            const validationError = validateTemplate(template, allowedVars);
            if (validationError) {
                console.warn(
                    `Template validation failed for ${key}: ${validationError}`
                );
                // You could show a toast notification or set an error state here
            }
        }

        onConfigChange(key, template);
    };

    const getReplyConfig = (cmdName: string) => {
        switch (cmdName) {
            case "songRequest":
            case "sr":
                return {
                    successToggle: "replyOnSongRequest",
                    successTemplate: "songRequestReplyTemplate",
                    errorToggle: "replyOnSongRequestError",
                    errorTemplate: "songRequestErrorTemplate",
                    successLabel: t("commands.sr.replyOnSuccess"),
                    errorLabel: t("commands.sr.replyOnError"),
                    successPlaceholder: t("commands.sr.successPlaceholder"),
                    errorPlaceholder: t("commands.sr.errorPlaceholder"),
                    variables: t("commands.sr.variables"),
                };
            case "volume":
            case "vol":
                return {
                    successToggle: "replyOnVolumeChange",
                    successTemplate: "volumeChangeReplyTemplate",
                    errorToggle: "replyOnVolumeError",
                    errorTemplate: "volumeErrorTemplate",
                    getToggle: "replyOnVolumeGet",
                    getTemplate: "volumeGetReplyTemplate",
                    successLabel: t("commands.volume.replyOnChange"),
                    errorLabel: t("commands.volume.replyOnError"),
                    getLabel: t("commands.volume.replyOnGet"),
                    successPlaceholder: t("commands.volume.changePlaceholder"),
                    errorPlaceholder: t("commands.volume.errorPlaceholder"),
                    getPlaceholder: t("commands.volume.getPlaceholder"),
                    variables: t("commands.volume.variables"),
                };
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
                {t("commands.title")}
            </h2>

            <div className="bg-zinc-800/30 border border-zinc-700/50 p-4 rounded-md">
                <h3 className="text-base font-medium text-white mb-4">
                    {t("requests.commandPrefix")}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-2">
                            {t("commands.prefixCharacter")}
                        </label>
                        <Input
                            value={config.prefix || "!"}
                            onChange={(e) =>
                                onConfigChange("prefix", e.target.value)
                            }
                            placeholder="!"
                            maxLength={5}
                            className="max-w-24"
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                            {t("requests.commandPrefixDesc")}
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-base font-medium text-white">
                {t("commands.availableCommands")}
            </h3>

            {commands.length > 0 ? (
                <div className="space-y-4">
                    {commands.map((cmd) => {
                        const cmdCfg = config.commands?.[cmd.name] || {
                            enabled: true,
                            aliases: [],
                        };
                        const isEnabled = cmdCfg.enabled !== false;
                        const replyConfig = getReplyConfig(cmd.name);

                        return (
                            <div
                                key={cmd.name}
                                className="border border-zinc-700/50 rounded-lg p-4 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                            <Hash className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-medium text-white">
                                                {config.prefix || "!"}
                                                {cmd.name}
                                            </h4>
                                            <p className="text-sm text-zinc-400">
                                                {t(
                                                    `commands.${cmd.name}.description`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Toggle
                                        checked={isEnabled}
                                        onChange={(enabled) =>
                                            handleCommandToggle(
                                                cmd.name,
                                                enabled
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-700/30">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-200 mb-2">
                                            {t("commands.aliases")}
                                        </label>
                                        <MultipleInput
                                            values={cmdCfg.aliases}
                                            onChange={(values: string[]) =>
                                                handleAliasChange(
                                                    cmd.name,
                                                    values
                                                )
                                            }
                                            validateItem={(
                                                alias,
                                                currentAliases
                                            ) =>
                                                validateCommandAlias(
                                                    alias,
                                                    currentAliases,
                                                    cmd.name
                                                )
                                            }
                                            placeholder={t("commands.addAlias")}
                                            maxLength={20}
                                            minLength={1}
                                            allowDuplicates={false}
                                        />
                                    </div>

                                    {replyConfig && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                                <h5 className="text-sm font-medium text-white">
                                                    {t("commands.chatReplies")}
                                                </h5>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <label className="text-sm font-medium text-zinc-200">
                                                            {
                                                                replyConfig.successLabel
                                                            }
                                                        </label>
                                                        <span className="text-xs text-zinc-400">
                                                            {t(
                                                                "commands.sendConfirmationMessage"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Toggle
                                                        checked={
                                                            config[
                                                                replyConfig
                                                                    .successToggle
                                                            ] || false
                                                        }
                                                        onChange={(enabled) =>
                                                            handleReplyToggle(
                                                                replyConfig.successToggle,
                                                                enabled
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {config[
                                                    replyConfig.successToggle
                                                ] && (
                                                    <div className="pl-4 border-l-2 border-green-500/30">
                                                        <Input
                                                            value={
                                                                config[
                                                                    replyConfig
                                                                        .successTemplate
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                handleReplyTemplateChange(
                                                                    replyConfig.successTemplate,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={
                                                                replyConfig.successPlaceholder
                                                            }
                                                        />
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            {t(
                                                                "commands.availableVariables"
                                                            )}
                                                            :{" "}
                                                            <code className="bg-zinc-700 px-1 rounded text-zinc-300">
                                                                {
                                                                    replyConfig.variables
                                                                }
                                                            </code>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <label className="text-sm font-medium text-zinc-200">
                                                            {
                                                                replyConfig.errorLabel
                                                            }
                                                        </label>
                                                        <span className="text-xs text-zinc-400">
                                                            {t(
                                                                "commands.sendMessageOnFailure"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Toggle
                                                        checked={
                                                            config[
                                                                replyConfig
                                                                    .errorToggle
                                                            ] || false
                                                        }
                                                        onChange={(enabled) =>
                                                            handleReplyToggle(
                                                                replyConfig.errorToggle,
                                                                enabled
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {config[
                                                    replyConfig.errorToggle
                                                ] && (
                                                    <div className="pl-4 border-l-2 border-red-500/30">
                                                        <Input
                                                            value={
                                                                config[
                                                                    replyConfig
                                                                        .errorTemplate
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                handleReplyTemplateChange(
                                                                    replyConfig.errorTemplate,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={
                                                                replyConfig.errorPlaceholder
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Volume Get Reply - Only for volume command */}
                                            {replyConfig.getToggle && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <label className="text-sm font-medium text-zinc-200">
                                                                {
                                                                    replyConfig.getLabel
                                                                }
                                                            </label>
                                                            <span className="text-xs text-zinc-400">
                                                                {t(
                                                                    "commands.sendCurrentVolume"
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Toggle
                                                            checked={
                                                                config[
                                                                    replyConfig
                                                                        .getToggle
                                                                ] || false
                                                            }
                                                            onChange={(
                                                                enabled
                                                            ) =>
                                                                handleReplyToggle(
                                                                    replyConfig.getToggle,
                                                                    enabled
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    {config[
                                                        replyConfig.getToggle
                                                    ] && (
                                                        <div className="pl-4 border-l-2 border-blue-500/30">
                                                            <Input
                                                                value={
                                                                    config[
                                                                        replyConfig
                                                                            .getTemplate
                                                                    ] || ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleReplyTemplateChange(
                                                                        replyConfig.getTemplate,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder={
                                                                    replyConfig.getPlaceholder
                                                                }
                                                            />
                                                            <p className="text-xs text-zinc-400 mt-1">
                                                                {t(
                                                                    "commands.availableVariables"
                                                                )}
                                                                :{" "}
                                                                <code className="bg-zinc-700 px-1 rounded text-zinc-300">
                                                                    {
                                                                        replyConfig.variables
                                                                    }
                                                                </code>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Hash className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                    <h3 className="text-base font-medium text-white mb-2">
                        {t("commands.noCommandsAvailable")}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {t("commands.noCommandsDescription")}
                    </p>
                </div>
            )}
        </div>
    );
}
