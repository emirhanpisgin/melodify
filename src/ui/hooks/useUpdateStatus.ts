// useUpdateStatus.ts
// Custom React hook for managing application update status and progress.

import { useEffect, useState } from "react";

/**
 * Update status types for the application.
 */
export type UpdateStatus =
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
    speed: number;
    eta: number;
}

/**
 * Return type for the useUpdateStatus hook.
 */
interface UseUpdateStatusReturn {
    status: UpdateStatus;
    progress?: UpdateProgress;
}

/**
 * Custom hook for managing application update status.
 * Listens for update events from the main process and provides current status and progress.
 * 
 * @returns Object containing current update status and progress information.
 */
export function useUpdateStatus(): UseUpdateStatusReturn {
    const [status, setStatus] = useState<UpdateStatus>("idle");
    const [progress, setProgress] = useState<UpdateProgress | undefined>(undefined);

    useEffect(() => {
        // Listen for update status events from the main process
        const handleUpdateStatus = (event: any, data: any) => {
            setStatus(data.status);
            
            // Update progress if provided
            if (data.progress) {
                setProgress(data.progress);
            } else {
                setProgress(undefined);
            }
        };

        // Set up event listener
        window.electronAPI?.on?.("update:status", handleUpdateStatus);

        // Cleanup event listener on unmount
        return () => {
            window.electronAPI?.removeListener?.("update:status", handleUpdateStatus);
        };
    }, []);

    return { status, progress };
}
