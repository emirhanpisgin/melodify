// StatusMessage.tsx
// Component for displaying status messages with loading, success, and error states.

import { cn } from "../../shared/utils";
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";

/**
 * Props for the StatusMessage component.
 * @property loading - Whether the status is in a loading state.
 * @property completed - Whether the operation has completed successfully.
 * @property loadingMessage - Message to display during loading.
 * @property completedMessage - Message to display when completed successfully.
 * @property notCompletedMessage - Message to display when not completed.
 * @property className - Additional CSS classes.
 */
type StatusProps = {
    loading: boolean;
    completed?: boolean;
    loadingMessage?: string;
    completedMessage?: string;
    notCompletedMessage?: string;
    className?: string;
};

/**
 * StatusMessage component displays different states with appropriate icons and messages.
 * Shows loading spinner, success checkmark, or error X icon based on the current state.
 */
export default function StatusMessage({
    loading,
    completed,
    loadingMessage = "Loading...",
    completedMessage = "Completed successfully.",
    notCompletedMessage = "Not completed.",
    className = "",
}: StatusProps) {
    let icon: React.ReactNode;
    let message: string;

    // Determine which icon and message to show based on state
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
        <div
            className={cn(
                "text-white flex items-center gap-2 text-xs",
                className
            )}
        >
            {icon}
            <span>{message}</span>
        </div>
    );
}
