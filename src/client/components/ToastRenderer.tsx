import { useEffect, useState } from "react";

interface Toast {
    message: string;
    type: "error" | "success" | "info";
}

export default function ToastRenderer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        if (!window) return;
        window.electronAPI.on("toast", (_, toast: Toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t !== toast));
            }, 5000);
        });
    }, [])

    return (
        <div className="fixed bottom-0 right-0 p-4 pointer-events-none w-full h-full">
            {toasts.map((toast) => (
                <div key={toast.message} className={`pointer-events-auto mb-4 max-w-sm w-full bg-zinc-800 text-white p-4 rounded-lg shadow-lg transition-transform transform ${toast.type === "error" ? "bg-red-600" : toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
