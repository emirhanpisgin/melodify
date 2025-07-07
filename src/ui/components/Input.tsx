import React, { forwardRef } from "react";
import { cn } from "../../shared/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    error?: boolean;
    maxLength?: number;
    showCharacterCount?: boolean;
    inputSize?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
    className, 
    label, 
    helperText, 
    error = false,
    id,
    maxLength,
    showCharacterCount = false,
    value = "",
    inputSize = "md",
    ...props 
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const currentLength = typeof value === 'string' ? value.length : 0;
    
    const sizeClasses = {
        sm: "px-2 py-1 text-sm",
        md: "px-3 py-2 text-base",
        lg: "px-4 py-3 text-lg"
    };
    
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-white">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={cn(
                    "bg-zinc-800 border-none outline-none focus:ring-2 rounded text-white transition-all",
                    sizeClasses[inputSize],
                    error 
                        ? "focus:ring-red-500" 
                        : "focus:ring-green-500",
                    className
                )}
                maxLength={maxLength}
                value={value}
                {...props}
            />
            <div className="flex justify-between items-center">
                {helperText && (
                    <span className={cn(
                        "text-xs",
                        error ? "text-red-400" : "text-zinc-400"
                    )}>
                        {helperText}
                    </span>
                )}
                {showCharacterCount && maxLength && (
                    <span className={cn(
                        "text-xs ml-auto",
                        currentLength > maxLength * 0.9 ? "text-yellow-400" : "text-zinc-500"
                    )}>
                        {currentLength}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
});

Input.displayName = "Input";

export default Input; 