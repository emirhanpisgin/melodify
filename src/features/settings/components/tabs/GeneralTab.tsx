import { useEffect, useState } from "react";
import Input from "../../../../ui/components/Input";
import Toggle from "../../../../ui/components/Toggle";
import MultipleInput from "../../../../ui/components/MultipleInput";

interface GeneralTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: Record<string, string>;
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

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                        <h3 className="text-md font-medium text-white">Start with operating system</h3>
                        <p className="text-sm text-gray-400">Automatically launch the app on system startup.</p>
                    </div>
                    <Toggle checked={startupStatus} onChange={handleStartupToggle} />
                </div>
            </div>

            {/* This is a placeholder for other settings that might exist */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Advanced</h2>
                <button onClick={handleManualCheck}>Check for Updates</button>
            </div>
        </div>
    );
} 