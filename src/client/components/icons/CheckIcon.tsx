import React from 'react';
import { cn } from '../../../lib/utils';

interface CheckIconProps extends React.HTMLAttributes<HTMLOrSVGElement> { }

export default function CheckIcon({ className, ...props }: CheckIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props} className={cn("h-6 w-6", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l6 6L22 2" />
        </svg>
    );
}
