import React from "react";

export default function EyeIcon({ open = false, ...props }: { open?: boolean } & React.SVGProps<SVGSVGElement>) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path d="M17.94 17.94C16.11 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12M1 1l22 22" stroke="currentColor" strokeWidth="2"/>
        </svg>
    );
}
