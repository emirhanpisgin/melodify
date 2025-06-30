import { useEffect, useState } from "react";

export type UpdateStatus =
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";

export function useUpdateStatus() {
    const [status, setStatus] = useState<UpdateStatus>("idle");
    const [progress, setProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.electronAPI?.onUpdateStatus?.((_event, data) => {
            setStatus(data.status);
            if (data.status === "downloading") setProgress(data.percent);
            else setProgress(null);
            if (data.status === "error") setError(data.error);
            else setError(null);
        });
    }, []);

    return { status, progress, error };
}
