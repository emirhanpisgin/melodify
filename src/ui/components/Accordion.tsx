// Accordion.tsx
// Modern, minimal, accessible accordion component with smooth expand/collapse.

import React, { useState, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/shared/utils";

/**
 * Props for the Accordion component.
 * @property title - The title text for the accordion header.
 * @property children - The content to be shown/hidden.
 * @property defaultOpen - Whether the accordion should be open by default.
 * @property className - Additional CSS classes.
 */
interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

/**
 * Minimal, accessible Accordion with smooth expand/collapse and clear focus/hover.
 */
export default function Accordion({
    title,
    children,
    defaultOpen = false,
    className,
}: AccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);

    /**
     * Toggles the accordion open/closed state.
     */
    const toggleAccordion = () => setIsOpen((open) => !open);

    return (
        <div className={cn("", className)}>
            <button
                onClick={toggleAccordion}
                className={cn(
                    "w-full flex items-center justify-between text-left bg-zinc-800 hover:bg-zinc-700 transition-colors px-3 py-3 outline-none rounded-lg",
                    "focus-visible:ring-2 focus-visible:ring-blue-500"
                )}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
                <span className="font-medium text-white select-none">
                    {title}
                </span>
                <ChevronDownIcon
                    className={cn(
                        "w-5 h-5 text-zinc-400 transition-transform duration-200",
                        isOpen ? "rotate-180" : "rotate-0"
                    )}
                />
            </button>

            <div
                id={`accordion-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
                ref={contentRef}
                style={{ maxHeight: isOpen ? "1000px" : 0 }}
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out bg-zinc-900 px-3",
                    isOpen ? "py-2 opacity-100" : "py-0 opacity-0"
                )}
            >
                {children}
            </div>
        </div>
    );
}
