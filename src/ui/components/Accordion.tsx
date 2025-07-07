import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "../../shared/utils";

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export default function Accordion({ 
    title, 
    children, 
    defaultOpen = false,
    className 
}: AccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("overflow-hidden", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-zinc-700/30 transition-colors text-left rounded-lg"
            >
                <span className="font-medium text-white">{title}</span>
                <div className="transition-transform duration-200 ease-in-out">
                    {isOpen ? (
                        <ChevronDownIcon className="size-4 text-zinc-400" />
                    ) : (
                        <ChevronRightIcon className="size-4 text-zinc-400" />
                    )}
                </div>
            </button>
            <div 
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{
                    maxHeight: isOpen ? '1000px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-10px)'
                }}
            >
                <div className="p-3 bg-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
} 