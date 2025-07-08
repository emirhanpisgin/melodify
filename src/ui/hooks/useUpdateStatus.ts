// useUpdateStatus.ts
// Custom React hook for managing application update status and progress.

import { useEffect, useState } from "react";

/**
 * Update status types for the application.
 */
type UpdateStatus =
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";

/**
 * Update progress information.
 */
interface UpdateProgress {
    percent: number;
    // Add other properties from electron-dl if needed
}

/**
 * Update manifest information.
 */
interface UpdateManifest {
    version: string;
    releaseNotes?: string;
    releaseName?: string;
    releaseDate?: string;
}

/**
 * Return type for the useUpdateStatus hook.
 */
interface UseUpdateStatusReturn {
    status: UpdateStatus;
    progress?: UpdateProgress | null;
    manifest?: UpdateManifest | null;
}

/**
 * Custom hook for managing application update status.
 * Listens for update events from the main process and provides current status and progress.
 *
 * @returns Object containing current update status, progress information, and the update manifest.
 */
export function useUpdateStatus(): UseUpdateStatusReturn {
    const [status, setStatus] = useState<UpdateStatus>("idle");
    const [progress, setProgress] = useState<UpdateProgress | null>(null);
    const [manifest, setManifest] = useState<UpdateManifest | null>(null);

    useEffect(() => {
        // Listen for update status events from the main process
        const handleUpdateStatus = (
            _event: any,
            status: UpdateStatus,
            data: any
        ) => {
            setStatus(status);
            if (status === "available") {
                setManifest(data);
                setProgress(null);
            } else if (status === "downloading") {
                setProgress(data);
            } else {
                setProgress(null);
            }
        };

        // Set up event listener
        window.electronAPI?.on?.("update:status", handleUpdateStatus);

        // Cleanup event listener on unmount
        return () => {
            window.electronAPI?.removeListener?.(
                "update:status",
                handleUpdateStatus
            );
        };
    }, []);

    return { status, progress, manifest };
}
