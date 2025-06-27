import { useEffect, useState } from "react";

/**
 * Shows a dialog when an update is available or downloaded.
 */
export default function UpdateDialog() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);

    useEffect(() => {
        window.electronAPI?.on?.("update-available", () => setUpdateAvailable(true));
        window.electronAPI?.on?.("update-downloaded", () => setUpdateDownloaded(true));
    }, []);

    if (!updateAvailable && !updateDownloaded) return null;

    return (
        <div className="fixed bottom-8 right-8 bg-blue-700 text-white px-4 py-3 rounded shadow z-50">
            {updateDownloaded ? (
                <div>
                    <div className="font-bold mb-1">Update Ready!</div>
                    <div className="mb-2">Restart the app to apply the latest update.</div>
                    <button
                        className="bg-white text-blue-700 font-bold px-4 py-1 rounded"
                        onClick={() => window.electronAPI?.send?.("app:restart")}
                    >
                        Restart Now
                    </button>
                </div>
            ) : (
                <div>
                    <div className="font-bold mb-1">Update Available</div>
                    <div className="mb-2">A new version is downloading in the background.</div>
                </div>
            )}
        </div>
    );
}
