import { useEffect, useState } from "react";
import { Button } from "../../../../ui/components/Button";
import { useUpdateStatus } from "../../../../ui/hooks/useUpdateStatus";

export default function UpdateTab() {
    const { status, progress, manifest } = useUpdateStatus();
    const [currentVersion, setCurrentVersion] = useState("");

    useEffect(() => {
        window.electronAPI.getAppVersion().then(setCurrentVersion);
    }, []);

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
                    Application Updates
                </h2>
                <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
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
                                    : "N/A"}
                            </p>
                        </div>
                    </div>

                    {status === "downloading" && (
                        <div>
                            <p className="text-white mb-1">
                                Downloading update...
                            </p>
                            <div className="w-full bg-gray-600 rounded-full h-2.5">
                                <div
                                    className="bg-melodify-primary h-2.5 rounded-full"
                                    style={{
                                        width: `${progress?.percent?.toFixed(0) ?? 0}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <Button
                            onClick={handleCheck}
                            disabled={
                                status === "checking" ||
                                status === "downloading"
                            }
                        >
                            {status === "checking"
                                ? "Checking..."
                                : "Check for Updates"}
                        </Button>

                        {status === "available" && (
                            <Button onClick={handleDownload}>
                                Download Update
                            </Button>
                        )}

                        {status === "downloaded" && (
                            <Button
                                onClick={handleInstall}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Restart & Install
                            </Button>
                        )}
                    </div>
                    {status === "error" && (
                        <p className="text-red-500">
                            An error occurred. Please try again later.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
