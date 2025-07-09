import { CheckIcon, Loader2Icon } from "lucide-react";

interface SaveStatusProps {
    status: "idle" | "saving" | "saved" | "error";
}

export default function SaveStatus({ status }: SaveStatusProps) {
    switch (status) {
        case "saving":
            return (
                <div className="flex items-center gap-2 text-melodify-primary bg-melodify-primary/10 px-3 py-2 rounded-lg border border-melodify-primary/20 animate-fade-in-slide-right">
                    <Loader2Icon className="size-4 animate-spin" />
                    <span className="text-sm font-medium">Saving...</span>
                </div>
            );
        case "saved":
            return (
                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20 animate-fade-in-slide-right">
                    <CheckIcon className="size-4 animate-zoom-in" />
                    <span className="text-sm font-medium">Saved</span>
                </div>
            );
        case "error":
            return (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20 animate-fade-in-slide-right">
                    <span className="text-sm font-medium">Error saving</span>
                </div>
            );
        default:
            return null;
    }
}
