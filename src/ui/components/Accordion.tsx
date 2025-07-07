// Accordion.tsx
// Collapsible accordion component with smooth animations and customizable styling.

import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "../../shared/utils";

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
 * Accordion component that can be expanded/collapsed.
 * Provides smooth animations and keyboard accessibility.
 */
export default function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    /**
     * Toggles the accordion open/closed state.
     */
    const toggleAccordion = () => setIsOpen(!isOpen);

    return (
        <div className={cn("border border-zinc-700 rounded-lg", className)}>
            {/* Accordion header */}
            <button
                onClick={toggleAccordion}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-zinc-800 hover:bg-zinc-750 transition-colors rounded-t-lg"
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
                <span className="font-medium text-white">{title}</span>
                {/* Chevron icon that rotates based on state */}
                {isOpen ? (
                    <ChevronDownIcon className="w-5 h-5 text-zinc-400" />
                ) : (
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400" />
                )}
            </button>

            {/* Accordion content */}
            <div
                id={`accordion-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="px-4 py-3 bg-zinc-900 rounded-b-lg">
                    {children}
                </div>
            </div>
        </div>
    );
} 