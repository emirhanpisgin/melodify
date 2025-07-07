// Input.tsx
// Reusable input component with validation, error states, and character count functionality.

import React, { forwardRef } from "react";
import { cn } from "../../shared/utils";

/**
 * Props for the Input component.
 * @property label - Label text for the input field.
 * @property error - Whether the input has an error state.
 * @property helperText - Helper text to display below the input.
 * @property showCharacterCount - Whether to show character count.
 * @property maxLength - Maximum number of characters allowed.
 * @property className - Additional CSS classes.
 * @property [rest] - All other HTML input props.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: boolean;
    helperText?: string;
    showCharacterCount?: boolean;
    maxLength?: number;
    className?: string;
}

/**
 * Input component with validation states, helper text, and character count.
 * Forwards ref to the underlying input element.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, showCharacterCount, maxLength, className, ...props }, ref) => {
        // Calculate character count if enabled
        const charCount = showCharacterCount && maxLength ? (props.value as string)?.length || 0 : null;

        return (
            <div className="flex flex-col gap-1">
                {/* Input label */}
                {label && (
                    <label className="text-sm font-medium text-white">
                        {label}
                    </label>
                )}
                
                {/* Input field */}
                <input
                    ref={ref}
                    className={cn(
                        "px-3 py-2 bg-zinc-800 border rounded text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        error ? "border-red-500" : "border-zinc-700",
                        className
                    )}
                    {...props}
                />
                
                {/* Helper text and character count */}
                <div className="flex justify-between items-center text-xs">
                    {/* Error or helper text */}
                    <span className={error ? "text-red-400" : "text-zinc-400"}>
                        {helperText}
                    </span>
                    
                    {/* Character count */}
                    {showCharacterCount && maxLength && (
                        <span className="text-zinc-500">
                            {charCount}/{maxLength}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input; 