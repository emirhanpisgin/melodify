// Toggle.tsx
// Reusable toggle/switch component with modern, consistent styling and clear accessibility.

import React from "react";
import { cn } from "../../shared/utils";

/**
 * Props for the Toggle component.
 * @property checked - Whether the toggle is in the "on" state.
 * @property onChange - Function called when the toggle state changes.
 * @property label - Label text for the toggle.
 * @property labelClassName - CSS classes for the label.
 * @property disabled - Whether the toggle is disabled.
 * @property className - Additional CSS classes.
 */
interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    labelClassName?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Toggle component with modern styling and clear focus/active states.
 * Accessible and customizable for different use cases.
 */
export default function Toggle({
    checked,
    onChange,
    label,
    labelClassName,
    disabled = false,
    className,
}: ToggleProps) {
    const color = checked ? "bg-melodify-primary" : "bg-zinc-500";
    const translate = checked ? "translate-x-[1.125rem]" : "translate-x-0.5";

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                tabIndex={0}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex items-center transition-colors rounded-full border border-transparent w-10 h-[1.375rem]",
                    color,
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-melodify-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 active:scale-95"
                )}
            >
                <span
                    className={cn(
                        "inline-block bg-white shadow rounded-full transition-transform duration-200 ease-in-out w-[1.125rem] h-[1.125rem]",
                        translate
                    )}
                />
            </button>
            {label && (
                <label
                    className={cn(
                        "text-sm cursor-pointer select-none text-white",
                        disabled ? "opacity-50 cursor-not-allowed" : "",
                        labelClassName
                    )}
                    onClick={() => !disabled && onChange(!checked)}
                >
                    {label}
                </label>
            )}
        </div>
    );
}
