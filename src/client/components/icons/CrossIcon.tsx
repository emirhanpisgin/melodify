import React from "react";
import { cn } from "../../../lib/utils";

interface CrossIconProps extends React.HTMLAttributes<HTMLOrSVGElement> { }

export default function CrossIcon({ className, ...props }: CrossIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props} className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 16 16" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 14L14 2M2 2l12 12" />
        </svg>
    );
}
