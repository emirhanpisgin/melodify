// Toggle.tsx
// Reusable toggle/switch component with different variants and customizable styling.

import React from "react";
import { cn } from "../../shared/utils";

/**
 * Props for the Toggle component.
 * @property checked - Whether the toggle is in the "on" state.
 * @property onChange - Function called when the toggle state changes.
 * @property label - Label text for the toggle.
 * @property labelClassName - CSS classes for the label.
 * @property variant - Visual variant of the toggle.
 * @property size - Size of the toggle.
 * @property disabled - Whether the toggle is disabled.
 * @property className - Additional CSS classes.
 */
interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    labelClassName?: string;
    variant?: "default" | "success" | "warning" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    className?: string;
}

/**
 * Toggle component with different variants and sizes.
 * Provides a switch-like interface for boolean state changes.
 */
export default function Toggle({
    checked,
    onChange,
    label,
    labelClassName,
    variant = "default",
    size = "md",
    disabled = false,
    className,
}: ToggleProps) {
    // Define variant-specific colors
    const variantColors = {
        default: "bg-zinc-600",
        success: "bg-green-600",
        warning: "bg-yellow-600",
        danger: "bg-red-600",
    };

    // Define size-specific dimensions
    const sizeClasses = {
        sm: "w-8 h-4",
        md: "w-12 h-6",
        lg: "w-16 h-8",
    };

    const thumbSizeClasses = {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-7 h-7",
    };

    const thumbTranslateClasses = {
        sm: checked ? "translate-x-4" : "translate-x-0.5",
        md: checked ? "translate-x-6" : "translate-x-0.5",
        lg: checked ? "translate-x-8" : "translate-x-0.5",
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {/* Toggle switch */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900",
                    sizeClasses[size],
                    checked ? variantColors[variant] : "bg-zinc-700",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    "focus:ring-blue-500"
                )}
            >
                {/* Toggle thumb */}
                <span
                    className={cn(
                        "inline-block bg-white rounded-full transition-transform duration-200 ease-in-out",
                        thumbSizeClasses[size],
                        thumbTranslateClasses[size]
                    )}
                />
            </button>

            {/* Label */}
            {label && (
                <label
                    className={cn(
                        "text-sm cursor-pointer select-none",
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