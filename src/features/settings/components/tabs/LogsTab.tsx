import { useEffect, useRef } from "react";

interface LogsTabProps {
    logs: any[];
}

export default function LogsTab({ logs }: LogsTabProps) {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-full w-full min-w-0">
            <div
                className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-left break-words whitespace-pre-wrap min-w-0"
                style={{ minHeight: 300, maxHeight: 400 }}
            >
                {logs.length === 0 && (
                    <div className="text-zinc-500">No logs yet.</div>
                )}
                {logs.map((log, i) => {
                    const level = log?.level ?? "info";
                    const timestamp = log?.timestamp ?? Date.now();
                    const message = log?.message ?? JSON.stringify(log);

                    if (
                        !log ||
                        typeof log.level !== "string" ||
                        typeof log.message !== "string"
                    ) {
                        return (
                            <div
                                key={i}
                                className="text-zinc-500 break-words whitespace-pre-wrap min-w-0"
                            >
                                [INVALID LOG] {JSON.stringify(log)}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={i}
                            className={
                                (level === "error"
                                    ? "text-red-400"
                                    : level === "warn"
                                      ? "text-yellow-300"
                                      : level === "debug"
                                        ? "text-purple-300"
                                        : "text-cyan-300") +
                                " break-words whitespace-pre-wrap min-w-0"
                            }
                        >
                            [{level.toUpperCase()}] [
                            {new Date(timestamp).toLocaleTimeString()}]{" "}
                            {message}
                        </div>
                    );
                })}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
