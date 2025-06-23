import { cn } from "../../../lib/utils";

interface LoadingIconProps extends React.HTMLAttributes<HTMLOrSVGElement> { }

export default function LoadingIcon({ className, ...props }: LoadingIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            {...props}
            className={cn("animate-spin h-6 w-6", className)}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M12 0a12 12 0 0 1 12 12h-4a8 8 0 0 0-8-8V0z"
            />
        </svg>
    );
}
