import { RefreshCcwIcon } from "lucide-react";
import Toggle from "../../../../ui/components/Toggle";
import MultipleInput from "../../../../ui/components/MultipleInput";
import Input from "../../../../ui/components/Input";
import { useState, useEffect } from "react";

interface GeneralTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: { [key: string]: string };
}

export default function GeneralTab({ config, onInput, validationErrors }: GeneralTabProps) {
    const [startupStatus, setStartupStatus] = useState<boolean>(false);

    useEffect(() => {
        // Get the current startup status from the system
        window.electronAPI.getStartupStatus().then(setStartupStatus);
    }, []);

    const handleStartupToggle = (enabled: boolean) => {
        setStartupStatus(enabled);
        window.electronAPI.setStartupStatus(enabled);
        onInput("startOnStartup", enabled);
    };

    const handleManualCheck = () => {
        window.electronAPI.checkForUpdates();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>

                <div className="space-y-6">
                    {/* App Behavior Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">App Behavior</h3>
                        <div className="space-y-4">
                            <div>
                                <Toggle
                                    checked={config.startOnStartup || false}
                                    onChange={handleStartupToggle}
                                    label="Start on startup"
                                    labelClassName="text-white font-medium"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Automatically start the app when Windows boots up
                                </p>
                            </div>

                            <div>
                                <Toggle
                                    checked={config.minimizeToTray ?? false}
                                    onChange={(checked) => onInput("minimizeToTray", checked)}
                                    label="Minimize to tray"
                                    labelClassName="text-white font-medium"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Minimize the app to the system tray instead of the taskbar
                                </p>
                            </div>

                            <div>
                                <Toggle
                                    checked={config.autoUpdateEnabled ?? true}
                                    onChange={(checked) => onInput("autoUpdateEnabled", checked)}
                                    label="Auto-update"
                                    labelClassName="text-white font-medium"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Automatically check for and install updates
                                </p>
                                <button
                                    onClick={handleManualCheck}
                                    className="mt-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors"
                                >
                                    Check for updates now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">Permissions</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white font-medium mb-2">
                                    Custom Moderators
                                </label>
                                <MultipleInput
                                    values={config.customModerators || []}
                                    onChange={(values) => onInput("customModerators", values)}
                                    placeholder="Add moderator username"
                                    label="Usernames that have moderator permissions (in addition to channel mods)"
                                />
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
} 