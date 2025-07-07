import { ErrorBoundary } from "../ui/components/ErrorBoundary";
import { useState, useEffect } from "react";
import HomePage from "../ui/components/HomePage";
import Settings from "../features/settings/components/Settings";
import Titlebar from "../ui/components/Titlebar";
import UpdateDialog from "../ui/components/UpdateDialog";

export default function App() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [updateStatus, setUpdateStatus] = useState("");
    const [updateInfo, setUpdateInfo] = useState("");

    const handleMinimize = () => {
        window.electronAPI?.minimize?.();
    };
    const handleClose = () => {
        window.electronAPI?.close?.();
    };
    const handleSettings = () => setSettingsOpen(state => !state);

    useEffect(() => {
        const handleUpdateStatus = (event: any, data: any) => {
            setUpdateStatus(data.status);
            if (data.status === "downloaded") {
                setUpdateInfo(data.info);
            }
        };

        const handleOpenSettings = () => {
            setSettingsOpen(true);
        };

        window.electronAPI.on("update:status", handleUpdateStatus);
        window.electronAPI.on("open-settings", handleOpenSettings);

        return () => {
            window.electronAPI.removeListener("update:status", handleUpdateStatus);
            window.electronAPI.removeListener("open-settings", handleOpenSettings);
        };
    }, []);

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-[100vh] w-screen bg-zinc-900 text-white">
                <Titlebar onMinimize={handleMinimize} onClose={handleClose} onSettings={handleSettings} />
                <div className="flex-1 flex flex-col justify-center items-center">
                    <HomePage />
                    {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
                </div>
                <UpdateDialog />
            </div>
        </ErrorBoundary>
    );
}
