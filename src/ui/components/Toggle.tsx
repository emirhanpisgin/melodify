import React from "react";
import { cn } from "../../shared/utils";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "success" | "danger";
    className?: string;
    label?: string;
    labelClassName?: string;
}

export default function Toggle({
    checked,
    onChange,
    disabled = false,
    size = "md",
    variant = "default",
    className,
    label,
    labelClassName
}: ToggleProps) {
    const sizeClasses = {
        xs: {
            container: "w-8 h-5",
            thumb: "w-4 h-4",
            translate: "translate-x-3",
        },
        sm: {
            container: "w-9 h-[1.375rem]",
            thumb: "w-[1.125rem] h-[1.125rem]",
            translate: "translate-x-3.5",
        },
        md: {
            container: "w-10 h-6",
            thumb: "w-5 h-5",
            translate: "translate-x-4",
        },
        lg: {
            container: "w-12 h-7",
            thumb: "w-6 h-6",
            translate: "translate-x-5",
        }
    };

    const variantClasses = {
        default: {
            unchecked: "bg-zinc-700",
            checked: "bg-blue-500"
        },
        success: {
            unchecked: "bg-zinc-700",
            checked: "bg-green-500"
        },
        danger: {
            unchecked: "bg-zinc-700",
            checked: "bg-red-500"
        }
    };

    const currentSize = sizeClasses[size];
    const currentVariant = variantClasses[variant];

    return (
        <label className={cn("flex items-center gap-3 cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
            <span className={cn("relative inline-block align-middle select-none", currentSize.container)}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    disabled={disabled}
                    className="peer opacity-0 absolute inset-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                />
                <span className={cn(
                    "block rounded-full transition-colors",
                    currentSize.container,
                    checked ? currentVariant.checked : currentVariant.unchecked
                )}></span>
                <span className={cn(
                    "absolute bg-white rounded-full shadow-md transition-transform left-0.5 top-0.5",
                    currentSize.thumb,
                    checked ? currentSize.translate : "translate-x-0"
                )}></span>
            </span>
            {label && (
                <span className={cn("text-base font-medium", labelClassName)}>
                    {label}
                </span>
            )}
        </label>
    );
} 