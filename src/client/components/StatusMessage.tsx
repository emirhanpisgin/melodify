// components/Status.tsx
import { ReactNode } from "react";// or your custom icons
import { cn } from "../../lib/utils";
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";

type StatusProps = {
    loading: boolean;
    completed?: boolean;
    loadingMessage?: string;
    completedMessage?: string;
    notCompletedMessage?: string;
    className?: string;
};

/**
 * StatusMessage displays a status icon and message for loading, success, or error states.
 */
export default function StatusMessage({
    loading,
    completed,
    loadingMessage = "Loading...",
    completedMessage = "Completed successfully.",
    notCompletedMessage = "Not completed.",
    className = "",
}: StatusProps) {
    let icon: ReactNode;
    let message: string;

    if (loading) {
        icon = <LoaderCircleIcon className="size-4 animate-spin" />;
        message = loadingMessage;
    } else if (completed) {
        icon = <CheckIcon className="size-4 text-green-500" />;
        message = completedMessage || "Completed.";
    } else {
        icon = <XIcon className="size-4 text-red-500" />;
        message = notCompletedMessage || "Not completed.";
    }

    return (
        <div className={cn("text-white flex items-center gap-2 text-xs", className)}>
            {icon}
            <span>{message}</span>
        </div>
    );
}
