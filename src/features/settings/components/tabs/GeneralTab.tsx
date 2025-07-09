import { useEffect, useState } from "react";
import Toggle from "../../../../ui/components/Toggle";
import { Button } from "../../../../ui/components/Button";
import { useUpdateStatus } from "../../../../ui/hooks/useUpdateStatus";

interface GeneralTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: Record<string, string>;
}

export default function GeneralTab({
    config,
    onInput,
    validationErrors,
}: GeneralTabProps) {
    const [startupStatus, setStartupStatus] = useState<boolean>(false);
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
    const [currentVersion, setCurrentVersion] = useState("");
    const { status, progress, manifest } = useUpdateStatus();

    useEffect(() => {
        // Get the current startup status from the system
        window.electronAPI.getStartupStatus().then(setStartupStatus);

        // Get the current auto-update setting
        window.electronAPI.getAutoUpdate().then(setAutoUpdateEnabled);

        // Get the current app version
        window.electronAPI.getAppVersion().then(setCurrentVersion);
    }, []);

    const handleStartupToggle = (enabled: boolean) => {
        setStartupStatus(enabled);
        window.electronAPI.setStartupStatus(enabled);
        onInput("startOnStartup", enabled);
    };

    const handleAutoUpdateToggle = (enabled: boolean) => {
        setAutoUpdateEnabled(enabled);
        window.electronAPI.setAutoUpdate(enabled);
        onInput("autoUpdateEnabled", enabled);
    };

    const handleMinimizeToTrayToggle = (enabled: boolean) => {
        onInput("minimizeToTray", enabled);
    };

    const handleCheck = () => {
        window.electronAPI.checkForUpdates();
    };

    const handleDownload = () => {
        window.electronAPI.send("update:download", manifest);
    };

    const handleInstall = () => {
        window.electronAPI.send("update:install");
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                    Application Settings
                </h2>

                <div className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <h3 className="text-md font-medium text-white">
                                Start with operating system
                            </h3>
                            <p className="text-sm text-gray-400">
                                Automatically launch the app on system startup.
                            </p>
                        </div>
                        <Toggle
                            checked={startupStatus}
                            onChange={handleStartupToggle}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div>
                            <h3 className="text-md font-medium text-white">
                                Minimize to system tray
                            </h3>
                            <p className="text-sm text-gray-400">
                                Hide the app in the system tray when minimized.
                            </p>
                        </div>
                        <Toggle
                            checked={config.minimizeToTray || false}
                            onChange={handleMinimizeToTrayToggle}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                    Updates
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <h3 className="text-md font-medium text-white">
                                Automatic updates
                            </h3>
                            <p className="text-sm text-gray-400">
                                Automatically check for and download updates in
                                the background.
                            </p>
                        </div>
                        <Toggle
                            checked={autoUpdateEnabled}
                            onChange={handleAutoUpdateToggle}
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-white">
                                Current Version
                            </p>
                            <p className="text-gray-400">{currentVersion}</p>
                        </div>
                        <div>
                            <p className="font-medium text-white">
                                Latest Version
                            </p>
                            <p className="text-gray-400">
                                {status === "available"
                                    ? manifest?.version
                                    : currentVersion}
                            </p>
                        </div>
                    </div>

                    {status === "downloading" && (
                        <div>
                            <p className="text-white mb-1 text-sm">
                                Downloading update...
                            </p>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${progress?.percent?.toFixed(0) ?? 0}%`,
                                    }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {progress?.percent?.toFixed(0) ?? 0}% complete
                            </p>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <Button
                            onClick={handleCheck}
                            disabled={
                                status === "checking" ||
                                status === "downloading"
                            }
                            className="text-sm"
                        >
                            {status === "checking"
                                ? "Checking..."
                                : "Check for Updates"}
                        </Button>

                        {status === "available" && (
                            <Button
                                onClick={handleDownload}
                                className="text-sm"
                            >
                                Download Update
                            </Button>
                        )}

                        {status === "downloaded" && (
                            <Button
                                onClick={handleInstall}
                                className="bg-green-600 hover:bg-green-700 text-sm"
                            >
                                Restart & Install
                            </Button>
                        )}
                    </div>

                    {status === "error" && (
                        <p className="text-red-400 text-sm">
                            An error occurred while checking for updates. Please
                            try again later.
                        </p>
                    )}

                    {status === "not-available" && (
                        <p className="text-green-400 text-sm">
                            You are running the latest version.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
